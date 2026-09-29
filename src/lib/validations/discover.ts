import { z } from "zod";
import { DISCOVER_MAX_PAGE } from "@/lib/constants";

// Page 1 of every row ships with GET /api/dashboard/discover.
export const discoverRowPageQuerySchema = z.object({
  page: z.coerce.number().int().min(2).max(DISCOVER_MAX_PAGE),
});
