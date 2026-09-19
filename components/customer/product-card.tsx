"use client";

import { useFormState } from "react-dom";
import Image from "next/image";
import { addProductToCart } from "@/lib/actions/cart";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  name_dhivehi: string | null;
  price: number;
  sale_price: number | null;
  image_url: string | null;
  stock_quantity: number;
  available: boolean;
}

export function ProductCard({
  product,
  businessId,
  locale,
}: {
  product: Product;
  businessId: string;
  locale: "en" | "dv";
}) {
  const [state, formAction] = useFormState(addProductToCart, {});
  const name = locale === "dv" && product.name_dhivehi ? product.name_dhivehi : product.name;
  const effectivePrice = product.sale_price ?? product.price;
  const outOfStock = product.stock_quantity <= 0 || !product.available;

  if (!product.available) return null;

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-card bg-white p-3 shadow-card">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="quantity" value={1} />
      <input type="hidden" name="unitPrice" value={effectivePrice} />

      {product.image_url && (
        <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-sand-200">
          <Image src={product.image_url} alt="" fill className="object-cover" sizes="200px" />
        </div>
      )}
      <p className="font-medium text-ink-900">{name}</p>
      <div className="flex items-center gap-2">
        <span className="ltr-number font-semibold text-ocean-900">MVR {effectivePrice.toFixed(2)}</span>
        {product.sale_price && (
          <span className="ltr-number text-sm text-ink-300 line-through">MVR {product.price.toFixed(2)}</span>
        )}
      </div>
      {outOfStock ? (
        <span className="text-sm font-medium text-coral-600">Out of stock</span>
      ) : (
        <Button type="submit" fullWidth={false} className="self-start px-4">
          Add
        </Button>
      )}
      {state.success && <span className="text-xs text-lagoon-600">✓ Added</span>}
      {state.error && <span className="text-xs text-coral-600">{state.error}</span>}
    </form>
  );
}
