import type { Franchise } from "@/db/schema";
import type { TmdbCollection } from "@/lib/types";
import {
  diffFranchiseCollection,
  emptyFranchiseSyncMutations,
  type FranchiseSyncMutations,
  type FranchiseSyncSnapshot,
} from "@/repositories/franchise-sync";
import type { DiffRow } from "./catalog-diff";

export function diffFranchiseCatalog(input: {
  franchise: Franchise;
  collection: TmdbCollection;
  snapshot: FranchiseSyncSnapshot;
  mutations: FranchiseSyncMutations;
  diffs: DiffRow[];
}) {
  const metadataBefore = input.mutations.metadataUpdates.length;
  const linksBefore = input.mutations.movieLinks.length;
  const unlinksBefore = input.mutations.movieUnlinks.length;

  diffFranchiseCollection({
    franchise: input.franchise,
    collection: input.collection,
    snapshot: input.snapshot,
    mutations: input.mutations,
  });

  for (const update of input.mutations.metadataUpdates.slice(metadataBefore)) {
    input.diffs.push({
      entity: "franchise",
      dbId: String(input.franchise.id),
      tmdbId: String(input.franchise.tmdbId),
      field: "metadata",
      oldValue: input.franchise.name,
      newValue: update.values.name,
      action: "update",
    });

    if (input.franchise.numberOfParts !== update.values.numberOfParts) {
      input.diffs.push({
        entity: "franchise",
        dbId: String(input.franchise.id),
        tmdbId: String(input.franchise.tmdbId),
        field: "number_of_parts",
        oldValue: String(input.franchise.numberOfParts),
        newValue: String(update.values.numberOfParts),
        action: "update",
      });
    }
  }

  for (const link of input.mutations.movieLinks.slice(linksBefore)) {
    input.diffs.push({
      entity: "franchise_movie_link",
      dbId: String(input.franchise.id),
      tmdbId: String(link.part.id),
      field: "franchise_id",
      oldValue: "",
      newValue: String(input.franchise.id),
      action: "insert",
    });
  }

  for (const unlink of input.mutations.movieUnlinks.slice(unlinksBefore)) {
    input.diffs.push({
      entity: "franchise_movie_unlink",
      dbId: String(unlink.movieDbId),
      tmdbId: String(unlink.movieTmdbId),
      field: "franchise_id",
      oldValue: String(input.franchise.id),
      newValue: "",
      action: "delete",
    });
  }
}

export function franchiseMutationWriteCount(mutations: FranchiseSyncMutations) {
  return (
    mutations.metadataUpdates.length +
    mutations.movieLinks.length +
    mutations.movieUnlinks.length
  );
}

export { emptyFranchiseSyncMutations, type FranchiseSyncMutations };
