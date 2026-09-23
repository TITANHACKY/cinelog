import { unstable_cache } from "next/cache";
import {
  listAllCountries,
  listAllLanguages,
} from "@/repositories/locales";

const LOCALES_REVALIDATE_SECONDS = 86_400;

export const getLocales = unstable_cache(
  async () => {
    const [languages, countries] = await Promise.all([
      listAllLanguages(),
      listAllCountries(),
    ]);

    return { languages, countries };
  },
  ["locales-list"],
  { revalidate: LOCALES_REVALIDATE_SECONDS },
);
