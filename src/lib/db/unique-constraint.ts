export function isUniqueConstraintError(error: unknown): boolean {
  // Drizzle wraps the driver error, so the SQLITE_CONSTRAINT signal lives on a
  // nested `cause` (often several levels deep) rather than the top-level error.
  // Walk the cause chain and check each link.
  const seen = new Set<unknown>();
  let current: unknown = error;

  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const candidate = current as {
      code?: unknown;
      message?: unknown;
      cause?: unknown;
    };
    const code = typeof candidate.code === "string" ? candidate.code : "";
    const message =
      typeof candidate.message === "string" ? candidate.message : "";

    if (
      code.includes("SQLITE_CONSTRAINT") ||
      message.includes("UNIQUE constraint failed")
    ) {
      return true;
    }

    current = candidate.cause;
  }

  return false;
}
