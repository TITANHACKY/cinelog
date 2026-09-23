import { asc, eq } from "drizzle-orm";
import { asBatch, getDb, type SqliteBatchQuery } from "@/db";
import { countries, languages } from "@/db/schema";

const BATCH_SIZE = 40;

export type LocaleSyncRow = {
  code: string;
  englishName: string;
};

export type LocaleSyncMutations = {
  inserts: LocaleSyncRow[];
  updates: LocaleSyncRow[];
};

export type LanguageListRow = {
  iso_639_1: string;
  english_name: string;
};

export type CountryListRow = {
  iso_3166_1: string;
  english_name: string;
};

async function runBatches(queries: SqliteBatchQuery[]) {
  if (queries.length === 0) {
    return;
  }

  const db = getDb();
  for (let index = 0; index < queries.length; index += BATCH_SIZE) {
    const chunk = queries.slice(index, index + BATCH_SIZE);
    await db.batch(asBatch(chunk));
  }
}

export async function listAllLanguages(): Promise<LanguageListRow[]> {
  return getDb()
    .select({
      iso_639_1: languages.iso6391,
      english_name: languages.englishName,
    })
    .from(languages)
    .orderBy(asc(languages.englishName));
}

export async function listAllCountries(): Promise<CountryListRow[]> {
  return getDb()
    .select({
      iso_3166_1: countries.iso31661,
      english_name: countries.englishName,
    })
    .from(countries)
    .orderBy(asc(countries.englishName));
}

export async function loadLanguageSyncSnapshot(): Promise<LocaleSyncRow[]> {
  const rows = await getDb()
    .select({
      code: languages.iso6391,
      englishName: languages.englishName,
    })
    .from(languages);

  return rows;
}

export async function loadCountrySyncSnapshot(): Promise<LocaleSyncRow[]> {
  const rows = await getDb()
    .select({
      code: countries.iso31661,
      englishName: countries.englishName,
    })
    .from(countries);

  return rows;
}

export async function applyLanguageSyncMutations(
  mutations: LocaleSyncMutations,
): Promise<{ written: number }> {
  const db = getDb();
  let written = 0;

  if (mutations.inserts.length > 0) {
    await db.insert(languages).values(
      mutations.inserts.map((language) => ({
        iso6391: language.code,
        englishName: language.englishName,
      })),
    );
    written += mutations.inserts.length;
  }

  const queries: SqliteBatchQuery[] = mutations.updates.map((update) =>
    db
      .update(languages)
      .set({ englishName: update.englishName })
      .where(eq(languages.iso6391, update.code)),
  );

  await runBatches(queries);
  written += mutations.updates.length;

  return { written };
}

export async function applyCountrySyncMutations(
  mutations: LocaleSyncMutations,
): Promise<{ written: number }> {
  const db = getDb();
  let written = 0;

  if (mutations.inserts.length > 0) {
    await db.insert(countries).values(
      mutations.inserts.map((country) => ({
        iso31661: country.code,
        englishName: country.englishName,
      })),
    );
    written += mutations.inserts.length;
  }

  const queries: SqliteBatchQuery[] = mutations.updates.map((update) =>
    db
      .update(countries)
      .set({ englishName: update.englishName })
      .where(eq(countries.iso31661, update.code)),
  );

  await runBatches(queries);
  written += mutations.updates.length;

  return { written };
}
