import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Receipt,
  TrendingUp,
} from "lucide-react";

import { getAdminPayments } from "@/lib/appwrite/dashboard-data";
import {
  formatCurrency,
  formatDateTime,
  formatRelativeTime,
} from "@/lib/utils/format";
import {
  ActivityFeed,
  EmptyState,
  PageHeader,
  StatCard,
  StatGrid,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

type CourseRevenueItem = {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  revenue: number;
  payments: number;
};

export default async function AdminPaymentsPage() {
  const payments = await getAdminPayments();

  const completedPayments = payments.filter((payment) => payment.status === "completed");
  const pendingPayments = payments.filter((payment) => payment.status === "pending");
  const failedPayments = payments.filter((payment) => payment.status === "failed");
  const refundedPayments = payments.filter((payment) => payment.status === "refunded");

  const totalRevenue = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthlyRevenue = completedPayments.reduce((sum, payment) => {
    if (!payment.createdAt) {
      return sum;
    }

    const createdAt = new Date(payment.createdAt);
    if (Number.isNaN(createdAt.getTime()) || createdAt < monthStart) {
      return sum;
    }

    return sum + payment.amount;
  }, 0);

  const attentionPayments = payments.filter(
    (payment) => payment.status === "pending" || payment.status === "failed" || payment.status === "refunded"
  );

  const courseRevenueMap = completedPayments.reduce((map, payment) => {
      const key = payment.courseId || payment.courseTitle;
      const existing = map.get(key) ?? {
        courseId: payment.courseId,
        courseSlug: payment.courseSlug,
        courseTitle: payment.courseTitle,
        revenue: 0,
        payments: 0,
      };
      existing.revenue += payment.amount;
      existing.payments += 1;
      map.set(key, existing);
      return map;
    }, new Map<string, CourseRevenueItem>());

  const topCourseItems = Array.from(courseRevenueMap.values())
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Admin · Payments"
        title="Transactions & Revenue"
        description={`${payments.length} total transaction records across all courses and users.`}
      />

      <StatGrid columns={4}>
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          description={`${completedPayments.length} completed payments`}
        />
        <StatCard
          label="This Month"
          value={formatCurrency(monthlyRevenue)}
          icon={TrendingUp}
          description="Completed this month"
        />
        <StatCard
          label="Pending"
          value={pendingPayments.length}
          icon={Clock}
          description={pendingPayments.length > 0 ? "Need confirmation" : "Nothing waiting"}
        />
        <StatCard
          label="Issues"
          value={failedPayments.length + refundedPayments.length}
          icon={AlertTriangle}
          description="Failed or refunded"
        />
      </StatGrid>

      {payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payment records"
          description="Payments will appear here once students purchase paid or subscription courses."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          <section
            id="payments-list"
            className="scroll-mt-24 border border-border xl:col-span-2"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div>
                <h2 className="text-sm font-medium">All Transactions</h2>
                <p className="text-xs text-muted-foreground">
                  Newest records first, with direct student and course drill-down.
                </p>
              </div>
              <Badge variant="outline">{payments.length} records</Badge>
            </div>

            <div className="hidden items-center gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[1.1fr_1.1fr_1fr_90px_100px_100px]">
              <span>Student</span>
              <span>Course</span>
              <span>Reference</span>
              <span>Method</span>
              <span>Amount</span>
              <span>Status</span>
            </div>

            <div className="divide-y divide-border">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  id={`payment-${payment.id}`}
                  className="flex flex-col gap-3 px-5 py-4 md:grid md:grid-cols-[1.1fr_1.1fr_1fr_90px_100px_100px] md:items-center md:gap-4"
                >
                  <div className="min-w-0">
                    {payment.userId ? (
                      <Link
                        href={`/admin/students/${payment.userId}`}
                        className="text-sm font-medium underline-offset-4 hover:underline"
                      >
                        {payment.userName}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium">{payment.userName}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground md:hidden">
                      {payment.providerRef}
                    </p>
                  </div>

                  <div className="min-w-0">
                    {payment.courseSlug ? (
                      <Link
                        href={`/courses/${payment.courseSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="line-clamp-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        {payment.courseTitle}
                      </Link>
                    ) : (
                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        {payment.courseTitle}
                      </p>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {payment.providerRef}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {payment.createdAt ? formatDateTime(payment.createdAt) : "Unknown time"}
                    </p>
                  </div>

                  <span className="text-xs capitalize text-muted-foreground">
                    {payment.method}
                  </span>

                  <span className="text-sm font-medium tabular-nums">
                    {formatCurrency(payment.amount, payment.currency)}
                  </span>

                  <Badge
                    variant={payment.status === "completed" ? "default" : "outline"}
                    className="w-fit uppercase"
                  >
                    {payment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <ActivityFeed
              title="Needs Attention"
              emptyText="No pending, failed, or refunded payments."
              items={attentionPayments.slice(0, 6).map((payment) => ({
                id: payment.id,
                label: `${payment.userName} · ${formatCurrency(payment.amount, payment.currency)}`,
                description: `${payment.courseTitle} · ${payment.providerRef}`,
                badge: payment.status,
                timestamp: payment.createdAt ? formatRelativeTime(payment.createdAt) : undefined,
                href: `#payment-${payment.id}`,
              }))}
            />

            <ActivityFeed
              title="Recent Successful Payments"
              emptyText="No completed payments yet."
              items={completedPayments.slice(0, 6).map((payment) => ({
                id: payment.id,
                label: `${payment.userName} paid ${formatCurrency(payment.amount, payment.currency)}`,
                description: payment.courseTitle,
                badge: payment.method,
                timestamp: payment.createdAt ? formatRelativeTime(payment.createdAt) : undefined,
                href: `#payment-${payment.id}`,
              }))}
            />

            <section className="border border-border">
              <div className="border-b border-border px-5 py-3">
                <h2 className="text-sm font-medium">Top Grossing Courses</h2>
              </div>
              <div className="divide-y divide-border">
                {topCourseItems.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No course revenue yet.
                  </p>
                ) : (
                  topCourseItems.map((course) => (
                    <div
                      key={course.courseId || course.courseTitle}
                      className="flex items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <div className="min-w-0">
                        {course.courseSlug ? (
                          <Link
                            href={`/courses/${course.courseSlug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="line-clamp-1 text-sm underline-offset-4 hover:underline"
                          >
                            {course.courseTitle}
                          </Link>
                        ) : (
                          <p className="line-clamp-1 text-sm">{course.courseTitle}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {course.payments} completed payment{course.payments === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium tabular-nums">
                          {formatCurrency(course.revenue)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="border border-border">
              <div className="border-b border-border px-5 py-3">
                <h2 className="text-sm font-medium">Status Breakdown</h2>
              </div>
              <div className="divide-y divide-border">
                {[
                  {
                    label: "Completed",
                    count: completedPayments.length,
                    icon: CheckCircle2,
                    value: formatCurrency(totalRevenue),
                  },
                  {
                    label: "Pending",
                    count: pendingPayments.length,
                    icon: Clock,
                    value: `${pendingPayments.length} records`,
                  },
                  {
                    label: "Failed",
                    count: failedPayments.length,
                    icon: AlertTriangle,
                    value: `${failedPayments.length} records`,
                  },
                  {
                    label: "Refunded",
                    count: refundedPayments.length,
                    icon: Receipt,
                    value: `${refundedPayments.length} records`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 px-5 py-3.5"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <item.icon className="size-4 text-muted-foreground" />
                      {item.label}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums">{item.count}</p>
                      <p className="text-[10px] text-muted-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
