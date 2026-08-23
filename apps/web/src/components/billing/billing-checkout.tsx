"use client";

import { useState, useEffect } from "react";
import { Loader2, Tag, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RazorpayCheckout } from "@/components/billing/razorpay-checkout";
import { validateCouponAction } from "@/server/actions/coupons";

type BillingInfo = {
  firstName: string;
  lastName: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
};

type BillingCheckoutProps = {
  courseId: string;
  courseTitle: string;
  priceInr: number;
  userName: string;
  userEmail: string;
};

export function BillingCheckout({
  courseId,
  courseTitle,
  priceInr,
  userName,
  userEmail,
}: BillingCheckoutProps) {
  const [step, setStep] = useState<"loading" | "billing" | "payment">("loading");
  const [billing, setBilling] = useState<BillingInfo | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");

  useEffect(() => {
    fetch("/api/user/billing-info")
      .then((res) => res.json())
      .then((data) => {
        if (data.hasBillingInfo) {
          setBilling(data.billing);
          setStep("payment");
        } else {
          setStep("billing");
        }
      })
      .catch(() => setStep("billing"));
  }, []);

  // ── Coupon validation ─────────────────────────────────────────────────

  async function handleApplyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    setCouponStatus("validating");
    setCouponMessage("");

    try {
      const result = await validateCouponAction(code, courseId);
      if (result.valid) {
        setCouponStatus("valid");
        setCouponDiscount(result.discountAmount ?? 0);
        setCouponMessage(result.message);
      } else {
        setCouponStatus("invalid");
        setCouponDiscount(0);
        setCouponMessage(result.message);
      }
    } catch {
      setCouponStatus("invalid");
      setCouponMessage("Failed to validate coupon.");
    }
  }

  function handleRemoveCoupon() {
    setCouponCode("");
    setCouponStatus("idle");
    setCouponDiscount(0);
    setCouponMessage("");
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (step === "loading") {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Billing required — use profile, no inline form
  if (step === "billing") {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-4 text-center">
        <h3 className="font-heading text-sm font-black uppercase tracking-[0.12em] text-amber-700 dark:text-amber-400">
          Billing address needed
        </h3>
        <p className="text-sm font-medium leading-6 text-foreground/70 max-w-md mx-auto">
          We reuse the billing address saved in your <span className="font-bold text-foreground">profile</span>. Add it once there — checkout will automatically use it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="lg" className="font-bold">
            <a href="/app/profile/edit#billing">Complete in profile</a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="/app/profile/edit#billing">Go to profile</a>
          </Button>
        </div>
        <p className="text-[11px] font-medium text-muted-foreground">
          Already filled in profile? <button type="button" onClick={() => window.location.reload()} className="font-bold text-accent hover:underline">Refresh</button> to continue.
        </p>
      </div>
    );
  }

  // ── Payment step ──────────────────────────────────────────────────────

  const finalPrice = couponStatus === "valid" ? Math.max(priceInr - couponDiscount, 0) : priceInr;

  return (
    <div className="space-y-4">
      {billing && (
        <div className="rounded-xl border border-border/40 bg-surface p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Deliver to & bill to — from profile</p>
            <p className="text-sm font-semibold mt-1">
              {billing.firstName} {billing.lastName}
              {billing.addressLine1 ? `, ${billing.addressLine1}` : ""}, {billing.city}, {billing.state} {billing.zipcode}
            </p>
            <p className="text-xs text-muted-foreground">{billing.phone ? `${billing.phone} · ` : ""}{billing.country}</p>
          </div>
          <a href="/app/profile/edit#billing" className="text-xs font-bold text-accent hover:underline shrink-0">
            Change in profile
          </a>
        </div>
      )}

      {/* Coupon section */}
      <div className="rounded-2xl border border-border/40 bg-surface p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="size-3.5 text-muted-foreground" />
          <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Have a coupon?
          </h4>
        </div>

        {couponStatus === "valid" ? (
          <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <div>
                <p className="text-xs font-bold">{couponCode.toUpperCase()}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  {couponMessage} &middot; Final: ₹{finalPrice}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="text-[10px] font-semibold text-muted-foreground hover:text-foreground"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                if (couponStatus !== "idle") {
                  setCouponStatus("idle");
                  setCouponMessage("");
                }
              }}
              className="h-9 text-sm uppercase"
              disabled={couponStatus === "validating"}
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={couponStatus === "validating" || !couponCode.trim()}
              className="shrink-0 rounded-lg bg-foreground px-3.5 py-2 text-xs font-bold text-background hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {couponStatus === "validating" ? "..." : "Apply"}
            </button>
          </div>
        )}

        {couponStatus === "invalid" && couponMessage && (
          <div className="flex items-center gap-1.5 mt-2">
            <XCircle className="size-3 text-destructive" />
            <p className="text-[11px] font-medium text-destructive">{couponMessage}</p>
          </div>
        )}
      </div>

      <RazorpayCheckout
        courseId={courseId}
        courseTitle={courseTitle}
        priceInr={finalPrice}
        userName={userName}
        userEmail={userEmail}
        couponCode={couponStatus === "valid" ? couponCode.toUpperCase() : undefined}
        originalPrice={couponStatus === "valid" ? priceInr : undefined}
      />
    </div>
  );
}
