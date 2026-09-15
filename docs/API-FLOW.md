# CineLog API flow

Step-by-step working of every HTTP API the app uses today. This is a map for planning flow and performance changes — no APIs were changed for this document.

There are no Next.js server actions. Persistence is Turso/libSQL via Drizzle. External catalog data comes from TMDB only.

---

## Shared plumbing

### Request / response shape

- Success bodies are raw JSON (`ok()` / `created()` in `src/lib/http/response.ts`). Nothing is wrapped in `{ data: ... }`.
- Errors are `{ error: string, details?: unknown }`.
- Route handlers catch thrown `AppError` and return its `status` + `message`. Unexpected errors log and return 500.

### Session

- Cookie name: `auth_token` (httpOnly, `sameSite: strict`, 24h TTL).
- JWT payload: `{ userId, username }`.
- `getSession()` returns the payload or `null`.
- `requireSession()` throws `AppError(401)` if missing/invalid.
- `src/proxy.ts` gates **UI routes** (matcher excludes `/api/*`). Each API route enforces auth itself.

### Client fetch

- `apiFetch` (`src/lib/http/client.ts`): native `fetch`; on **401** for mutating methods (`POST`/`PATCH`/`PUT`/`DELETE`), redirects to `/login` except login/signup.
- Library/content GETs from sagas use `fetch(..., { cache: "no-store" })`.
- `public/sw.js` skips all `/api/*` requests.

### TMDB wrapper

- `tmdbFetch` (`src/lib/tmdb/client.ts`) — server-only.
- Base: `https://api.themoviedb.org/3`
- Auth: `Authorization: Bearer ${TMDB_API_KEY}`
- Maps 404 → `AppError(404)`, 429 → `AppError(429)` (optional `retryAfterSeconds`), other failures → 502, missing key → 503.

### Redux entry

`src/store/rootSaga.ts` forks four sagas: `authSaga`, `searchSaga`, `librarySaga`, `contentDetailsSaga`. Collections and profile bypass Redux and call `fetch` / `apiFetch` from hooks.

---

## 1. Auth

### POST `/api/auth/login`

**Files:** `src/app/api/auth/login/route.ts` → `loginUser` in `src/services/auth.ts`

**Request:** `{ username, password }` validated by `loginSchema` (username 3–10 chars `[A-Za-z0-9_]`, password 6–20 with upper/lower/digit/symbol).

**Steps:**

1. `LoginForm` dispatches `loginRequest(data)`.
2. `authSaga.handleLogin` POSTs JSON to `/api/auth/login`.
3. Route parses JSON, `loginSchema.safeParse`. Invalid → 400 + Zod issues.
4. `loginUser`:
   1. `findUserByUsername`.
   2. Missing user or `bcryptjs.compare` fail → `AppError(401)` “Invalid username or password”.
   3. `createSessionToken({ userId, username })`.
5. Route `setAuthCookie(token)`.
6. 200 `{ user: { id, username, email?, displayName } }`.
7. Saga `authSuccess` then `window.location.replace("/")`.

**Performance:** one user lookup + bcrypt compare. Cookie write is cheap.

---

### POST `/api/auth/signup`

**Files:** `src/app/api/auth/signup/route.ts` → `signupUser`

**Request:** `{ username, email, password, displayName? }` (`signupSchema`).

**Steps:**

1. `SignupForm` → `signupRequest` → `authSaga.handleSignup`.
2. Validate body; 400 on failure.
3. `findUserByUsernameOrEmail`. Collision → 409.
4. `hash(password, 10)`, `insertUser`.
5. Create JWT, set cookie, 201 `{ user }`.
6. Saga `authSuccess` + redirect `/`.

**Performance:** bcrypt cost 10 is the slow step. Unique constraint on username/email is the conflict source of truth besides the pre-check.

---

### GET `/api/auth/me`

**Files:** `src/app/api/auth/me/route.ts` → `getCurrentUser`

**Steps:**

