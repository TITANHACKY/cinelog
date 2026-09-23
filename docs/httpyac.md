# Using the Cinelog API with httpYac

These notes are for [docs/api_documentation.http](api_documentation.http). Auth uses an `auth_token` cookie, not a Bearer token.

## 1. Install the extension

In Cursor or VS Code, open Extensions (`Cmd+Shift+X` / `Ctrl+Shift+X`) and install **httpYac - Rest Client** (`anweber.vscode-httpyac`).

## 2. Run the app

From the project root:

```bash
npm run dev
```

The default host is `http://localhost:3000`.

## 3. Add your credentials

Create `docs/http-client.private.env.json` (gitignored) with:

```json
{
  "dev": {
    "username": "demo_user",
    "email": "demo@example.com",
    "password": "ChangeMe1@",
    "displayName": "Demo"
  }
}
```

Password rules: 6–20 characters, upper + lower + number, and one of `@ # & ! _`. Username is 3–10 characters (letters, numbers, underscore).

Do not commit real passwords.

## 4. Open the requests file

Open `docs/api_documentation.http`.

Select the **dev** environment (status bar, or Command Palette → “httpYac: Toggle Environment”).

## 5. Send requests

Click **Send** above a `###` block, or put the cursor on the request and run **httpYac: Send Request**.

1. Send **Login** (or **Signup** once). httpYac stores the cookie.
2. Send any other request. Protected routes (`/me`, library, POST/PATCH/DELETE) need that cookie.
3. **Search movies (anonymous)** skips the cookie jar so you can compare logged-out vs logged-in search.

If a protected call returns 401, send Login again.

## Endpoint catalog

Cookie = requires `auth_token` from Login or Signup. Optional cookie = extra watchlist fields when logged in.

### Auth

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Public | Body: `username`, `email`, `password`, `displayName`. Sets cookie. |
| POST | `/api/auth/login` | Public | Body: `username`, `password`. Sets cookie. |
| GET | `/api/auth/me` | Cookie | Current user profile. |
| POST | `/api/auth/logout` | Cookie | Clears cookie. |

### Search (TMDB)

| Method | Path | Auth | Query | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/search/movie` | Optional | `query` (required), `year`, `language` (ISO 639-1), `page` (default 1) | `{ results, page, total_pages, total_results }` |
| GET | `/api/search/series` | Optional | `query` (required), `year` (first air year), `language` (ISO 639-1), `page` | Same shape |

Logged-in search results include `is_present_in_watchlist` and `watch_status`. Search `language` is validated against the cached locales list and post-filters TMDB results on `original_language`.

### Reference lists

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/genres` | Public | `{ genres: [{ tmdb_id, name }] }`. Cached 24h server-side. |
| GET | `/api/locales` | Public | `{ languages: [{ iso_639_1, english_name }], countries: [{ iso_3166_1, english_name }] }`. Cached 24h server-side. Used for search/library/collection dropdowns, display names, and ISO code validation. |

### Library browse

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/library` | Cookie | Server-side search, one filter, one sort, one group. The web UI does **not** put these params in the page URL. |

**Query**

| Param | Required | Values |
| --- | --- | --- |
| `type` | Yes | `movie` \| `series` |
| `offset` | No | Default `0` |
| `limit` | No | Default `20`, max `50` |
| `q` | No | Title / name contains (movies.title or series.name) |
| `filter_field` | With operator + value | `watch_status`, `impression`, `vote_average`, `release_year`, `status`, `genre`, `original_language`, `origin_country` |
| `filter_operator` | With field + value | `0` eq, `1` neq, `2` gt, `3` lt, `4` in |
| `filter_value` | With field + operator | Single value, or comma-separated for `in` |
| `sort_field` | No | Default `created_at`. Also `release_date`, `title`, `vote_average`, `last_watched_at`, `completed_at` |
| `sort_direction` | No | `0` asc, `1` desc (default) |
| `group_by` | No | `0` watch status, `1` impression, `2` catalog status |
| `group_key` | With `group_by` | Page one group. Omit to get every group total plus the first `limit` items per group. |

Operator allow-list: `watch_status` / `impression` → 0, 1, 4; `vote_average` / `release_year` → 0, 1, 2, 3; text/genre fields → 0, 1, 4. Contains (`5`) is not accepted.

**Response**

```json
{
  "movies": [],
  "series": [],
  "metadata": {
    "count": { "movies": 0, "series": 0 },
    "offset": 0,
    "limit": 20,
    "hasMore": false,
    "groups": [{ "key": "2", "label": "Completed", "count": 4, "hasMore": false }]
  }
}
```

Only the requested `type` array is filled. `metadata.count` is the **filtered** total for both media types. `metadata.groups` is omitted unless `group_by` is set. Each group includes `hasMore` for that group’s remaining pages. Without `group_key`, items are the first page of every group (not one global page). With `group_key`, items are that group’s `offset`/`limit` page.

`vote_average` is Rating on a 0–10 scale. `genres` is a string array of names.

### Titles

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/movie/:id` | Optional | TMDB id. Session adds watchlist fields. |
| POST | `/api/movie/:id` | Cookie | Body is the GET movie payload. 201 or 409 if already saved. |
| PATCH | `/api/movie/:id` | Cookie | `watch_status` 0–3 and/or `impression` 0–2 or null. |
| DELETE | `/api/movie/:id` | Cookie | Remove from library. |
| GET | `/api/series/:id` | Optional | Same pattern as movie. |
| POST | `/api/series/:id` | Cookie | Body is the GET series payload. |
| PATCH | `/api/series/:id` | Cookie | Same as movie, plus `mark_season_to_watched` + `mark_episode_to_watched` together. |
| DELETE | `/api/series/:id` | Cookie | Remove from library. |

### Profile

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| PATCH | `/api/user/profile` | Cookie | At least one of `username`, `email`, `displayName`, `newPassword`. `currentPassword` is required to set a new password. 409 if username/email taken. Changing username refreshes the cookie. |

### Smart collections

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/collections` | Cookie | `{ collections }` |
| POST | `/api/collections` | Cookie | At least one filter. 201 `{ collection }` |
| GET | `/api/collections/:id` | Cookie | 404 if missing or not owned |
| PUT | `/api/collections/:id` | Cookie | Partial update. Sending `filters` or `sorts` replaces the full list. |

Collection filter fields today: `release_year`, `certification`, `original_language`, `origin_country`, `genre`. Operators and sort direction use the same 0–4 / 0–1 ints as library browse. Contains is not accepted.

`DELETE /api/collections/:id` is listed in `api_documentation.http` but is **not implemented**.
