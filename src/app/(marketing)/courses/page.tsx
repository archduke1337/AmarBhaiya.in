import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
    <div className="space-y-12 px-6 py-20 md:px-12 md:py-28">
      <section className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
        <SectionHeading
          eyebrow="Course catalogue"
          title="Choose the next skill that will actually change your week."
          description="These courses are built for action, not shelf value. Less inflated curriculum. More direct movement from lesson to result."
          titleAs="h1"
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:translate-y-8">
          <RetroPanel tone="secondary" className="space-y-2">
            <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Courses live
            </p>
            <p className="font-heading text-4xl font-black tracking-[-0.08em]">{courses.length}</p>
          </RetroPanel>
          <RetroPanel tone="accent" className="space-y-2">
            <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Categories
            </p>
            <p className="font-heading text-4xl font-black tracking-[-0.08em]">{categories.length}</p>
          </RetroPanel>
        </div>
      </section>

      <section className="mx-auto max-w-6xl">
        <RetroPanel tone="accent" className="space-y-4">
          <form className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto]" method="GET">
            <div className="space-y-2">
              <Label htmlFor="course-search">Search</Label>
              <input
                id="course-search"
                type="search"
                name="q"
                defaultValue={params.q}
                placeholder="Search by title or keyword"
                className="h-11 w-full rounded-[calc(var(--radius)+2px)] border-2 border-border bg-card px-3.5 text-sm font-semibold text-foreground shadow-retro-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-category">Category</Label>
              <select
                id="course-category"
                name="category"
                aria-label="Filter by category"
                defaultValue={category}
                className="h-11 w-full rounded-[calc(var(--radius)+2px)] border-2 border-border bg-card px-3.5 text-sm font-semibold text-foreground shadow-retro-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <option value="all">All categories</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-sort">Sort</Label>
              <select
                id="course-sort"
                name="sort"
                aria-label="Sort courses"
                defaultValue={sort}
                className="h-11 w-full rounded-[calc(var(--radius)+2px)] border-2 border-border bg-card px-3.5 text-sm font-semibold text-foreground shadow-retro-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <option value="popular">Sort by popular</option>
                <option value="newest">Sort by newest</option>
                <option value="price">Sort by price</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button type="submit" size="lg">
                Apply
              </Button>
            </div>
          </form>
        </RetroPanel>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-2">
        {courses.map((course) => (
          <RetroPanel
            key={course.slug}
            tone={
              course.accessModel === "free"
                ? "secondary"
                : course.accessModel === "subscription"
                  ? "accent"
                  : "card"
            }
            size="lg"
            className="space-y-5"
          >
            {course.thumbnailUrl ? (
              <Image
                src={course.thumbnailUrl}
                alt={course.title}
                width={1280}
                height={720}
                className="aspect-video w-full rounded-[calc(var(--radius)+4px)] border-2 border-border object-cover shadow-retro-sm"
                loading="lazy"
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-[calc(var(--radius)+4px)] border-2 border-border bg-muted/40 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground shadow-retro-sm">
                No thumbnail
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="outline">{course.category}</Badge>
              <span className="text-sm font-semibold text-muted-foreground">
                {course.enrolledStudents.toLocaleString("en-IN")} learners
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="font-heading text-3xl leading-[0.96] font-black tracking-[-0.05em]">
                {course.title}
              </h2>
              <p className="text-sm font-medium leading-7 text-foreground/80">
                {course.shortDescription}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-card px-3 py-3 shadow-retro-sm">
                <p className="mb-1 font-heading text-[0.65rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Lessons
                </p>
                <p className="font-bold">{course.totalLessons}</p>
              </div>
              <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-card px-3 py-3 shadow-retro-sm">
                <p className="mb-1 font-heading text-[0.65rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Hours
                </p>
                <p className="font-bold">{course.totalDurationHours}</p>
              </div>
              <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-card px-3 py-3 shadow-retro-sm">
                <p className="mb-1 font-heading text-[0.65rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Rating
                </p>
                <p className="font-bold">{course.rating.toFixed(1)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div className="space-y-1">
                <p className="font-heading text-[0.68rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Investment
                </p>
                <p className="text-xl font-bold tracking-[-0.03em]">
                  {course.priceInr === 0 ? "Free" : `INR ${course.priceInr}`}
                </p>
              </div>
              <Button asChild variant="outline" size="lg">
                <Link href={`/courses/${course.slug}`}>View details</Link>
              </Button>
            </div>
          </RetroPanel>
        ))}
      </section>

      {courses.length === 0 && (
        <section className="mx-auto max-w-6xl">
          <RetroPanel tone="muted" className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No courses matched your filters. Try resetting search or category.
            </p>
          </RetroPanel>
        </section>
      )}
    </div>
  );
}
