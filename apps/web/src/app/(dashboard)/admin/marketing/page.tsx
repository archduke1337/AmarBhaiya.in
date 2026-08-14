import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  FileText,
  Globe2,
  Megaphone,
  RefreshCw,
  Star,
  Users,
  BookOpen,
  CreditCard,
  ExternalLink,
} from "lucide-react";

import {
  upsertSiteCopyFormAction,
  updateCourseVisibilityFormAction,
} from "@/server/actions/form-wrappers";
import { getAdminDashboardStats, getAdminCourses } from "@/server/appwrite/dashboard-data";
import {
  formatCompactNumber,
  formatCurrency,
} from "@/lib/utils/format";
import { PageHeader, StatCard, StatGrid } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireRole } from "@/server/appwrite/auth";
import { CollectionsForm } from "./collections-form";
import { JsonEditor } from "./json-editor";

const suggestedSiteKeys = [
  "home.domains",
  "home.learnItems",
  "home.whyItems",
  "home.metrics",
  "home.featuredCourses",
  "home.collections",
  "site.announcement",
  "about.identityCards",
  "about.journey",
  "about.mission",
  "contact.channels",
];

const collectionsJsonExample = JSON.stringify(
  {
    collections: [
      {
        id: "class-10-bundle",
        title: "Class 10 Complete Bundle",
        subtitle: "All subjects, one package",
        courseSlugs: ["maths-class-10", "science-class-10"],
        cta: "View Bundle",
      },
    ],
  },
  null,
  2
);

const announcementJsonExample = JSON.stringify(
  {
    text: "New batch starting April 1st! Enroll now.",
    link: "/courses",
    linkLabel: "Learn More",
    isDismissible: true,
    isActive: true,
    backgroundColor: "oklch(0.85 0.15 72)",
  },
  null,
  2
);

const routePreviews: Array<{
  title: string;
  href: string;
  keyHint: string;
  description: string;
}> = [
  {
    title: "Homepage",
    href: "/",
    keyHint: "home.*",
    description: "Hero sections, metrics, and featured courses.",
  },
  {
    title: "About",
    href: "/about",
    keyHint: "about.*",
    description: "Identity cards, mission, and journey timeline.",
  },
  {
    title: "Courses",
    href: "/courses",
    keyHint: "home.featuredCourses",
    description: "Featured courses and discovery surface.",
  },
  {
    title: "Contact",
    href: "/contact",
    keyHint: "contact.channels",
    description: "Support channels and communication CTAs.",
  },
];

