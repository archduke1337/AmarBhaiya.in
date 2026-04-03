import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getPublicCoursesPageData } from "@/lib/appwrite/marketing-content";

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

  const { courses, categories } = await getPublicCoursesPageData({
    query,
    category,
    sort,
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
            aria-label="Filter by category"
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
            aria-label="Sort courses"
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
        {courses.map((course) => (
          <article key={course.slug} className="border border-border p-6 space-y-5">
            {course.thumbnailUrl ? (
              <Image
                src={course.thumbnailUrl}
                alt={course.title}
                width={1280}
                height={720}
                className="w-full aspect-video object-cover border border-border"
                loading="lazy"
              />
            ) : (
              <div className="w-full aspect-video border border-border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                No thumbnail
              </div>
            )}
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

      {courses.length === 0 && (
        <section className="max-w-6xl mx-auto border border-border p-10 text-center">
          <p className="text-muted-foreground">
            No courses matched your filters. Try resetting search or category.
          </p>
        </section>
      )}
    </div>
  );
}
