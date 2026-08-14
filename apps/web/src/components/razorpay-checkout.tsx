"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type RazorpayCheckoutProps = {
  courseId: string;
  courseTitle: string;
  priceInr: number;
  userName: string;
  userEmail: string;
  couponCode?: string;
  originalPrice?: number;
};

type RazorpayPaymentSuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: () => void) => void;
    };
  }
}

export function RazorpayCheckout({
  courseId,
  courseTitle,
  priceInr,
  userName,
  userEmail,
  couponCode,
  originalPrice,
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    setLoading(true);
    setError("");

    try {
      // 1. Create Razorpay order via our API
      const body: Record<string, unknown> = {
        courseId,
        currency: "INR",
      };
      if (couponCode) {
        body.couponCode = couponCode;
      }

      const res = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create order");
      }

      const { keyId, orderId, amount, currency, couponApplied } = await res.json();

      // 2. Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.head.appendChild(script);
        });
      }

      // 3. Open Razorpay checkout modal
      const description = couponApplied
        ? `${courseTitle} (₹${(amount / 100).toFixed(0)})`
        : courseTitle;

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: "AmarBhaiya",
        description,
        order_id: orderId,
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: "#000000",
        },
        handler: async function (response: RazorpayPaymentSuccessResponse) {
          try {
            const verifyBody: Record<string, unknown> = {
              courseId,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            };
            if (couponCode) {
              verifyBody.couponCode = couponCode;
            }

            const verifyResponse = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(verifyBody),
            });

            const verifyData = await verifyResponse.json().catch(() => null);
            if (!verifyResponse.ok) {
              throw new Error(verifyData?.error || "Payment verification failed.");
            }

            const nextCourseId =
              typeof verifyData?.courseId === "string" && verifyData.courseId.length > 0
                ? verifyData.courseId
                : courseId;

            window.location.href = `/app/courses/${nextCourseId}?payment=success`;
          } catch (verifyError) {
            setError(
              verifyError instanceof Error
                ? verifyError.message
                : "Payment completed, but we could not finalize enrollment."
            );
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      });

      rzp.on("payment.failed", function () {
        setError("Payment failed. Please try again.");
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const hasDiscount = typeof originalPrice === "number" && originalPrice > priceInr;

  return (
    <div className="space-y-3">
      {hasDiscount && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            ₹{originalPrice - priceInr} discount applied
          </p>
        </div>
      )}
      <Button
        onClick={handleCheckout}
        disabled={loading}
        size="lg"
        variant="secondary"
        type="button"
      >
        {loading ? "Processing…" : `Enroll — ₹${priceInr}`}
      </Button>
      {error && (
        <p className="rounded-[calc(var(--radius)+4px)] border-2 border-destructive bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
