import { getCoupons } from "@/lib/services/admin";
import { CreateCouponForm, CouponActiveToggle } from "@/components/admin/coupon-forms";

export default async function AdminCouponsPage() {
  const coupons = await getCoupons();

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <h1 className="text-xl font-bold text-ink-900">Coupons</h1>
      <CreateCouponForm />
      <div className="flex flex-col gap-3">
        {coupons.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 rounded-card bg-white p-4 shadow-card">
            <div>
              <p className="ltr-number font-semibold text-ink-900">{c.code}</p>
              <p className="text-sm text-ink-500">
                {c.discount_type === "percentage" ? `${c.discount_value}%` : `MVR ${c.discount_value}`} off · min MVR{" "}
                {c.minimum_order} · expires {new Date(c.expires_at).toLocaleDateString()}
              </p>
            </div>
            <CouponActiveToggle couponId={c.id} active={c.active} />
          </div>
        ))}
        {coupons.length === 0 && <p className="mt-8 text-center text-ink-500">No coupons yet.</p>}
      </div>
    </div>
  );
}
