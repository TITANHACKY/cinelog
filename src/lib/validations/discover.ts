import { z } from "zod";
import { DISCOVER_MAX_PAGE } from "@/lib/constants";

// Rows load every page, including page 1, from here.
export const discoverRowPageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(DISCOVER_MAX_PAGE),
});