1. `Providers` mounts once and dispatches `initAuthRequest`.
2. `authSaga.handleInit` (guarded by `isInitializingAuth`) GETs `/api/auth/me`.
3. `getSession()`. No cookie/invalid JWT → 401.
4. `findUserById`. Missing user (stale JWT) → clear cookie, 401.
5. 200 `{ user }`.
6. Success → `authSuccess`. Failure → `initAuthFailure` and redirect `/login` unless already on login/signup.

**Performance:** JWT verify + one user row. Runs on every full page load of the app shell.

---

### POST `/api/auth/logout`

**Files:** `src/app/api/auth/logout/route.ts`

**Steps:**

1. Navbar / bottom nav dispatch `logoutRequest`.
2. `authSaga.handleLogout` POSTs `/api/auth/logout`.
3. Route `clearAuthCookie()`, 200 `{ success: true }`.
4. Saga always `logoutSuccess` + redirect `/login` (even if the request fails).

---

## 2. Profile

### PATCH `/api/user/profile`

**Files:** `src/app/api/user/profile/route.ts` → `updateUserProfile`  
**Caller:** `useProfileForm` (no saga)

**Request:** at least one of `username`, `email`, `displayName` (string | null), `newPassword` (+ `currentPassword`). `updateProfileSchema`.

**Steps:**

1. Settings form builds a sparse payload of changed fields; client also `safeParse`s the schema.
2. `apiFetch PATCH /api/user/profile`.
3. `requireSession()`.
4. `readJsonBody` + `updateProfileSchema`.
5. `findUserAndNameConflicts`. 404 if user gone; 409 if username/email taken by someone else.
6. Password change: require current password, bcrypt compare, hash new password.
7. `updateUser`. If username changed, mint a new JWT and `setAuthCookie`.
8. 200 `{ user }`.
9. Hook dispatches `userUpdated` into `authSlice`.

**Performance:** up to three user lookups (self + username owner + email owner) + optional bcrypt. Not on a hot path.

---

## 3. Search

### GET `/api/search/movie`

**Files:** `src/app/api/search/movie/route.ts` → `searchTitles({ type: "movie" })`  
**Auth:** optional (`getSession`). Logged-in users get watchlist enrichment.

**Query:** `query` (required, 1–100), `year?` (1900–current), `region?` (ISO 3166-1 alpha-2), `page?` (default 1, max 500).

**Steps:**

1. `SearchDialog` / `useSearchDialog` debounce **500ms**, then `searchRequested`. Pagination uses the same action with `page`.
2. `searchSaga.fetchSearchResults` (`takeLatest` cancels in-flight searches) GETs `/api/search/movie?...`.
3. `parseSearchQuery`. Empty query → 400.
4. `searchTitles`:
   1. TMDB `GET /search/movie?query&include_adult=false&language=en-US&page&year?&region?`.
   2. Collect genre IDs + TMDB IDs from results.
   3. `findSearchLookups` (Turso): genre names, which IDs are in the user’s library, watch status.
   4. Map results: full poster URL (`https://image.tmdb.org/t/p/w200`), year string, `is_present_in_watchlist`, `watch_status`.
5. 200 `{ page, total_pages, total_results, results[] }`.
6. `searchSucceeded` → Redux `search.movie`.

**Result item:** `{ id, genres[], original_language, overview, poster_path, release_date, title, vote_average, is_present_in_watchlist, watch_status }`.

---

### GET `/api/search/series`

Same as movie, except:

- Route: `src/app/api/search/series/route.ts`
- TMDB `GET /search/tv` with `first_air_date_year` instead of `year`
- No `region` param
- Redux store: `search.series`

**Performance (both):** every keystroke-after-debounce hits TMDB (network + rate limit) plus a DB lookup. `takeLatest` drops stale responses. No server cache (`force-dynamic`). Guest search still hits TMDB; DB enrichment is skipped without `userId`.

---

## 4. Library browse

### GET `/api/library`

**Files:**  
`src/app/api/library/route.ts` → `getLibrary` (`src/services/library.ts`) → `listLibraryRows` (`src/repositories/library.ts`)

**Auth:** required. `export const dynamic = "force-dynamic"`.

**Query (`libraryQuerySchema`):**

