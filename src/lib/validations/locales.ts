import { AppError } from "@/lib/http/errors";
import { getLocales } from "@/services/locales";

export async function isValidLanguageCode(code: string) {
  const { languages } = await getLocales();
  return languages.some((language) => language.iso_639_1 === code);
}

export async function assertLocaleFilterValue(
  field?: string,
  value?: string,
) {
  if (field !== "original_language" && field !== "origin_country") {
    return;
  }

  const message =
    field === "original_language" ? "Invalid language" : "Invalid origin country";

  if (!value?.trim()) {
    throw new AppError(message, 400);
  }

  const { languages, countries } = await getLocales();
  const codes =
    field === "original_language"
      ? new Set(languages.map((language) => language.iso_639_1))
      : new Set(countries.map((country) => country.iso_3166_1));

  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    throw new AppError(message, 400);
  }

  for (const part of parts) {
    if (!codes.has(part)) {
      throw new AppError(message, 400);
    }
  }
}
