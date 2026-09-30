import type {
  CreditMember,
  DepartmentCredits,
  TmdbCrewMember,
  TmdbMovie,
  TmdbSeries,
} from "@/lib/types";

type TmdbCredits = TmdbMovie["credits"] | TmdbSeries["credits"];

export function extractDepartments(
  credits: TmdbCredits,
): DepartmentCredits[] {
  const departmentsMap = new Map<string, CreditMember[]>();
  const creditsObj = credits && !Array.isArray(credits) ? credits : undefined;

  if (creditsObj) {
    const castMembers: CreditMember[] = (creditsObj.cast ?? [])
      .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
      .map((c) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profile_path: c.profile_path,
        order: c.order,
        department: "Acting",
      }));

    if (castMembers.length > 0) {
      departmentsMap.set("Acting", castMembers);
    }

    for (const member of creditsObj.crew ?? []) {
      const dept = member.department || member.known_for_department || "Crew";
      if (!departmentsMap.has(dept)) {
        departmentsMap.set(dept, []);
      }
      departmentsMap.get(dept)!.push({
        id: member.id,
        name: member.name,
        profile_path: member.profile_path,
        job: member.job,
        department: dept,
      });
    }
  }

  const result: DepartmentCredits[] = [];
  if (departmentsMap.has("Acting")) {
    result.push({
      department: "Acting",
      members: departmentsMap.get("Acting")!,
    });
    departmentsMap.delete("Acting");
  }

  for (const [dept, members] of departmentsMap.entries()) {
    result.push({ department: dept, members });
  }

  return result;
}

export function extractAllCast(credits: TmdbCredits): CreditMember[] {
  const creditsObj = credits && !Array.isArray(credits) ? credits : undefined;
  return (creditsObj?.cast ?? [])
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
    .map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profile_path: c.profile_path,
      order: c.order,
      department: "Acting",
    }));
}

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