| Param | Notes |
|---|---|
| `type` | `movie` \| `series` (required) |
| `offset` | default 0 |
| `limit` | default 20, max 50 |
| `q` | optional title search |
| `filter_field` + `filter_operator` + `filter_value` | all three or none |
| `sort_field` | default `created_at` |
| `sort_direction` | `0` asc / `1` desc (default 1) |
| `group_by` | `0` watch status, `1` impression, `2` TMDB status |
| `group_key` | fetch one group’s next page |

**Response:** `{ movies[], series[], metadata: { count: { movies, series }, offset, limit, hasMore, groups? } }`

`groups[]`: `{ key, label, count, hasMore? }`

Client page size is `LIBRARY_PAGE_SIZE = 20`.

#### Mode A — flat list (no `group_by`)

1. `LibraryView` mounts → `libraryRequested({ type })`.
2. Saga `fetchLibrary` runs only on `/library/*` and only if that media type is not already loaded.
3. Builds params via `toLibrarySearchParams(type, 0, 20, query)`.
4. GET `/api/library?...` `cache: no-store`.
5. `requireSession` + parse query.
6. `listLibraryRows`:
   1. Batch: movie count + series count (always both, so the header can show totals).
   2. One paged select (`limit` + `offset`) for the requested type.
   3. Genre attach + (series) season-progress attach.
7. `getLibrary` maps rows → API shape. `hasMore = offset + pageLength < totalForType`.
8. `librarySucceeded` stores the flat array; `moviesHasMore` / `seriesHasMore` from metadata.

**Load more (infinite scroll):** sentinel in `LibrarySection` → `libraryPageRequested` → `fetchLibraryPage`. Offset = current `movies.length` / `series.length`. Deduped with `activePageFetches`. Appends via `appendUnique`. Stale responses dropped with `queryNonce`.

**Filter/sort/search:** `useLibraryBrowse` dispatches `libraryQueryUpdated` (clears lists/groups/loaded flags, bumps `queryNonce`) then `libraryRequested`. Text search is debounced **400ms**.

#### Mode B — grouped overview (`group_by` set, no `group_key`)

Same client start, but repository:

1. Batch counts **plus** `GROUP BY` group key (watch status / impression / TMDB status).
2. Then **one item query per group**, each `LIMIT limit` (no offset). N groups → N selects in a second batch.
3. Concatenate those first pages.
4. Service sets `hasMore` if **any** group still has unloaded items; `withGroupHasMore` stamps each group.
5. Client `buildGroupPages` splits the concatenated list into `movieGroupPages` / `seriesGroupPages`. Top-level `moviesHasMore` is forced **false**.

#### Mode C — one group’s next page (`group_by` + `group_key`)

1. Grouped carousel `onNearEnd` → `libraryGroupPageRequested`.
2. Saga offset = that group’s `page.items.length`, param `group_key`.
3. Repository: one scoped paged select.
4. `libraryGroupPageSucceeded` appends to that group page **and** the flat array.

**Performance today:**

- Flat: 1 count-batch (2 count queries) + 1 page query + genre/season follow-ups.
- Grouped overview: 2 counts + 1 group-by + **N item queries**. Cost grows with number of groups (watch status is 4; impression is 4 including unset).
- Counts for the *other* media type are always computed even though `type` is required.
- Client never caches; every browse change refetches from offset 0.
- Mutations do not refetch the library.

---

## 5. Movies

All four methods live in `src/app/api/movie/[id]/route.ts`. Path `[id]` is a positive integer TMDB id (`parsePositiveIntId`).

### GET `/api/movie/[id]`

**Auth:** optional. **Service:** `getMovieDetails`.

**Steps:**

1. Movie page `useContentDetails("movie", id)` → `detailsRequested`.
2. `contentDetailsSaga.fetchContentDetails` GETs `/api/movie/{id}` `cache: no-store`.
3. `fetchTmdbMovie`: TMDB `GET /movie/{id}?append_to_response=release_dates,credits&language=en-US`.
4. If session: `findUserMovieImpression`.
5. Map: certification from release dates, trimmed credits (`pickCastAndDirectors`), library fields (`is_present_in_watchlist`, `impression`, `watch_status`).
6. `detailsSucceeded` → `contentDetails.movie[id]`.

