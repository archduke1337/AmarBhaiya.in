"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Receipt,
  Send,
  RotateCcw,
  X,
} from "lucide-react";
import {
  formatCurrency,
  formatDateTime,
} from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  updatePaymentStatusAction,
  processRefundAction,
  sendPaymentReminderAction,
} from "@/actions/admin-payments";

type Payment = {
  id: string;
  userId: string;
  providerRef: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  courseId: string;
  courseSlug: string;
  userName: string;
  courseTitle: string;
  createdAt: string | null;
};

type StatusBreakdown = {
  label: string;
  count: number;
  icon: string;
  value: string;
};

// ── Status helpers ──────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  completed: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  pending: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
  failed: "border-destructive/30 bg-destructive/5 text-destructive",
  refunded: "border-purple-500/30 bg-purple-500/5 text-purple-600 dark:text-purple-400",
};

const statusIconMap: Record<string, React.ElementType> = {
  completed: CheckCircle2,
  pending: Clock,
  failed: AlertTriangle,
  refunded: Receipt,
};

// ── Refund Dialog ───────────────────────────────────────────────────────────

function RefundDialog({
  payment,
  onClose,
  onRefunded,
}: {
  payment: Payment;
  onClose: () => void;
  onRefunded: (paymentId: string) => void;
}) {
  const [amount, setAmount] = useState(String(payment.amount));
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleRefund = async () => {
    setProcessing(true);
    setError("");
    const fd = new FormData();
    fd.set("paymentId", payment.id);
    fd.set("amount", amount);
    fd.set("reason", reason);
    const result = await processRefundAction(fd);
    setProcessing(false);
    if (result.success) {
      onRefunded(payment.id);
      onClose();
    } else {
      setError(result.error || "Refund failed. Please try again.");
    }
  };

  const isFullRefund = Number(amount) >= payment.amount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-border/40 bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="size-5 text-purple-500" />
            <h3 className="text-lg font-bold">Process Refund</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-hover transition-colors">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        <div className="rounded-xl border border-border/40 bg-surface-hover p-3 mb-4">
          <p className="text-sm font-semibold">{payment.userName}</p>
          <p className="text-xs text-muted-foreground">{payment.courseTitle}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Original: {formatCurrency(payment.amount, payment.currency)} · {payment.providerRef}
          </p>
        </div>

        <div className="space-y-3">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Refund Amount (₹)</span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0}
              max={payment.amount}
              step={1}
              className="h-9 text-sm"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAmount(String(payment.amount))}
                className="text-[10px] font-semibold text-accent hover:underline"
              >
                Full refund ({formatCurrency(payment.amount)})
              </button>
              {payment.amount > 100 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(Math.round(payment.amount / 2)))}
                  className="text-[10px] font-semibold text-accent hover:underline"
                >
                  50% refund
                </button>
              )}
            </div>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Reason (optional)</span>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer request, duplicate charge..."
              className="h-9 text-sm"
            />
          </label>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-xs font-semibold text-destructive">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-2 mt-5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRefund}
            disabled={processing || !amount || Number(amount) <= 0}
          >
            {processing ? "Processing..." : isFullRefund ? "Refund Full Amount" : `Refund ₹${amount}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Payment row component ───────────────────────────────────────────────────

function PaymentRow({
  payment,
  onStatusUpdate,
  onRefund,
  onSendReminder,
}: {
  payment: Payment;
  onStatusUpdate: (paymentId: string, newStatus: string) => void;
  onRefund: (payment: Payment) => void;
  onSendReminder: (paymentId: string) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);

  const allowedTransitions: Record<string, string[]> = {
    pending: ["completed", "failed"],
    completed: ["refunded"],
    failed: ["pending"],
    refunded: [],
  };

  const transitions = allowedTransitions[payment.status] ?? [];

  return (
    <div
      id={`payment-${payment.id}`}
      className="flex scroll-mt-24 flex-col gap-3 px-5 py-4 transition-colors hover:bg-accent/30 md:grid md:grid-cols-[1.1fr_1.1fr_1fr_90px_100px_100px] md:items-center md:gap-4"
    >
      <div className="min-w-0">
        {payment.userId ? (
          <Link
            href={`/admin/students/${payment.userId}`}
            className="text-sm font-semibold underline-offset-4 hover:underline"
          >
            {payment.userName}
          </Link>
        ) : (
          <p className="text-sm font-semibold">{payment.userName}</p>
        )}
        <p className="text-[10px] font-semibold text-muted-foreground md:hidden">
          {payment.providerRef}
        </p>
      </div>

      <div className="min-w-0">
        {payment.courseSlug ? (
          <Link
            href={`/courses/${payment.courseSlug}`}
            target="_blank"
            rel="noreferrer"
            className="line-clamp-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {payment.courseTitle}
          </Link>
        ) : (
          <p className="line-clamp-1 text-sm font-medium text-muted-foreground">
            {payment.courseTitle}
          </p>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate font-mono text-xs font-semibold text-muted-foreground">
          {payment.providerRef}
        </p>
        <p className="text-[10px] font-semibold text-muted-foreground">
          {payment.createdAt ? formatDateTime(payment.createdAt) : "Unknown time"}
        </p>
      </div>

      <span className="text-xs font-semibold capitalize text-muted-foreground">
        {payment.method}
      </span>

      <span className="text-sm font-semibold tabular-nums">
        {formatCurrency(payment.amount, payment.currency)}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowControls(!showControls)}
          className="relative"
        >
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${statusColors[payment.status] || "border-border text-muted-foreground"}`}
          >
            {payment.status}
          </span>
        </button>

        {/* Quick refund button for completed payments */}
        {payment.status === "completed" && transitions.includes("refunded") && (
          <button
            type="button"
            onClick={() => onRefund(payment)}
            className="text-[10px] font-semibold text-purple-500 hover:underline underline-offset-2"
            title="Process refund via Razorpay"
          >
            <RotateCcw className="size-3 inline mr-0.5" />
            Refund
          </button>
        )}

        {/* Send reminder for pending/failed payments */}
        {(payment.status === "pending" || payment.status === "failed") && (
          <button
            type="button"
            onClick={async () => {
              const fd = new FormData();
              fd.set("paymentId", payment.id);
              await sendPaymentReminderAction(fd);
              setReminderSent(true);
            }}
            disabled={reminderSent}
            className="text-[10px] font-semibold text-amber-500 hover:underline underline-offset-2 disabled:opacity-50 disabled:no-underline"
            title="Send payment reminder notification"
          >
            <Send className="size-3 inline mr-0.5" />
            {reminderSent ? "Sent ✓" : "Remind"}
          </button>
        )}
      </div>

      {showControls && (
        <div className="col-span-full flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Change status:
          </span>
          {transitions.length > 0 ? (
            transitions.map((status) => (
              <button
                key={status}
                type="button"
                onClick={async () => {
                  setUpdating(true);
                  const fd = new FormData();
                  fd.set("paymentId", payment.id);
                  fd.set("status", status);
                  await updatePaymentStatusAction(fd);
                  onStatusUpdate(payment.id, status);
                  setUpdating(false);
                  setShowControls(false);
                }}
                disabled={updating}
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors disabled:opacity-50 ${statusColors[status] || "border-border text-muted-foreground"} hover:opacity-80`}
              >
                {status}
              </button>
            ))
          ) : (
            <span className="text-[10px] text-muted-foreground">No transitions available</span>
          )}
          <button
            type="button"
            onClick={() => setShowControls(false)}
            className="text-[10px] text-muted-foreground hover:text-foreground ml-auto"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// ── Payments Manager (client wrapper) ────────────────────────────────────────

export function PaymentsManager({
  payments,
  completedPayments,
  pendingPayments,
  failedPayments,
  refundedPayments,
  totalRevenue,
  monthlyRevenue,
  topCourseItems,
  attentionPayments,
  statusBreakdown,
}: {
  payments: Payment[];
  completedPayments: Payment[];
  pendingPayments: Payment[];
  failedPayments: Payment[];
  refundedPayments: Payment[];
  totalRevenue: number;
  monthlyRevenue: number;
  topCourseItems: Array<{
    courseId: string;
    courseSlug: string;
    courseTitle: string;
    revenue: number;
    payments: number;
  }>;
  attentionPayments: Payment[];
  statusBreakdown: StatusBreakdown[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);

  const filteredPayments = useMemo(() => {
    let result = payments;
    if (statusFilter) {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.userName.toLowerCase().includes(q) ||
          p.courseTitle.toLowerCase().includes(q) ||
          p.providerRef.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
      );
    }
    return result;
  }, [payments, searchQuery, statusFilter]);

  const [localPayments, setLocalPayments] = useState(payments);

  useEffect(() => {
    setLocalPayments(payments);
  }, [payments]);

  const handleStatusUpdate = (paymentId: string, newStatus: string) => {
    setLocalPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: newStatus } : p))
    );
  };

  const handleRefunded = (paymentId: string) => {
    setLocalPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: "refunded" } : p))
    );
  };

  const localCompleted = localPayments.filter((p) => p.status === "completed");
  const localPending = localPayments.filter((p) => p.status === "pending");
  const localFailed = localPayments.filter((p) => p.status === "failed");
  const localRefunded = localPayments.filter((p) => p.status === "refunded");
  const localAttention = localPayments.filter(
    (p) => p.status === "pending" || p.status === "failed" || p.status === "refunded"
  );

  const displayPayments = statusFilter || searchQuery
    ? filteredPayments
    : localPayments;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by student, course, or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Status:
          </span>
          {[
            { label: "All", key: null, count: localPayments.length },
            { label: "Completed", key: "completed", count: localCompleted.length },
            { label: "Pending", key: "pending", count: localPending.length },
            { label: "Failed", key: "failed", count: localFailed.length },
            { label: "Refunded", key: "refunded", count: localRefunded.length },
          ].map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => setStatusFilter(filter.key)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                statusFilter === filter.key
                  ? "bg-foreground text-background"
                  : "border border-border/40 text-muted-foreground hover:text-foreground hover:border-border/60"
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      <div
        id="payments-list"
        className="scroll-mt-24 overflow-hidden rounded-2xl border border-border/40 bg-surface xl:col-span-2"
      >
        <div className="flex flex-col gap-3 border-b-2 border-border bg-[color:var(--surface-secondary)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-black tracking-[-0.04em]">
              {statusFilter
                ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Payments`
                : "All Transactions"}
            </h2>
            <p className="text-xs font-semibold leading-6 text-muted-foreground">
              {searchQuery
                ? `${displayPayments.length} of ${localPayments.length} match your search`
                : `${displayPayments.length} records`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {displayPayments.length !== localPayments.length && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setStatusFilter(null); }}
                className="text-[10px] font-semibold text-accent hover:underline"
              >
                Clear filters
              </button>
            )}
            <Badge variant="outline">{displayPayments.length} records</Badge>
          </div>
        </div>

        <div className="hidden items-center gap-4 border-b-2 border-border bg-[color:var(--surface-muted)] px-5 py-3 font-heading text-xs font-black uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[1.1fr_1.1fr_1fr_90px_100px_100px]">
          <span>Student</span>
          <span>Course</span>
          <span>Reference</span>
          <span>Method</span>
          <span>Amount</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-border">
          {displayPayments.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm font-semibold text-muted-foreground">
              {searchQuery
                ? "No payments match your search criteria."
                : "No payments in this status."}
            </div>
          ) : (
            displayPayments.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                onStatusUpdate={handleStatusUpdate}
                onRefund={setRefundTarget}
                onSendReminder={() => {}}
              />
            ))
          )}
        </div>
      </div>

      <aside className="flex flex-col gap-6">
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
          <div className="border-b-2 border-border px-5 py-3">
            <h2 className="font-heading text-base font-black tracking-[-0.03em] flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              Needs Attention
            </h2>
          </div>
          {localAttention.length === 0 ? (
            <div className="px-5 py-6 text-center text-xs font-semibold text-muted-foreground">
              No pending, failed, or refunded payments.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {localAttention.slice(0, 6).map((payment) => (
                <a
                  key={payment.id}
                  href={`#payment-${payment.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{payment.userName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {formatCurrency(payment.amount, payment.currency)} · {payment.courseTitle}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColors[payment.status] || "border-border text-muted-foreground"}`}
                  >
                    {payment.status}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
          <div className="border-b-2 border-border px-5 py-3">
            <h2 className="font-heading text-base font-black tracking-[-0.03em] flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Recent Payments
            </h2>
          </div>
          {localCompleted.length === 0 ? (
            <div className="px-5 py-6 text-center text-xs font-semibold text-muted-foreground">
              No completed payments yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {localCompleted.slice(0, 6).map((payment) => (
                <a
                  key={payment.id}
                  href={`#payment-${payment.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{payment.userName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {payment.courseTitle}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(payment.amount, payment.currency)}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
          <div className="border-b-2 border-border px-5 py-3">
            <h2 className="font-heading text-base font-black tracking-[-0.03em]">
              Top Grossing Courses
            </h2>
          </div>
          <div className="divide-y divide-border">
            {topCourseItems.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm font-semibold leading-7 text-muted-foreground">
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
                        className="line-clamp-1 text-sm font-semibold underline-offset-4 hover:underline"
                      >
                        {course.courseTitle}
                      </Link>
                    ) : (
                      <p className="line-clamp-1 text-sm font-semibold">{course.courseTitle}</p>
                    )}
                    <p className="text-xs font-semibold text-muted-foreground">
                      {course.payments} completed payment{course.payments === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCurrency(course.revenue)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
          <div className="border-b-2 border-border px-5 py-3">
            <h2 className="font-heading text-base font-black tracking-[-0.03em]">
              Status Breakdown
            </h2>
          </div>
          <div className="divide-y divide-border">
            {statusBreakdown.map((item) => {
              const IconCmp = statusIconMap[item.icon] || statusIconMap.completed;
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <IconCmp className="size-4 text-muted-foreground" />
                    {item.label}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">{item.count}</p>
                    <p className="text-[10px] font-semibold text-muted-foreground">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Refund Dialog */}
      {refundTarget && (
        <RefundDialog
          payment={refundTarget}
          onClose={() => setRefundTarget(null)}
          onRefunded={handleRefunded}
        />
      )}
    </>
  );
}
