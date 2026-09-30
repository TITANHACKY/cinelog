import "dotenv/config";

import { fetchTmdbCollection } from "@/lib/tmdb/catalog-fetch";
import type { TmdbCollection } from "@/lib/types";
import {
  batchLinkCatalogMoviesByTmdbIds,
  diffFranchiseCollection,
  emptyFranchiseSyncMutations,
  loadFranchiseSyncSnapshot,
  syncFranchiseCollectionFromTmdb,
} from "@/repositories/franchise-sync";
import {
  backfillAllUserFranchisePartsCompleted,
  countUserFranchiseFollowRows,
} from "@/repositories/franchise-progress";
import { listAllFranchises } from "@/repositories/franchises";
import { TmdbRequestLimiter } from "./lib/tmdb-rate-limit";

type Mode = "dry-run" | "execute";

type FranchiseCollectionPlan = {
  franchiseDbId: number;
  franchiseTmdbId: number;
  name: string;
  partTmdbIds: number[];
};

function parseMode(): Mode {
  const args = process.argv.slice(2);
  const modeIndex = args.indexOf("--mode");
  if (modeIndex !== -1 && args[modeIndex + 1]) {
    const val = args[modeIndex + 1]?.toLowerCase();
    if (val === "execute") return "execute";
  }
  return "dry-run";
}

function partTmdbIdsFromCollection(collection: TmdbCollection) {
  return (collection.parts ?? []).map((part) => part.id);
}

async function linkExistingFranchises(
  mode: Mode,
  limiter: TmdbRequestLimiter,
): Promise<{
  processed: number;
  errors: number;
  plans: FranchiseCollectionPlan[];
}> {
  const franchises = await listAllFranchises();
  console.log(`Found ${franchises.length} franchises in database.`);

  const snapshot =
    mode === "dry-run" ? await loadFranchiseSyncSnapshot() : null;
  const plans: FranchiseCollectionPlan[] = [];
  let processed = 0;
  let errors = 0;

  for (const franchise of franchises) {
    try {
      const collection = await limiter.run(() =>
        fetchTmdbCollection(franchise.tmdbId),
      );
      const partTmdbIds = partTmdbIdsFromCollection(collection);

      plans.push({
        franchiseDbId: franchise.id,
        franchiseTmdbId: franchise.tmdbId,
        name: franchise.name,
        partTmdbIds,
      });

      if (mode === "execute") {
        await syncFranchiseCollectionFromTmdb(collection);
      } else {
        const mutations = emptyFranchiseSyncMutations();
        diffFranchiseCollection({
          franchise,
          collection,
          snapshot: snapshot!,
          mutations,
        });
        console.log(
          `[dry-run] franchise ${franchise.tmdbId} (${franchise.name}): metadata ${mutations.metadataUpdates.length}, upsert+link ${mutations.movieLinks.length}, unlinks ${mutations.movieUnlinks.length}, parts ${partTmdbIds.length}`,
        );
      }

      processed += 1;
    } catch (error) {
      errors += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `Failed franchise ${franchise.tmdbId} (${franchise.name}): ${message}`,
      );
    }
  }

  return { processed, errors, plans };
}

async function batchLinkCatalogMoviesFromPlans(
  mode: Mode,
  plans: FranchiseCollectionPlan[],
) {
  let linked = 0;
  let alreadyLinked = 0;
  let missingFromCatalog = 0;
  let conflictingFranchise = 0;

  for (const plan of plans) {
    const result = await batchLinkCatalogMoviesByTmdbIds(
      plan.franchiseDbId,
      plan.partTmdbIds,
      { dryRun: mode === "dry-run" },
    );

    linked += result.linked;
    alreadyLinked += result.alreadyLinked;
    missingFromCatalog += result.missingFromCatalog;
    conflictingFranchise += result.conflictingFranchise;

    if (result.linked > 0 || result.conflictingFranchise > 0) {
      console.log(
        `[${mode}] franchise ${plan.franchiseTmdbId} (${plan.name}): link ${result.linked}, already linked ${result.alreadyLinked}, missing catalog ${result.missingFromCatalog}, conflicts ${result.conflictingFranchise}`,
      );
    }
  }

  return {
    linked,
    alreadyLinked,
    missingFromCatalog,
    conflictingFranchise,
  };
}

async function main() {
  const mode = parseMode();
  console.log(
    `[franchise:link-catalog] Running in ${mode.toUpperCase()} mode...`,
  );

  const limiter = new TmdbRequestLimiter();

  const franchiseResult = await linkExistingFranchises(mode, limiter);
  console.log(
    `Pass 1 (TMDB collections): processed ${franchiseResult.processed}, errors ${franchiseResult.errors}`,
  );

  const batchResult = await batchLinkCatalogMoviesFromPlans(
    mode,
    franchiseResult.plans,
  );
  console.log(
    `Pass 2 (DB batch link): link ${batchResult.linked}, already linked ${batchResult.alreadyLinked}, missing catalog ${batchResult.missingFromCatalog}, conflicts ${batchResult.conflictingFranchise}`,
  );

  console.log(
    `TMDB: ${limiter.stats.requests} requests, ${limiter.stats.retries} retries, ${limiter.stats.notFound} not found`,
  );

  if (mode === "dry-run") {
    const backfillRows = await countUserFranchiseFollowRows();
    console.log(
      `Backfill (dry-run): would update number_of_parts_completed on ${backfillRows} user_franchises rows.`,
    );
    console.log("Dry run complete. Re-run with --mode execute to apply.");
  } else {
    const backfilled = await backfillAllUserFranchisePartsCompleted();
    console.log(
      `Backfill: updated number_of_parts_completed on ${backfilled} user_franchises rows.`,
    );
    console.log("Execute complete.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
