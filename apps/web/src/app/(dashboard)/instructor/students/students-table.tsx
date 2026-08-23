"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils/format";
import type { InstructorStudentItem } from "@/server/appwrite/dashboard-data";

export function InstructorStudentsTable({
  students,
}: {
  students: InstructorStudentItem[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((student) => {
      const matchesSearch =
        !q ||
        student.name.toLowerCase().includes(q) ||
        student.email.toLowerCase().includes(q) ||
        student.courseTitle.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "attention" && student.needsAttention) ||
        (statusFilter === "near" && student.isNearCompletion) ||
        (statusFilter === "new" && student.isNewEnrollment) ||
        (statusFilter === "steady" &&
          !student.needsAttention &&
          !student.isNearCompletion &&
          !student.isNewEnrollment);
      return matchesSearch && matchesStatus;
    });
  }, [students, search, statusFilter]);

  const counts = useMemo(() => ({
    all: students.length,
    attention: students.filter((s) => s.needsAttention).length,
    near: students.filter((s) => s.isNearCompletion).length,
    new: students.filter((s) => s.isNewEnrollment).length,
    steady: students.filter(
      (s) => !s.needsAttention && !s.isNearCompletion && !s.isNewEnrollment
    ).length,
  }), [students]);

  const statusFilters = [
    { key: "all", label: "All" },
    { key: "attention", label: "Needs Attention" },
    { key: "near", label: "Near Completion" },
    { key: "new", label: "New" },
    { key: "steady", label: "Steady" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 text-sm rounded-xl border border-border/40 bg-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {statusFilters.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  statusFilter === key
                    ? "bg-foreground text-background border-foreground"
                    : "border-border/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                <span className="tabular-nums">{counts[key as keyof typeof counts]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {(search || statusFilter !== "all") && (
        <p className="text-xs font-semibold text-muted-foreground tabular-nums">
          Showing {filtered.length} of {students.length} students
        </p>
      )}

      <div className="divide-y divide-border">
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm font-semibold text-muted-foreground">
            No students match your search or filter.
          </div>
        ) : (
          filtered.map((student) => (
            <article
              key={`${student.courseId}-${student.id}`}
              id={`student-${student.courseId}-${student.id}`}
              className="scroll-mt-24 px-5 py-4 hover:bg-surface-hover transition-colors"
            >
              <div className="flex flex-col gap-3 md:grid md:grid-cols-[1.1fr_1fr_1fr_140px_140px] md:items-center md:gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{student.name}</span>
                  {student.enrolledAt ? (
                    <span className="text-xs text-muted-foreground">
                      Enrolled {formatRelativeTime(student.enrolledAt)}
                    </span>
                  ) : null}
                </div>

                <span className="text-sm text-muted-foreground truncate">{student.email}</span>

                <div className="flex flex-col gap-1">
                  <Link
                    href={`/instructor/courses/${student.courseId}`}
                    className="text-sm text-foreground transition-colors hover:text-muted-foreground"
                  >
                    {student.courseTitle}
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2">
                  {student.needsAttention ? (
                    <Badge variant="destructive">Needs attention</Badge>
                  ) : null}
                  {student.isNearCompletion ? (
                    <Badge variant="secondary">Near completion</Badge>
                  ) : null}
                  {student.isNewEnrollment ? (
                    <Badge variant="outline">New</Badge>
                  ) : null}
                  {!student.needsAttention && !student.isNearCompletion && !student.isNewEnrollment ? (
                    <Badge variant="outline">Steady</Badge>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden bg-muted">
                    <div
                      className={`h-full transition-all ${
                        student.progressPercent >= 100
                          ? "bg-emerald-500 dark:bg-emerald-400"
                          : student.needsAttention
                            ? "bg-amber-500 dark:bg-amber-400"
                            : "bg-foreground"
                      }`}
                      style={{ width: `${Math.max(2, student.progressPercent)}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {student.progressPercent}%
                  </span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
