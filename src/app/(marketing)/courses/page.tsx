import type { Metadata } from "next";
import Link from "next/link";

import { COURSE_CATALOG } from "@/lib/utils/content";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  sort?: string;
}>;

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Browse all courses across coding, board prep, fitness, and career growth.",
};

function normalizeSort(value: string | undefined): "popular" | "newest" | "price" {
  if (value === "newest" || value === "price") {
    return value;
  }

  return "popular";
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const category = typeof params.category === "string" ? params.category : "all";
  const sort = normalizeSort(params.sort);

  const categories = Array.from(new Set(COURSE_CATALOG.map((course) => course.category)));

  const filtered = COURSE_CATALOG.filter((course) => {
    const categoryMatch = category === "all" || course.category === category;
    const queryMatch =
      query.length === 0 ||
      course.title.toLowerCase().includes(query) ||
      course.shortDescription.toLowerCase().includes(query);

    return categoryMatch && queryMatch;
  });

  const sorted = [...filtered].sort((left, right) => {
    if (sort === "newest") {
      return right.updatedAt.localeCompare(left.updatedAt);
    }

    if (sort === "price") {
      return left.priceInr - right.priceInr;
    }

    return right.enrolledStudents - left.enrolledStudents;
  });

  return (
    <div className="px-6 md:px-12 py-20 md:py-28 space-y-12">
      <section className="max-w-6xl mx-auto space-y-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Course Catalogue</p>
        <h1 className="text-4xl md:text-6xl leading-tight">
          Choose your next practical skill.
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">
          Explore focused, execution-first courses designed for students who
          want outcomes, not just content consumption.
        </p>
      </section>

      <section className="max-w-6xl mx-auto border border-border p-4 md:p-5">
        <form className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]" method="GET">
          <input
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder="Search by title or keyword"
            className="h-11 bg-background border border-border px-3 text-sm"
          />

          <select
            name="category"
            defaultValue={category}
            className="h-11 bg-background border border-border px-3 text-sm"
          >
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            name="sort"
            defaultValue={sort}
            className="h-11 bg-background border border-border px-3 text-sm"
          >
            <option value="popular">Sort by popular</option>
            <option value="newest">Sort by newest</option>
            <option value="price">Sort by price</option>
          </select>

          <button
            type="submit"
            className="h-11 px-5 bg-foreground text-background text-sm font-medium"
          >
            Apply
          </button>
        </form>
      </section>

      <section className="max-w-6xl mx-auto grid md:grid-cols-2 gap-5">
        {sorted.map((course) => (
          <article key={course.slug} className="border border-border p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border px-2 py-1">
                {course.category}
              </span>
              <span className="text-sm text-muted-foreground">
                {course.enrolledStudents.toLocaleString("en-IN")} learners
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl leading-tight">{course.title}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {course.shortDescription}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="border border-border p-3">
                <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Lessons</p>
                <p>{course.totalLessons}</p>
              </div>
              <div className="border border-border p-3">
                <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Hours</p>
                <p>{course.totalDurationHours}</p>
              </div>
              <div className="border border-border p-3">
                <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Rating</p>
                <p>{course.rating.toFixed(1)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-lg">
                {course.priceInr === 0 ? "Free" : `INR ${course.priceInr}`}
              </p>
              <Link
                href={`/courses/${course.slug}`}
                className="text-sm underline underline-offset-4"
              >
                View details
              </Link>
            </div>
          </article>
        ))}
      </section>

      {sorted.length === 0 && (
        <section className="max-w-6xl mx-auto border border-border p-10 text-center">
          <p className="text-muted-foreground">
            No courses matched your filters. Try resetting search or category.
          </p>
        </section>
      )}
    </div>
  );
}