Also called **server-side** from `src/app/movie/[id]/page.tsx` `generateMetadata` (SEO/Open Graph) — a **second** TMDB fetch when the client saga runs on the same page.

**Performance:** TMDB round trip dominates. Duplicate SSR metadata + client fetch. No HTTP cache.

---

### POST `/api/movie/[id]`

**Auth:** required. **Service:** `addMovieToLibrary`.

**Request body:** full TMDB `MoviePayload` already on the client. **No TMDB refetch.**

**Steps:**

1. Detail `ActionBar` “Add to Watchlist” → `useContentMutation("add-watchlist")` → `mutationRequested`.
2. Saga POSTs the in-memory `content` object via `apiFetch`.
3. `insertUserMovie`. Unique constraint → 409.
4. 201: body + `is_present_in_watchlist: true`, `impression: null`, `watch_status: 0`.
5. Saga `detailsSucceeded` with that payload + success toast.

Does **not** insert into `librarySlice`. Library list stays stale until next library fetch.

---

### PATCH `/api/movie/[id]`

**Auth:** required. **Service:** `updateMovieInLibrary`.  
**Body:** at least one of `watch_status` (0–3) or `impression` (0–2 | null). `moviePatchSchema`.

**Watch status:** 0 Plan to Watch, 1 Watching, 2 Completed, 3 Dropped.  
**Impression:** 0 Dislike, 1 Like, 2 Love, or `null`.

**Server steps:**

1. `findUserMovie`. 404 if not in library.
2. If movie catalog status is not released, reject watch/impression updates (400).
3. Set `updatedAt`. Completed → `completedAt = now`; otherwise clear `completedAt`.
4. `updateUserMovie`. Return `{ is_present_in_watchlist, watch_status, impression }`.

**Two client paths (same endpoint):**

| UI | Store | Notes |
|---|---|---|
| Detail `ActionBar` / `ProgressStatus` | `contentDetailsSlice` optimistic + toasts | Does not update `librarySlice` |
| Library `MovieCard` | `librarySlice` optimistic (`libraryItemMutationRequested`) | Deduped by `mediaType:tmdbId`. PATCH response fields for movies are discarded; UI trusts the optimistic patch. Grouped view patches every copy and moves the card when `groupBy === 0` (watch status) or `groupBy === 1` (impression). |

---

### DELETE `/api/movie/[id]`

**Auth:** required. `removeMovieFromLibrary` → `deleteUserMovie`. Empty delete → 404. 200 `{ success: true }`.

**No client caller** in `src/`. Documented in `docs/api_documentation.http`.

---

## 6. Series

Mirror of movies in `src/app/api/series/[id]/route.ts`.

### GET `/api/series/[id]`

1. `useContentDetails("series", id)` → GET `/api/series/{id}`.
2. TMDB `GET /tv/{id}?append_to_response=external_ids,content_ratings,credits&language=en-US`.
3. If session: `findUserSeriesAndSeasons` (user series row + per-season progress).
4. Map seasons with `episodes_watched`, India content rating, trimmed credits, library totals.
5. `generateMetadata` in `src/app/series/[id]/page.tsx` also calls `getSeriesDetails` (duplicate TMDB fetch).

---

### POST `/api/series/[id]`

Same add-watchlist path as movies. `insertUserSeries` from the client’s full `TmdbSeries` payload (normalizes a flat `content_ratings` object into `{ results: [...] }` if needed). Unique → 409. Returns watchlist defaults and `episodes_watched: 0` per season.

---

### PATCH `/api/series/[id]`

**Body (`seriesPatchSchema`):** one or more of `watch_status`, `impression`, and **paired** `mark_season_to_watched` + `mark_episode_to_watched`.

**Service `updateSeriesInLibrary`:**

1. Load series + seasons. 404 if missing.
2. Reject if catalog status disallows watch activity.
3. **Progress:** find season, reject unaired seasons, cap episodes at `episode_count`, `ensureUserSeasonProgress` if needed, write season row.
4. **Explicit watch_status:**
   - Plan to Watch (0): zero all progress, reset every season.
   - Completed (2): fill all episodes/seasons, stamp `completedAt`.
   - Other: clear `completedAt`.
