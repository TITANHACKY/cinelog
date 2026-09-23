import { z } from "zod";
import { SEARCH_PAGE_MAX, SEARCH_YEAR_MIN } from "@/lib/constants";

function parseOptionalInt(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return Number(value);
}

function parsePageInt(value: unknown, fallback: number) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return Number(value);
}

const currentYear = new Date().getFullYear();

export const searchQuerySchema = z.object({
  query: z.string().trim().min(1).max(100),
  year: z.preprocess(
    parseOptionalInt,
    z.number().int().min(SEARCH_YEAR_MIN).max(currentYear).optional(),
  ),
  language: z.preprocess(
    (value) => (value === null || value === "" ? undefined : value),
    z.string().trim().toLowerCase().optional(),
  ),
  page: z.preprocess(
    (value) => parsePageInt(value, 1),
    z.number().int().min(1).max(SEARCH_PAGE_MAX),
  ),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

export function parseSearchQuery(url: string) {
  const searchParams = new URL(url).searchParams;

  return searchQuerySchema.safeParse({
    query: searchParams.get("query"),
    year: searchParams.get("year") ?? undefined,
    language: searchParams.get("language") ?? undefined,
    page: searchParams.get("page") ?? undefined,
  });
}
