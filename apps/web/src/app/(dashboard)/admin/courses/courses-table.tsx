"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  updateCourseVisibilityFormAction,
  deleteCourseFormAction,
} from "@/server/actions/form-wrappers";

type CourseItem = {
  id: string;
  title: string;
  slug: string;
  state: string;
  featured: string;
  category: string;
  price: number;
  instructorName: string;
  instructorId: string;
  enrollmentCount: number;
  totalLessons: number;
  isPublished: boolean;
  isFeatured: boolean;
};

export function AdminCoursesTable({
  courses,
}: {
  courses: CourseItem[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return courses.filter((c) => {
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.instructorName.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && c.isPublished) ||
        (statusFilter === "draft" && !c.isPublished) ||
        (statusFilter === "featured" && c.isFeatured) ||
        (statusFilter === "free" && c.price === 0);
      return matchesSearch && matchesStatus;
    });
  }, [courses, search, statusFilter]);

  const counts = useMemo(
    () => ({
      all: courses.length,
      published: courses.filter((c) => c.isPublished).length,
      draft: courses.filter((c) => !c.isPublished).length,
      featured: courses.filter((c) => c.isFeatured).length,
      free: courses.filter((c) => c.price === 0).length,
    }),
    [courses]
  );

  const statusFilters = [
    { key: "all", label: "All" },
    { key: "published", label: "Published" },
    { key: "draft", label: "Drafts" },
    { key: "featured", label: "Featured" },
    { key: "free", label: "Free" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, instructor, or category..."
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
          Showing {filtered.length} of {courses.length} courses
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
        <div className="hidden items-center gap-4 border-b border-border/40 bg-surface-hover px-5 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[1fr_120px_80px_80px_100px_120px]">
          <span>Course</span>
          <span>Instructor</span>
          <span>Price</span>
          <span>Students</span>
          <span>Category</span>
          <span>Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm font-semibold text-muted-foreground">
            No courses match your search or filter.
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((course) => (
              <AdminCourseRow key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminCourseRow({ course }: { course: CourseItem }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-3 px-5 py-4 md:grid md:grid-cols-[1fr_120px_80px_80px_100px_120px] md:items-center md:gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={course.slug ? `/courses/${course.slug}` : "#"}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold truncate hover:underline underline-offset-4 inline-flex items-center gap-1"
          >
            {course.title}
            <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
          </Link>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {course.isPublished ? (
            <Badge variant="default" className="text-[9px] px-1.5 py-0">Published</Badge>
          ) : (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">Draft</Badge>
          )}
          {course.isFeatured ? (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Featured</Badge>
          ) : null}
          {course.totalLessons > 0 && (
            <span className="text-[10px] text-muted-foreground">{course.totalLessons} lessons</span>
          )}
        </div>
      </div>

      <span className="text-sm text-muted-foreground truncate">{course.instructorName}</span>

      <span className="text-sm font-semibold tabular-nums">
        {course.price === 0 ? (
          <span className="text-emerald-600 dark:text-emerald-400">Free</span>
        ) : (
          formatCurrency(course.price)
        )}
      </span>

      <span className="text-sm tabular-nums text-muted-foreground">{course.enrollmentCount}</span>

      <Badge variant="outline" className="w-fit text-[10px]">
        {course.category}
      </Badge>

      <div className="flex items-center gap-2">
        <form action={updateCourseVisibilityFormAction}>
          <input type="hidden" name="courseId" value={course.id} />
          <input
            type="hidden"
            name="isPublished"
            value={course.isPublished ? "false" : "true"}
          />
          <Button type="submit" variant="secondary" size="xs">
            {course.isPublished ? "Unpublish" : "Publish"}
          </Button>
        </form>

        {confirming ? (
          <div className="flex items-center gap-1">
            <form action={deleteCourseFormAction}>
              <input type="hidden" name="courseId" value={course.id} />
              <Button type="submit" variant="destructive" size="xs">
                Confirm
              </Button>
            </form>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="xs"
            onClick={() => setConfirming(true)}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