5. **Progress without explicit status:** recompute totals; auto-Complete if all episodes watched, else Watching.
6. `applySeriesWatchUpdates` then **re-read** `findUserSeriesAndSeasons` for the response.

**Response:** `{ is_present_in_watchlist, watch_status, impression, total_number_of_episodes_watched, total_number_of_seasons_watched, seasons[] }`.

**Callers:**

- Detail: `useContentMutation` (`update-impression` / `update-watch-status` / `update-progress`) → toasts; store is `contentDetailsSlice` only.
- Library `SeriesCard` next-episode: `useLibraryItemMutation` with `{ progress }`. On success, saga passes `seriesUpdate` into `libraryItemMutationSucceeded` so progress (and auto status) apply to every library copy, including grouped carousels.

**Performance:** progress PATCH can `ensureAllUserSeasonProgress` (all seasons) plus a write plus a full re-read. Heavier than movie PATCH.

---

### DELETE `/api/series/[id]`

Same as movie delete. **No UI caller.**

---

## 7. Custom collections

Local React state in `useCustomCollections`, not Redux.

### GET `/api/collections`

1. Settings section mounts → `fetch("/api/collections")`.
2. `requireSession` → `listUserCollections`.
3. 200 `{ collections: CustomCollectionWithFilters[] }` (filters + sorts included).

### POST `/api/collections`

1. `saveCollection` without `editingId`.
2. Body: `{ name, mediaType (0 movie / 1 series), showInDashboard?, showInLibrary?, groupBy?, displayOrder?, filters[] (≥1), sorts[] }`.
3. `insertUserCollection`. 201 `{ collection }`.
4. Hook prepends to local state.

### GET `/api/collections/[id]`

`getUserCollection` → 200 `{ collection }` or 404. **No UI caller** (list payload already has full rows).

### PUT `/api/collections/[id]`

Partial update (`updateCollectionSchema`). If `filters` / `sorts` are sent they **replace** the whole lists.

UI uses:

- Toggle library visibility: `{ showInLibrary }`
- Quick sort: `{ sorts: [{ field, direction, priority: 0 }] }`
- Full edit: name, mediaType, showInLibrary, filters, sorts

404 if the collection is not owned by the session user.

**There is no DELETE handler** (the `.http` docs mention one).

**Performance:** collections are small user-owned rows. List is fetched once per settings visit. Toggles do not invalidate library/dashboard until those pages refetch.

---

## 8. External TMDB (server-only)

| TMDB | CineLog caller | When |
|---|---|---|
| `GET /search/movie` | `searchTitles` | Search popup |
| `GET /search/tv` | `searchTitles` | Search popup |
| `GET /movie/{id}?append_to_response=release_dates,credits` | `getMovieDetails` | Detail GET + metadata |
| `GET /tv/{id}?append_to_response=external_ids,content_ratings,credits` | `getSeriesDetails` | Detail GET + metadata |
| `GET /movie/{id}?append_to_response=release_dates` | `src/lib/tmdb/catalog-fetch.ts` | Catalog sync script |
| `GET /tv/{id}?append_to_response=content_ratings` | same | Catalog sync script |

Image CDN (not REST): `https://image.tmdb.org/t/p/w200` (search/library posters), `w500` for Open Graph. Allowed in `next.config.ts`.

Admin bulk sync: `scripts/sync-catalog.ts` with `scripts/lib/tmdb-rate-limit.ts`. Not an app runtime path.

---

## 9. Endpoint index

