import { unstable_cache } from "next/cache";
import { listAllGenres } from "@/repositories/genres";

export const getGenres = unstable_cache(
  async () => listAllGenres(),
  ["genres-list"],
  { revalidate: 86400 },
);
