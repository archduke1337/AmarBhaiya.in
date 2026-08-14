import Link from "next/link";
import { BookOpen, DollarSign, Receipt, TrendingUp, Tag } from "lucide-react";

import {
  ActivityFeed,
  EmptyState,
  PageHeader,
  StatCard,
  StatGrid,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/server/appwrite/auth";
import { getInstructorRevenueOverview } from "@/server/appwrite/dashboard-data";
import { getCouponPaymentStats } from "@/server/actions/coupons";
import { formatCurrency, formatRelativeTime } from "@/lib/utils/format";

export default async function InstructorEarningsPage() {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const revenue = await getInstructorRevenueOverview({ userId: user.$id, role });

  // Get coupon stats for this instructor's courses
  const courseIds = revenue.courseEarnings.map((c) => c.id);
  const couponStats = await getCouponPaymentStats(courseIds);
  const totalCouponDiscounts = couponStats.reduce((sum, s) => sum + s.totalDiscount, 0);
  const totalCouponOrders = couponStats.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="flex max-w-6xl flex-col gap-8">
      <PageHeader
        eyebrow="Instructor · Revenue"
        title="Earnings Overview"
        description="Track completed sales, monthly momentum, and paid courses that may need a better pitch or a timely student reminder."
        actions={
          <Button asChild variant="outline" size="sm" className="w-full min-[420px]:w-auto">
            <Link href="/instructor">Back to dashboard</Link>
          </Button>
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

      {/* Coupon usage summary */}
      {totalCouponOrders > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/40 bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Tag className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Coupon Usage</p>
              <p className="text-xs text-muted-foreground">
                {totalCouponOrders} order{totalCouponOrders === 1 ? "" : "s"} with coupons
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 ml-auto">
            <div className="text-right">
              <p className="text-lg font-black tabular-nums">{totalCouponOrders}</p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Orders</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black tabular-nums text-destructive">-{formatCurrency(totalCouponDiscounts)}</p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Discounts given</p>
            </div>
          </div>
          <Link
            href="/instructor/coupons"
            className="text-xs font-semibold text-accent hover:underline underline-offset-4"
          >
            Manage coupons →
          </Link>
        </div>
      )}

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
                  href: `/instructor/earnings#course-revenue-${payment.courseId}`,
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
                  href: `/instructor/earnings#course-revenue-${course.id}`,
                }))}
              />
            </div>
          </section>

          <div className="bg-surface border border-border/40 rounded-2xl overflow-hidden scroll-mt-24">
            <div className="border-b border-border/40 bg-surface-hover px-5 py-3">
              <h2 className="font-heading text-lg font-black tracking-[-0.04em]">
                Revenue by Course
              </h2>
              <p className="mt-1 text-xs font-semibold leading-6 text-muted-foreground">
                Monthly revenue, lifetime revenue, enrollments, and last sale in one place.
              </p>
            </div>

            <div className="hidden items-center gap-4 border-b border-border/40 bg-surface-hover px-5 py-3 font-heading text-xs font-black uppercase tracking-[0.15em] text-muted-foreground lg:grid lg:grid-cols-[1.4fr_120px_140px_140px_140px]">
              <span>Course</span>
              <span>Type</span>
              <span>This Month</span>
              <span>All Time</span>
              <span>Enrollments</span>
            </div>

            <div className="divide-y divide-border/40">
              {revenue.courseEarnings.map((course) => (
                <article
                  key={course.id}
                  id={`course-revenue-${course.id}`}
                  className="scroll-mt-24 px-5 py-4 transition-colors hover:bg-accent/30"
                >
                  <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[1.4fr_120px_140px_140px_140px] lg:items-center lg:gap-4">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/instructor/courses/${course.id}`}
                        className="text-sm font-semibold transition-colors hover:text-muted-foreground"
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
                      <span className="text-xs font-semibold text-muted-foreground">
                        {course.lastPaymentAt
                          ? `Last sale ${formatRelativeTime(course.lastPaymentAt)}`
                          : "No completed sales yet"}
                      </span>
                    </div>

                    <span className="text-sm font-semibold text-muted-foreground capitalize">
                      {course.accessModel}
                    </span>

                    <span className="text-sm font-semibold tabular-nums">
                      {course.accessModel === "paid"
                        ? formatCurrency(course.monthlyRevenue)
                        : "Free"}
                    </span>

                    <span className="text-sm font-semibold tabular-nums">
                      {course.accessModel === "paid"
                        ? formatCurrency(course.totalRevenue)
                        : "Free"}
                    </span>

                    <span className="text-sm font-semibold text-muted-foreground">
                      {course.enrollments}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
