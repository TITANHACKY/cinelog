import type { DiffRow } from "./catalog-diff";

export type LocaleEntry = {
  code: string;
  englishName: string;
};

export type LocaleSyncMutations = {
  inserts: LocaleEntry[];
  updates: LocaleEntry[];
};

function stringify(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

export function emptyLocaleMutations(): LocaleSyncMutations {
  return {
    inserts: [],
    updates: [],
  };
}

export function localeMutationWriteCount(mutations: LocaleSyncMutations) {
  return mutations.inserts.length + mutations.updates.length;
}

export function normalizeTmdbLanguages(
  languages?: Array<{ iso_639_1?: string; english_name?: string }> | null,
): LocaleEntry[] {
  const byCode = new Map<string, string>();

  for (const language of languages ?? []) {
    const code = language.iso_639_1?.trim().toLowerCase();
    const englishName = language.english_name?.trim();
    if (!code || !englishName) {
      continue;
    }
    if (!byCode.has(code)) {
      byCode.set(code, englishName);
    }
  }

  return [...byCode.entries()].map(([code, englishName]) => ({
    code,
    englishName,
  }));
}

export function normalizeTmdbCountries(
  countries?: Array<{ iso_3166_1?: string; english_name?: string }> | null,
): LocaleEntry[] {
  const byCode = new Map<string, string>();

  for (const country of countries ?? []) {
    const code = country.iso_3166_1?.trim().toUpperCase();
    const englishName = country.english_name?.trim();
    if (!code || !englishName) {
      continue;
    }
    if (!byCode.has(code)) {
      byCode.set(code, englishName);
    }
  }

  return [...byCode.entries()].map(([code, englishName]) => ({
    code,
    englishName,
  }));
}

function pushLocaleDiff(
  diffs: DiffRow[],
  entity: "language" | "country",
  dbId: string,
  code: string,
  oldValue: unknown,
  newValue: unknown,
  action: DiffRow["action"],
) {
  diffs.push({
    entity,
    dbId,
    tmdbId: code,
    field: "english_name",
    oldValue: stringify(oldValue),
    newValue: stringify(newValue),
    action,
  });
}

export function diffCatalogLocales(input: {
  entity: "language" | "country";
  dbRows: LocaleEntry[];
  tmdbRows: LocaleEntry[];
}): { mutations: LocaleSyncMutations; diffs: DiffRow[] } {
  const mutations = emptyLocaleMutations();
  const diffs: DiffRow[] = [];
  const dbByCode = new Map(
    input.dbRows.map((row) => [row.code, row.englishName]),
  );

  for (const row of input.tmdbRows) {
    const current = dbByCode.get(row.code);

    if (current === undefined) {
      mutations.inserts.push(row);
      pushLocaleDiff(diffs, input.entity, "", row.code, "", row.englishName, "insert");
      continue;
    }

    if (current !== row.englishName) {
      mutations.updates.push(row);
      pushLocaleDiff(
        diffs,
        input.entity,
        row.code,
        row.code,
        current,
        row.englishName,
        "update",
      );
    }
  }

  return { mutations, diffs };
}
