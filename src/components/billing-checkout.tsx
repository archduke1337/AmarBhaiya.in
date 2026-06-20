"use client";

import { useState, useEffect } from "react";
import { Loader2, Tag, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RazorpayCheckout } from "@/components/razorpay-checkout";
import { validateCouponAction } from "@/actions/coupons";

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
  const [formError, setFormError] = useState("");

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

  // ── Billing form submit ────────────────────────────────────────────────

  async function handleBillingSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const phone = String(formData.get("phone") ?? "").trim();
    const parentPhone = String(formData.get("parentPhone") ?? "").trim();
    const parentName = String(formData.get("parentName") ?? "").trim();
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const state = String(formData.get("state") ?? "").trim();
    const country = String(formData.get("country") ?? "").trim();
    const zipcode = String(formData.get("zipcode") ?? "").trim();

    if (!firstName || !lastName || !parentName || !parentPhone) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (phone && parentPhone && phone === parentPhone) {
      setFormError("Student phone and parent phone cannot be the same.");
      return;
    }

    if (!addressLine1 || !city || !state || !country || !zipcode) {
      setFormError("Please fill in your billing address.");
      return;
    }

    try {
      const res = await fetch("/api/user/billing-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: phone || "",
          parentName,
          parentPhone,
          addressLine1,
          addressLine2: String(formData.get("addressLine2") ?? "").trim(),
          city,
          state,
          country,
          zipcode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save billing info");
      }

      setBilling({
        firstName,
        lastName,
        phone,
        parentName,
        parentPhone,
        addressLine1,
        addressLine2: String(formData.get("addressLine2") ?? "").trim(),
        city,
        state,
        country,
        zipcode,
      });
      setStep("payment");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save billing info");
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (step === "loading") {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Billing form ──────────────────────────────────────────────────────

  if (step === "billing") {
    return (
      <div className="rounded-2xl border border-border/40 bg-surface p-5 space-y-4">
        <div>
          <h3 className="font-heading text-sm font-black uppercase tracking-[0.12em]">
            Billing information required
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Please fill in your billing details before proceeding to payment.
          </p>
        </div>

        <form onSubmit={handleBillingSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bf-firstName">First name</Label>
              <Input id="bf-firstName" name="firstName" required placeholder="Gaurav" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-lastName">Last name</Label>
              <Input id="bf-lastName" name="lastName" required placeholder="Sharma" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-phone">
                Phone <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input id="bf-phone" name="phone" type="tel" placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-parentName">Father / Mother name</Label>
              <Input id="bf-parentName" name="parentName" required placeholder="Parent's full name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-parentPhone">Parent phone number</Label>
              <Input id="bf-parentPhone" name="parentPhone" type="tel" required placeholder="+91 98765 43210" />
            </div>
          </div>

          <div className="border-t border-border/40 pt-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Billing address
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="bf-addr1">Address line 1</Label>
                <Input id="bf-addr1" name="addressLine1" required placeholder="House/Flat No., Street" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="bf-addr2">Address line 2 <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="bf-addr2" name="addressLine2" placeholder="Apartment, landmark" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bf-city">City</Label>
                <Input id="bf-city" name="city" required placeholder="Mumbai" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bf-state">State</Label>
                <Input id="bf-state" name="state" required placeholder="Maharashtra" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bf-country">Country</Label>
                <Input id="bf-country" name="country" required placeholder="India" defaultValue="India" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bf-zipcode">PIN code</Label>
                <Input id="bf-zipcode" name="zipcode" required placeholder="400001" />
              </div>
            </div>
          </div>

          {formError && (
            <p className="rounded-lg border-2 border-destructive bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
              {formError}
            </p>
          )}

          <Button type="submit" variant="secondary" size="lg" className="w-full sm:w-auto">
            Save & Continue to Payment
          </Button>
        </form>
      </div>
    );
  }

  // ── Payment step ──────────────────────────────────────────────────────

  const finalPrice = couponStatus === "valid" ? Math.max(priceInr - couponDiscount, 0) : priceInr;

  return (
    <div className="space-y-4">
      {billing && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Billing info saved — {billing.firstName} {billing.lastName}, {billing.city}
          </p>
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