export default async function AdminMarketingPage() {
  await requireRole(["admin"]);
  const [stats, courses] = await Promise.all([
    getAdminDashboardStats(),
    getAdminCourses(),
  ]);
  const featuredCount = courses.filter((c) => c.featured === "yes").length;

  return (
    <div className="flex flex-col gap-8 max-w-7xl">
      <PageHeader
        eyebrow="Admin"
        title="Marketing CMS"
        description="Manage homepage content, featured courses, collections, announcements, and site copy. Blog management has moved to its own panel."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/blog">
                <FileText className="size-4" />
                Blog Manager
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
            <Button asChild>
              <Link href="/" target="_blank" rel="noreferrer">
                <Globe2 className="size-4" />
                View Site
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </>
        }
      />

      {/* ── Marketing Performance Metrics ─────────────────────────────────── */}
      <StatGrid columns={4}>
        <StatCard
          label="Total Users"
          value={formatCompactNumber(stats.totalUsers)}
          icon={Users}
          description="Platform-wide registrations"
        />
        <StatCard
          label="Active Enrollments"
          value={formatCompactNumber(stats.activeEnrollments)}
          icon={BookOpen}
          description={`${stats.completionRate}% completion rate`}
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={CreditCard}
          description={`Total: ${formatCurrency(stats.totalRevenue)}`}
        />
        <StatCard
          label="Featured Courses"
          value={featuredCount}
          icon={Star}
          description={`${stats.totalCourses} published courses`}
        />
      </StatGrid>

      {/* ── Quick Management Links ────────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/courses"
          className="group bg-surface border border-border/40 rounded-2xl p-4 transition-all hover:bg-surface-hover hover:border-border/60"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center text-accent shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="size-4.5" />
            </div>
            <div>
              <span className="font-bold text-sm group-hover:text-accent transition-colors">
                Course Management
              </span>
              <p className="text-xs text-foreground/50">Publish, feature, archive</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/categories"
          className="group bg-surface border border-border/40 rounded-2xl p-4 transition-all hover:bg-surface-hover hover:border-border/60"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center text-accent shrink-0 group-hover:scale-105 transition-transform">
              <BarChart3 className="size-4.5" />
            </div>
            <div>
              <span className="font-bold text-sm group-hover:text-accent transition-colors">
                Categories
              </span>
              <p className="text-xs text-foreground/50">Organize course taxonomy</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/payments"
          className="group bg-surface border border-border/40 rounded-2xl p-4 transition-all hover:bg-surface-hover hover:border-border/60"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center text-accent shrink-0 group-hover:scale-105 transition-transform">
              <CreditCard className="size-4.5" />
            </div>
            <div>
              <span className="font-bold text-sm group-hover:text-accent transition-colors">
                Payment Records
              </span>
              <p className="text-xs text-foreground/50">Transactions and refunds</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/students"
          className="group bg-surface border border-border/40 rounded-2xl p-4 transition-all hover:bg-surface-hover hover:border-border/60"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center text-accent shrink-0 group-hover:scale-105 transition-transform">
              <Users className="size-4.5" />
            </div>
            <div>
              <span className="font-bold text-sm group-hover:text-accent transition-colors">
                Student Insights
              </span>
              <p className="text-xs text-foreground/50">Profiles and engagement</p>
            </div>
          </div>
        </Link>
      </section>

      {/* ── Featured Courses Manager ──────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
        <div className="flex items-center gap-2 border-b border-border/40 bg-surface-hover px-5 py-3.5">
          <Star className="size-4 text-muted-foreground" />
          <div>
            <h2 className="font-heading text-sm font-black uppercase tracking-[0.12em]">
              Featured Courses Manager
            </h2>
            <p className="text-xs text-muted-foreground">
              {featuredCount} of {courses.length} courses featured — these appear on the homepage hero section. Mark top-priority courses so students see them first.
            </p>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="px-5 py-6 text-sm font-medium text-muted-foreground">
            No courses yet. Courses will appear here once instructors create them.
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            <div className="hidden items-center gap-4 px-5 py-2.5 font-heading text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[1fr_140px_100px_160px]">
              <span>Course</span>
              <span>Category</span>
              <span>Status</span>
              <span>Featured</span>
            </div>

            {courses.map((course) => (
              <form
                key={course.id}
                action={updateCourseVisibilityFormAction}
                className="flex flex-col gap-2 px-5 py-3 md:grid md:grid-cols-[1fr_140px_100px_160px] md:items-center md:gap-4"
              >
                <input type="hidden" name="courseId" value={course.id} />

                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate text-sm font-semibold">{course.title}</span>
                </div>

                <Badge variant="outline" className="w-fit text-[10px]">
                  {course.category}
                </Badge>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isPublished"
                    defaultChecked={course.state === "published"}
                    className="size-3.5 accent-foreground"
                  />
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {course.state === "published" ? "Published" : "Draft"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="inline-flex min-h-9 items-center gap-2 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-input px-3 shadow-retro-sm">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      defaultChecked={course.featured === "yes"}
                      className="size-4 accent-foreground"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                      {course.featured === "yes" ? "Featured" : "Set featured"}
                    </span>
                  </label>
                  <Button type="submit" size="xs" variant="secondary" className="shrink-0">
                    Save
                  </Button>
                </div>
              </form>
            ))}
          </div>
        )}

        <div className="border-t border-border/40 bg-surface-hover px-5 py-2.5">
          <p className="text-[10px] font-semibold text-muted-foreground">
            ⚡ Homepage picks the top 3 featured courses by enrollment count. Unfeature a course or feature a new one and the hero section updates after publish.
          </p>
        </div>
      </section>

      {/* ── Featured Collections Manager ──────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
        <div className="flex items-center gap-2 border-b border-border/40 bg-surface-hover px-5 py-3.5">
          <BookOpen className="size-4 text-muted-foreground" />
          <div>
            <h2 className="font-heading text-sm font-black uppercase tracking-[0.12em]">
              Featured Collections
            </h2>
            <p className="text-xs text-muted-foreground">
              Group courses into curated bundles — like &quot;Class 10 Science Pack&quot; or &quot;Maths Foundation&quot;. Collections appear on the homepage below featured courses.
            </p>
          </div>
        </div>

        <CollectionsForm
          upsertSiteCopyFormAction={upsertSiteCopyFormAction}
          defaults={{
            title: "Curated Learning Packs",
            payload: collectionsJsonExample,
          }}
        />

        <div className="border-t border-border/40 bg-surface-hover px-5 py-2.5">
          <p className="text-[10px] font-semibold text-muted-foreground">
            💡 Collections render as horizontal scrollable sections on the homepage. Add course slugs that match the slug field in your courses table.
          </p>
        </div>
      </section>

      {/* ── Announcement Banner Manager ────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
        <div className="flex items-center gap-2 border-b border-border/40 bg-surface-hover px-5 py-3.5">
          <Megaphone className="size-4 text-muted-foreground" />
          <div>
            <h2 className="font-heading text-sm font-black uppercase tracking-[0.12em]">
              Announcement Banner
            </h2>
            <p className="text-xs text-muted-foreground">
              Show a dismissible banner at the top of every page. Useful for upcoming batches, holiday schedules, or urgent notices.
            </p>
          </div>
        </div>

        <form action={upsertSiteCopyFormAction} className="flex flex-col gap-4 p-5">
          <input type="hidden" name="key" value="site.announcement" />
          <input type="hidden" name="isPublished" value="true" />

          <JsonEditor
            id="announcement-payload"
            name="payload"
            defaultValue={announcementJsonExample}
            label="Banner Configuration JSON"
            placeholder='{"text": "..."}'
          />
          <p className="text-[10px] font-semibold text-muted-foreground">
            Fields: text (required), link (optional URL), linkLabel, isDismissible, isActive (set false to hide), backgroundColor (oklch color).
          </p>

          <div className="flex justify-end">
            <Button type="submit" className="w-full sm:w-auto">
              <Megaphone className="size-4" />
              Save Banner
            </Button>
          </div>
        </form>

        <div className="border-t border-border/40 bg-surface-hover px-5 py-2.5">
          <p className="text-[10px] font-semibold text-muted-foreground">
            🔔 Set isActive to false or delete the announcement to hide the banner. Users who dismiss it won&apos;t see it again unless you change the announcement text.
          </p>
        </div>
      </section>

      {/* ── Site Copy Manager ───────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
        <div className="flex items-center gap-2 border-b border-border/40 bg-surface-hover px-5 py-3.5">
          <RefreshCw className="size-4 text-muted-foreground" />
          <div>
            <h2 className="font-heading text-sm font-black uppercase tracking-[0.12em]">
              Site Copy Manager
            </h2>
            <p className="text-xs text-muted-foreground">
              Keep homepage, about, and contact sections in sync.
            </p>
          </div>
        </div>

        <form action={upsertSiteCopyFormAction} className="flex flex-col gap-4 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1.5 md:col-span-2">
              <Label htmlFor="site-copy-key">Key</Label>
              <Input
                id="site-copy-key"
                name="key"
                placeholder="example: home.domains"
                required
              />
            </label>

            <label className="space-y-1.5">
              <Label htmlFor="site-copy-title">Title</Label>
              <Input
                id="site-copy-title"
                name="title"
                placeholder="Optional heading"
              />
            </label>

            <label className="space-y-1.5">
              <Label htmlFor="site-copy-status">Publish state</Label>
              <select
                id="site-copy-status"
                name="isPublished"
                className="input-field--select w-full"
                defaultValue="true"
              >
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
            </label>
          </div>

          <label className="space-y-1.5">
            <Label htmlFor="site-copy-body">Body</Label>
            <textarea
              id="site-copy-body"
              name="body"
              placeholder="Short copy for this section"
              className="input-field--textarea min-h-24 w-full"
            />
          </label>

          <label className="space-y-1.5">
            <Label htmlFor="site-copy-payload">JSON payload</Label>
            <textarea
              id="site-copy-payload"
              name="payload"
              placeholder='{"items":[{"title":"Example","value":"Data"}]}'
              className="input-field--textarea w-full min-h-40 font-mono text-xs"
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <Button type="submit" className="w-full sm:w-auto">
              <RefreshCw className="size-4" />
              Sync Site Copy
            </Button>
          </div>
        </form>

        <div className="border-t border-border/40 bg-surface-hover px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
            Suggested Keys
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedSiteKeys.map((key) => (
              <Badge key={key} variant="outline" className="font-mono text-[11px]">
                {key}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Marketing Routes ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Live Marketing Routes
          </p>
          <h2 className="font-heading text-lg font-black tracking-[-0.03em]">
            Connected Page Previews
          </h2>
          <p className="mt-1 text-sm font-medium leading-7 text-muted-foreground">
            Open each page to see how site copy content renders on the public site.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {routePreviews.map((route) => (
            <div
              key={route.href}
              className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-surface p-4 transition-all hover:bg-surface-hover"
            >
              <div>
                <p className="text-sm font-bold">{route.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{route.description}</p>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">
                  {route.keyHint}
                </span>
                <Button asChild size="xs" variant="outline" className="shrink-0">
                  <Link href={route.href} target="_blank" rel="noreferrer">
                    Preview
                    <ExternalLink className="size-3" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
