import type { TmdbCrewMember, TmdbMovie, TmdbSeries } from "@/lib/types";

type TmdbCredits = TmdbMovie["credits"] | TmdbSeries["credits"];

export function pickCastAndDirectors(credits: TmdbCredits) {
  const creditsObj = credits && !Array.isArray(credits) ? credits : undefined;
  const cast = [...(creditsObj?.cast ?? [])]
    .sort(
      (first, second) => (first.order ?? Infinity) - (second.order ?? Infinity),
    )
    .slice(0, 10);
  const directingCrew: TmdbCrewMember[] = [];

  for (const member of creditsObj?.crew ?? []) {
    if (member.known_for_department !== "Directing") continue;
    directingCrew.push(member);
    if (directingCrew.length === 5) break;
  }

  return [...cast, ...directingCrew];
}
