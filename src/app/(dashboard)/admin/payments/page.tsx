import { getAdminPayments } from "@/lib/appwrite/dashboard-data";
import { formatCurrency } from "@/lib/utils/format";

export default async function AdminPaymentsPage() {
  const payments = await getAdminPayments();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Payments</p>
        <h1 className="text-3xl mt-2">Transactions and Revenue</h1>
      </div>

      <section className="space-y-3">
        {payments.length === 0 ? (
          <article className="border border-border p-5 text-sm text-muted-foreground">
            No payment records found.
          </article>
        ) : null}

        {payments.map((payment) => (
          <article key={payment.id} className="border border-border p-5">
            <h2 className="text-lg">{payment.providerRef}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {payment.method} - {formatCurrency(payment.amount, payment.currency)} - {payment.status}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              User: {payment.userName} · Course: {payment.courseTitle}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
