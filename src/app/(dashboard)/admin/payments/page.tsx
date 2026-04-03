import { CreditCard, TrendingUp, Clock, DollarSign } from "lucide-react";

import { getAdminPayments } from "@/lib/appwrite/dashboard-data";
import { formatCurrency } from "@/lib/utils/format";
import { PageHeader, StatGrid, StatCard, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

export default async function AdminPaymentsPage() {
  const payments = await getAdminPayments();

  const totalRevenue = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter((p) => p.status === "pending").length;
  const completedPayments = payments.filter((p) => p.status === "completed").length;

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
          description="Completed payments"
        />
        <StatCard
          label="Completed"
          value={completedPayments}
          icon={TrendingUp}
        />
        <StatCard
          label="Pending"
          value={pendingPayments}
          icon={Clock}
          description={pendingPayments > 0 ? "Awaiting confirmation" : "None"}
        />
        <StatCard
          label="Total Records"
          value={payments.length}
          icon={CreditCard}
        />
      </StatGrid>

      {payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payment records"
          description="Payments will appear here once students purchase paid or subscription courses."
        />
      ) : (
        <section
          id="payments-list"
          className="scroll-mt-24 border border-border"
        >
          {/* Table header */}
          <div className="hidden items-center gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[1fr_1fr_100px_100px_80px]">
            <span>User</span>
            <span>Course</span>
            <span>Method</span>
            <span>Amount</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-border">
            {payments.map((payment) => (
              <div
                key={payment.id}
                id={`payment-${payment.id}`}
                className="flex flex-col gap-2 px-5 py-4 md:grid md:grid-cols-[1fr_1fr_100px_100px_80px] md:items-center md:gap-4"
              >
                <div>
                  <p className="text-sm font-medium">{payment.userName}</p>
                  <p className="text-xs text-muted-foreground font-mono md:hidden">
                    {payment.providerRef}
                  </p>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-1">
                  {payment.courseTitle}
                </p>

                <span className="text-xs text-muted-foreground capitalize">
                  {payment.method}
                </span>

                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(payment.amount, payment.currency)}
                </span>

                <Badge
                  variant={payment.status === "completed" ? "default" : "outline"}
                  className="w-fit"
                >
                  {payment.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
