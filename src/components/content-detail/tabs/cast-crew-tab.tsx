"use client";

import { useState } from "react";
import { User, Users } from "lucide-react";
import Image from "next/image";
import type { CreditMember, DepartmentCredits } from "@/lib/types";

type CastCrewTabProps = {
  departments?: DepartmentCredits[];
  allCast?: CreditMember[];
};

export function CastCrewTab({
  departments = [],
  allCast = [],
}: CastCrewTabProps) {
  // If departments is empty but allCast exists, create a default Acting department
  const activeDepartments =
    departments.length > 0
      ? departments
      : allCast.length > 0
        ? [{ department: "Acting", members: allCast }]
        : [];

  const [selectedDept, setSelectedDept] = useState<string>("All");

  if (activeDepartments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-outline-variant bg-surface-container/60 p-8 text-center">
        <Users className="h-8 w-8 text-outline-muted mb-2" />
        <p className="text-sm text-secondary">
          Cast & crew information is not available for this movie.
        </p>
      </div>
    );
  }

  const deptNames = ["All", ...activeDepartments.map((d) => d.department)];

  const displayedDepartments =
    selectedDept === "All"
      ? activeDepartments
      : activeDepartments.filter((d) => d.department === selectedDept);

  return (
    <div className="space-y-6">
      {/* Department Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        {deptNames.map((name) => {
          const isSelected = selectedDept === name;
          const count =
            name === "All"
              ? activeDepartments.reduce((acc, d) => acc + d.members.length, 0)
              : (activeDepartments.find((d) => d.department === name)?.members
                  .length ?? 0);

          return (
            <button
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                isSelected
                  ? "bg-brand-primary text-brand-on-primary shadow-xs"
                  : "border border-outline-variant bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
              }`}
              key={name}
              onClick={() => setSelectedDept(name)}
              type="button"
            >
              <span>{name}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  isSelected
                    ? "bg-black/20 text-brand-on-primary"
                    : "bg-surface-container text-outline-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Departments Sections */}
      <div className="space-y-8">
        {displayedDepartments.map((dept) => (
          <section className="space-y-3" key={dept.department}>
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
              <h3 className="font-heading text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
                <span>{dept.department}</span>
                <span className="text-xs font-normal text-outline-muted">
                  ({dept.members.length}{" "}
                  {dept.members.length === 1 ? "person" : "people"})
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 sm:gap-3.5">
              {dept.members.map((member, idx) => (
                <MemberCard
                  key={`${member.id}-${member.character || member.job || idx}`}
                  member={member}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: CreditMember }) {
  const isCast = Boolean(member.character);
  const roleLabel =
    member.character || member.job || member.department || "Crew";

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-high/80 transition hover:border-outline hover:bg-surface-container-high">
      <div className="relative aspect-2/3 w-full bg-surface-container overflow-hidden">
        {member.profile_path ? (
          <Image
            alt={member.name ?? "Member"}
            className="object-cover transition duration-300 group-hover:scale-105"
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            src={`https://image.tmdb.org/t/p/w300${member.profile_path}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-container">
            <User className="h-8 w-8 text-outline-muted/50" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 p-2.5">
        <span
          className="truncate text-xs font-semibold text-on-surface"
          title={member.name ?? "Unknown"}
        >
          {member.name ?? "Unknown"}
        </span>
        <span
          className={`truncate text-[11px] ${
            isCast ? "text-brand-tertiary-accent-alt" : "text-outline-muted"
          }`}
          title={roleLabel}
        >
          {roleLabel}
        </span>
      </div>
    </div>
  );
}

export default CastCrewTab;
