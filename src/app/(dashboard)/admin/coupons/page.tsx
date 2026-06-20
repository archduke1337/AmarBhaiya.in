import Link from "next/link";
import { Tag, Plus, Percent, IndianRupee, Calendar, CheckCircle2, XCircle } from "lucide-react";

import { requireRole } from "@/lib/appwrite/auth";
import {
  getCoupons,
  type CouponItem,
} from "@/actions/coupons";
import {
  createCouponFormAction,
  toggleCouponFormAction,
  deleteCouponFormAction,
} from "@/actions/form-wrappers";
import { getAdminCourses } from "@/lib/appwrite/dashboard-data";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminCouponsPage() {
  await requireRole(["admin", "instructor"]);
  const [coupons, courses] = await Promise.all([
    getCoupons(),
    getAdminCourses(),
  ]);

  const activeCoupons = coupons.filter((c) => c.isActive);
  const expiredCoupons = coupons.filter((c => !c.isActive));

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <PageHeader
        eyebrow="Admin · Coupons"
        title="Coupon Management"
        description={`${coupons.length} total coupon${coupons.length === 1 ? "" : "s"} · ${activeCoupons.length} active · ${expiredCoupons.length} inactive`}
      />

      {/* Create coupon form */}
      <section className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
        <div className="flex items-center gap-2 border-b border-border/40 px-5 py-3.5">
          <Tag className="size-4 text-muted-foreground" />
          <div>
            <h2 className="font-heading text-sm font-black uppercase tracking-[0.12em]">
              Create new coupon
            </h2>
            <p className="text-xs text-muted-foreground">
              Set up a discount coupon for any course — percent or fixed amount.
            </p>
          </div>
        </div>

        <form action={createCouponFormAction} className="flex flex-col gap-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="code" className="text-xs font-semibold text-muted-foreground">
                Coupon code
              </label>
              <input
                id="code"
                name="code"
                required
                placeholder="SUMMER25"
                className="input-field w-full h-9 px-3 text-sm rounded-lg border border-border/40 bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="courseId" className="text-xs font-semibold text-muted-foreground">
                Course
              </label>
              <select
                id="courseId"
                name="courseId"
                required
                className="input-field--select w-full h-9 text-sm rounded-lg border border-border/40 bg-background"
                defaultValue=""
              >
                <option value="" disabled>Select course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="type" className="text-xs font-semibold text-muted-foreground">
                Discount type
              </label>
              <select
                id="type"
                name="type"
                required
                className="input-field--select w-full h-9 text-sm rounded-lg border border-border/40 bg-background"
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="value" className="text-xs font-semibold text-muted-foreground">
                Value
              </label>
              <input
                id="value"
                name="value"
                type="number"
                required
                min="1"
                placeholder="25"
                className="input-field w-full h-9 px-3 text-sm rounded-lg border border-border/40 bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="maxUses" className="text-xs font-semibold text-muted-foreground">
                Max uses
              </label>
              <input
                id="maxUses"
                name="maxUses"
                type="number"
                required
                min="1"
                defaultValue="100"
                className="input-field w-full h-9 px-3 text-sm rounded-lg border border-border/40 bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="expiresAt" className="text-xs font-semibold text-muted-foreground">
                Expiry date <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="expiresAt"
                name="expiresAt"
                type="date"
                className="input-field w-full h-9 px-3 text-sm rounded-lg border border-border/40 bg-background"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm">
              <Plus className="size-3.5" />
              Create Coupon
            </Button>
          </div>
        </form>
      </section>

      {/* Coupon list */}
      {coupons.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No coupons yet"
          description="Create your first coupon to offer discounts on courses."
        />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
            <div>
              <h2 className="font-heading text-sm font-black uppercase tracking-[0.12em]">
                All Coupons
              </h2>
              <p className="text-xs text-muted-foreground">{coupons.length} coupons</p>
            </div>
            <Badge variant="outline">{activeCoupons.length} active</Badge>
          </div>

          <div className="hidden items-center gap-3 border-b border-border/40 px-5 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[100px_1fr_80px_80px_100px_80px_100px_80px]">
            <span>Code</span>
            <span>Course</span>
            <span>Type</span>
            <span>Value</span>
            <span>Usage</span>
            <span>Expires</span>
            <span>Status</span>
            <span></span>
          </div>

          <div className="divide-y divide-border/40">
            {coupons.map((coupon) => (
              <CouponRow key={coupon.id} coupon={coupon} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CouponRow({ coupon }: { coupon: CouponItem }) {
  return (
    <div className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-accent/30 md:grid md:grid-cols-[100px_1fr_80px_80px_100px_80px_100px_80px] md:items-center md:gap-3">
      <div>
        <code className="rounded-md border border-border/40 bg-background px-1.5 py-0.5 font-mono text-xs font-bold">
          {coupon.code}
        </code>
      </div>

      <div className="min-w-0">
        {coupon.courseId ? (
          <Link
            href={`/courses/${coupon.courseId}`}
            target="_blank"
            className="line-clamp-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {coupon.courseTitle}
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">{coupon.courseTitle}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {coupon.type === "percent" ? (
          <Percent className="size-3 text-muted-foreground" />
        ) : (
          <IndianRupee className="size-3 text-muted-foreground" />
        )}
        <span className="text-xs font-semibold">{coupon.type === "percent" ? "Percent" : "Fixed"}</span>
      </div>

      <span className="text-sm font-semibold tabular-nums">
        {coupon.type === "percent" ? `${coupon.value}%` : `₹${coupon.value}`}
      </span>

      <div className="flex items-center gap-1 text-xs tabular-nums">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${Math.min((coupon.usedCount / Math.max(coupon.maxUses, 1)) * 100, 100)}%` }}
          />
        </div>
        <span className="text-muted-foreground">
          {coupon.usedCount}/{coupon.maxUses}
        </span>
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {coupon.expiresAt ? (
          <>
            <Calendar className="size-3" />
            {new Date(coupon.expiresAt).toLocaleDateString("en-IN")}
          </>
        ) : (
          <span className="text-muted-foreground/60">No expiry</span>
        )}
      </div>

      <div>
        {coupon.isActive ? (
          <Badge variant="default" className="bg-emerald-600 text-xs">Active</Badge>
        ) : (
          <Badge variant="outline" className="text-xs">Inactive</Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <form action={toggleCouponFormAction}>
          <input type="hidden" name="couponId" value={coupon.id} />
          <input type="hidden" name="isActive" value={coupon.isActive ? "false" : "true"} />
          <button
            type="submit"
            className="text-[10px] font-semibold text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            {coupon.isActive ? "Deactivate" : "Activate"}
          </button>
        </form>
        <form action={deleteCouponFormAction}>
          <input type="hidden" name="couponId" value={coupon.id} />
          <button
            type="submit"
            className="text-[10px] font-semibold text-destructive hover:underline underline-offset-2"
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}
