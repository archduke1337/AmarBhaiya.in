"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, ChevronRight } from "lucide-react";

type ProfileRow = {
  $id: string;
  userId: string;
  grade: string;
  school: string;
  city: string;
  guardianName: string;
};

export function AdminStudentsTable({
  profiles,
}: {
  profiles: ProfileRow[];
}) {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");

  const cities = useMemo(() => {
    const set = new Set(
      profiles
        .map((p) => p.city)
        .filter((c): c is string => typeof c === "string" && c.length > 0)
    );
    return Array.from(set).sort();
  }, [profiles]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return profiles.filter((p) => {
      const matchesSearch =
        !q ||
        String(p.userId).toLowerCase().includes(q) ||
        String(p.grade).toLowerCase().includes(q) ||
        String(p.school).toLowerCase().includes(q) ||
        String(p.city).toLowerCase().includes(q) ||
        String(p.guardianName).toLowerCase().includes(q);
      const matchesCity =
        cityFilter === "all" || String(p.city) === cityFilter;
      return matchesSearch && matchesCity;
    });
  }, [profiles, search, cityFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by ID, grade, school, city, or guardian..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 text-sm rounded-xl border border-border/40 bg-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        {cities.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground shrink-0" />
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-10 text-sm rounded-xl border border-border/40 bg-surface px-3 focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="all">All cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {(search || cityFilter !== "all") && (
        <p className="text-xs font-semibold text-muted-foreground tabular-nums">
          Showing {filtered.length} of {profiles.length} profiles
        </p>
      )}

      <div className="hidden items-center gap-4 border-b border-border/40 bg-surface-hover px-5 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[1fr_100px_150px_100px_100px_80px]">
        <span>User</span>
        <span>Grade</span>
        <span>School</span>
        <span>City</span>
        <span>Guardian</span>
        <span></span>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm font-semibold text-muted-foreground">
          No profiles match your search or filter.
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {filtered.map((profile) => (
            <div
              key={profile.$id}
              className="flex flex-col gap-2 px-5 py-4 md:grid md:grid-cols-[1fr_100px_150px_100px_100px_80px] md:items-center md:gap-4 hover:bg-surface-hover transition-colors"
            >
              <span className="font-mono text-xs truncate">
                {String(profile.userId ?? "")}
              </span>
              <span className="text-sm">{String(profile.grade ?? "—")}</span>
              <span className="text-sm text-muted-foreground line-clamp-1">
                {String(profile.school ?? "—")}
              </span>
              <span className="text-sm text-muted-foreground">
                {String(profile.city ?? "—")}
              </span>
              <span className="text-sm text-muted-foreground">
                {typeof profile.guardianName === "string" && profile.guardianName.length > 0
                  ? profile.guardianName
                  : "—"}
              </span>
              <Link
                href={`/admin/students/${String(profile.userId ?? "")}`}
                className="text-xs font-semibold text-accent hover:underline underline-offset-4 inline-flex items-center gap-1"
              >
                Details
                <ChevronRight className="size-3" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