| Method | Route | Auth | UI caller |
|---|---|---|---|
| POST | `/api/auth/login` | No | `authSaga` |
| POST | `/api/auth/signup` | No | `authSaga` |
| POST | `/api/auth/logout` | Cookie clear | `authSaga` |
| GET | `/api/auth/me` | Cookie | `authSaga` |
| PATCH | `/api/user/profile` | Required | `useProfileForm` |
| GET | `/api/library` | Required | `librarySaga` |
| GET | `/api/search/movie` | Optional | `searchSaga` |
| GET | `/api/search/series` | Optional | `searchSaga` |
| GET | `/api/movie/[id]` | Optional | `contentDetailsSaga` + metadata |
| POST | `/api/movie/[id]` | Required | `contentDetailsSaga` |
| PATCH | `/api/movie/[id]` | Required | `contentDetailsSaga` + `librarySaga` |
| DELETE | `/api/movie/[id]` | Required | **none** |
| GET | `/api/series/[id]` | Optional | `contentDetailsSaga` + metadata |
| POST | `/api/series/[id]` | Required | `contentDetailsSaga` |
| PATCH | `/api/series/[id]` | Required | `contentDetailsSaga` + `librarySaga` |
| DELETE | `/api/series/[id]` | Required | **none** |
| GET | `/api/collections` | Required | `useCustomCollections` |
| POST | `/api/collections` | Required | `useCustomCollections` |
| GET | `/api/collections/[id]` | Required | **none** |
| PUT | `/api/collections/[id]` | Required | `useCustomCollections` |

---

## 10. Parallel mutation slices

Library cards and the title-detail page hit the **same PATCH URLs** but keep **separate Redux trees**:

- `librarySlice` / `librarySaga` — optimistic library cards, grouped membership, no toasts on impression/status.
- `contentDetailsSlice` / `contentDetailsSaga` — optimistic detail page, toasts. **Does not patch `librarySlice`.**

Consequences if you change flow:

- Adding a title from search/detail does not appear in an already-loaded library until reload/refetch.
- Changing status on the detail page does not move grouped library carousels until the next `GET /api/library`.

---

## 11. Current performance characteristics

| Area | What happens today |
|---|---|
| Search | 500ms debounce, `takeLatest`, live TMDB, `force-dynamic`, no cache |
| Library text search | 400ms debounce, full refetch from offset 0 |
| Library pages | Deduped (`activePageFetches`), `queryNonce` drops stale pages |
| Library grouped overview | N queries (one first page per group) + counts for both media types |
| Mutations | Deduped per title (`mediaType:tmdbId` or `mediaType:id:mutation`) |
| Content detail | TMDB on every GET; metadata + client = two TMDB calls per page |
| Add to library | Client sends full TMDB payload; server does not re-fetch TMDB |
| Series PATCH | Possible all-season ensure + write + re-read |
| Service worker | Does not cache `/api/*` |
| Auth init | One `/api/auth/me` per app load |

---

## 12. Where to optimize (planning only)

These are observations, not implemented changes.

1. **Grouped library overview.** Impression grouping uses a fixed set of groups (unset + three ratings). Consider SQL window functions / a single query with `ROW_NUMBER() OVER (PARTITION BY group)`, or returning group metadata first and lazy-loading each carousel.
2. **Always-on dual counts.** `listLibraryRows` always counts movies *and* series. A cheaper header-count endpoint (or caching counts) would shrink every library GET.
3. **Detail page double TMDB fetch.** Reuse `generateMetadata` data, or cache TMDB responses (short TTL, 429-aware) so the client GET does not hit TMDB again.
4. **Search.** Cache TMDB search by `query+year+region+page` (even 30–60s). Genre lookup is local and cheap; watchlist enrichment could be a second cheap query rather than blocking TMDB.
5. **Cross-slice sync.** After add/PATCH on the detail page, apply the same optimistic patch (or a small invalidation) to `librarySlice` so the library does not need a full refetch.
6. **Series progress PATCH.** Avoid the trailing full re-read if the in-memory totals are already correct; `ensureAllUserSeasonProgress` on Plan-to-Watch / Completed is the expensive write.
7. **POST add-to-library payload.** Sending the full TMDB object is large. Server could load catalog from Turso (already synced) and only write user-library columns.
8. **Unused routes.** DELETE movie/series and GET collection-by-id add surface area without UI benefit.
9. **`no-store` everywhere.** Library and details cannot use HTTP cache or SWR-style revalidation. A short private cache or ETag on `GET /api/library` would help back-navigation.
10. **Auth `/me` on every load.** Fine at current scale; combining it with the first page’s data (or a lighter JWT-only check) would save one round trip on cold start.
