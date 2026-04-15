import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const activeFilters = [
    query ? `Search: ${query}` : null,
    category !== "all" ? `Category: ${category}` : null,
    sort !== "popular" ? `Sort: ${sort}` : "Sort: popular",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[1.02fr_0.98fr] xl:items-start">
        <SectionHeading
          eyebrow="Course catalogue"
          title="Choose the next skill that will actually change your week."
          description="The biggest focus is school and board-oriented learning for Indian students. Skills, coding, and career tracks are growing too, but the catalogue still has to feel useful first, not impressive first."
          titleAs="h1"
        />

        <div className="grid gap-4 xl:translate-y-8">
          <div className="grid gap-4 sm:grid-cols-2">
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
          <RetroPanel tone="card" className="space-y-3">
            <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
              How this catalogue is shaped
            </p>
            <p className="text-sm font-medium leading-7 text-foreground/80">
              The better courses do three things well: explain the point clearly, make practice feel natural, and give students a clean reason to keep going.
            </p>
          </RetroPanel>
        </div>
      </section>

      <section className="mx-auto max-w-6xl">
        <RetroPanel tone="accent" className="space-y-5">
          <form className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto]" method="GET">
            <div className="space-y-2">
              <Label htmlFor="course-search">Search</Label>
              <Input
                id="course-search"
                type="search"
                name="q"
                defaultValue={params.q}
                placeholder="Search by title or keyword"
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

          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.map((filter) => (
              <Badge key={filter} variant="outline">
                {filter}
              </Badge>
            ))}
          </div>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-6xl space-y-5">
        <RetroPanel tone="card" className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Results
            </p>
            <p className="text-sm font-medium leading-6 text-foreground/80">
              Showing {courses.length} course{courses.length === 1 ? "" : "s"} that fit the current view.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Structured lessons</Badge>
            <Badge variant="ghost">Direct outcomes</Badge>
            <Badge variant="outline">Student-friendly pricing</Badge>
          </div>
        </RetroPanel>

        <div className="grid gap-5 lg:grid-cols-2">
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
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{course.category}</Badge>
                <Badge variant="ghost">{course.accessModel}</Badge>
              </div>
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
        </div>
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
