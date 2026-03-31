const PAYMENTS = [
  { ref: "pay_101", method: "razorpay", amount: "INR 499", status: "completed" },
  { ref: "pay_102", method: "phonepe", amount: "INR 799", status: "pending" },
  { ref: "pay_103", method: "razorpay", amount: "INR 499", status: "refunded" },
];

export default function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Payments</p>
        <h1 className="text-3xl mt-2">Transactions and Revenue</h1>
      </div>

      <section className="space-y-3">
        {PAYMENTS.map((payment) => (
          <article key={payment.ref} className="border border-border p-5">
            <h2 className="text-lg">{payment.ref}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {payment.method} - {payment.amount} - {payment.status}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
