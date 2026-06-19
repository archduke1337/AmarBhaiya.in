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
import { formatCurrency } from "@/lib/utils/format";
import {
  EmptyState,
  PageHeader,
  StatCard,
  StatGrid,
} from "@/components/dashboard";
import { PaymentsManager } from "./payments-manager";

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
        description={`${payments.length} total transaction records across all courses and users. Use this view to spot pending confirmations, failed payments, refunds, and course revenue health.`}
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
          <PaymentsManager
            payments={payments}
            completedPayments={completedPayments}
            pendingPayments={pendingPayments}
            failedPayments={failedPayments}
            refundedPayments={refundedPayments}
            totalRevenue={totalRevenue}
            monthlyRevenue={monthlyRevenue}
            topCourseItems={topCourseItems}
            attentionPayments={attentionPayments}
            statusBreakdown={[
              { label: "Completed", count: completedPayments.length, icon: CheckCircle2, value: formatCurrency(totalRevenue) },
              { label: "Pending", count: pendingPayments.length, icon: Clock, value: `${pendingPayments.length} records` },
              { label: "Failed", count: failedPayments.length, icon: AlertTriangle, value: `${failedPayments.length} records` },
              { label: "Refunded", count: refundedPayments.length, icon: Receipt, value: `${refundedPayments.length} records` },
            ]}
          />
        </div>
      )}
    </div>
  );
}
