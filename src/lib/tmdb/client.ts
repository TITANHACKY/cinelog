import { TMDB_API_BASE } from "@/lib/constants";
import { AppError } from "@/lib/http/errors";

export async function tmdbFetch<T>(
  path: string,
  options?: {
    searchParams?: URLSearchParams;
    failedMessage?: string;
  },
): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  const failedMessage = options?.failedMessage ?? "TMDB request failed";

  if (!apiKey) {
    throw new AppError("TMDB API key is not configured", 503);
  }

  const query = options?.searchParams?.toString();
  const url = query
    ? `${TMDB_API_BASE}${path}?${query}`
    : `${TMDB_API_BASE}${path}`;

  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new AppError(failedMessage, 404);
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const retryAfterSeconds = retryAfter ? Number(retryAfter) : undefined;
        throw new AppError(failedMessage, 429, {
          retryAfterSeconds: Number.isFinite(retryAfterSeconds)
            ? retryAfterSeconds
            : undefined,
        });
      }

      throw new AppError(failedMessage, 502);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(failedMessage, 502);
  }
}
