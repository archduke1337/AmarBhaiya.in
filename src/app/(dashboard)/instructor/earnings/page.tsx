import Link from "next/link";
import { BookOpen, DollarSign, Receipt, TrendingUp } from "lucide-react";

import {
  ActivityFeed,
  EmptyState,
  PageHeader,
  StatCard,
  StatGrid,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/appwrite/auth";
import { getInstructorRevenueOverview } from "@/lib/appwrite/dashboard-data";
import { formatCurrency, formatRelativeTime } from "@/lib/utils/format";

export default async function InstructorEarningsPage() {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const revenue = await getInstructorRevenueOverview({ userId: user.$id, role });

  return (
    <div className="flex max-w-6xl flex-col gap-8">
      <PageHeader
        eyebrow="Instructor · Revenue"
        title="Earnings Overview"
        description="Track revenue, recent sales, and the courses that need promotion or pricing attention."
        actions={
          <Link
            href="/instructor"
            className="inline-flex h-9 items-center px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to dashboard
          </Link>
        }
      />

      <StatGrid columns={4}>
        <StatCard
          label="Total Earnings"
          value={formatCurrency(revenue.totalEarnings)}
          icon={DollarSign}
          description="All completed sales"
        />
        <StatCard
          label="This Month"
          value={formatCurrency(revenue.monthlyEarnings)}
          icon={TrendingUp}
          description="Current calendar month"
        />
        <StatCard
          label="Total Enrollments"
          value={revenue.totalEnrollments}
          icon={BookOpen}
          description="Across all managed courses"
        />
        <StatCard
          label="Paid Courses"
          value={revenue.paidCourseCount}
          icon={Receipt}
          description={`${revenue.publishedPaidCourses} currently published`}
        />
      </StatGrid>

      {revenue.courseEarnings.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No course revenue yet"
          description="Once you create courses and start enrolling students, your revenue pulse will appear here."
        />
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            <div id="recent-sales" className="scroll-mt-24">
              <ActivityFeed
                title={`Recent Sales (${revenue.recentPayments.length})`}
                emptyText="Completed sales will appear here."
                items={revenue.recentPayments.map((payment) => ({
                  id: payment.id,
                  label: payment.courseTitle,
                  description: formatCurrency(payment.amount),
                  badge: "Sale",
                  timestamp: payment.paidAt
                    ? formatRelativeTime(payment.paidAt)
                    : undefined,
                  href: `#course-revenue-${payment.courseId}`,
                }))}
              />
            </div>

            <div id="courses-to-watch" className="scroll-mt-24">
              <ActivityFeed
                title={`Courses To Watch (${revenue.dormantPaidCourses.length})`}
                emptyText="Every published paid course has revenue activity this month."
                items={revenue.dormantPaidCourses.slice(0, 6).map((course) => ({
                  id: course.id,
                  label: course.title,
                  description:
                    course.totalRevenue > 0
                      ? "Selling historically, but no completed sales this month"
                      : "Published with no completed sales yet",
                  badge: course.totalRevenue > 0 ? "Dormant" : "No sales",
                  href: `#course-revenue-${course.id}`,
                }))}
              />
            </div>
          </section>

          <section id="course-revenue" className="border border-border scroll-mt-24">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-medium">Revenue by Course</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Monthly revenue, lifetime revenue, enrollments, and last sale in one place.
              </p>
            </div>

            <div className="hidden items-center gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground lg:grid lg:grid-cols-[1.4fr_120px_140px_140px_140px]">
              <span>Course</span>
              <span>Type</span>
              <span>This Month</span>
              <span>All Time</span>
              <span>Enrollments</span>
            </div>

            <div className="divide-y divide-border">
              {revenue.courseEarnings.map((course) => (
                <article
                  key={course.id}
                  id={`course-revenue-${course.id}`}
                  className="scroll-mt-24 px-5 py-4"
                >
                  <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[1.4fr_120px_140px_140px_140px] lg:items-center lg:gap-4">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/instructor/courses/${course.id}`}
                        className="text-sm font-medium transition-colors hover:text-muted-foreground"
                      >
                        {course.title}
                      </Link>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={course.accessModel === "paid" ? "default" : "outline"}>
                          {course.accessModel}
                        </Badge>
                        <Badge variant={course.isPublished ? "secondary" : "outline"}>
                          {course.isPublished ? "Published" : "Draft"}
                        </Badge>
                        {course.accessModel === "paid" && course.monthlyRevenue <= 0 ? (
                          <Badge variant="destructive">Needs attention</Badge>
                        ) : null}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {course.lastPaymentAt
                          ? `Last sale ${formatRelativeTime(course.lastPaymentAt)}`
                          : "No completed sales yet"}
                      </span>
                    </div>

                    <span className="text-sm text-muted-foreground capitalize">
                      {course.accessModel}
                    </span>

                    <span className="text-sm font-medium tabular-nums">
                      {course.accessModel === "paid"
                        ? formatCurrency(course.monthlyRevenue)
                        : "Free"}
                    </span>

                    <span className="text-sm font-medium tabular-nums">
                      {course.accessModel === "paid"
                        ? formatCurrency(course.totalRevenue)
                        : "Free"}
                    </span>

                    <span className="text-sm text-muted-foreground">
                      {course.enrollments}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
