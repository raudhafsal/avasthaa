"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toggleProductAvailability, deleteProduct } from "@/lib/actions/products";
import { clsx } from "clsx";

export function ProductRow({
  product,
  businessId,
}: {
  product: { id: string; name: string; price: number; sale_price: number | null; stock_quantity: number; available: boolean };
  businessId: string;
}) {
  const [available, setAvailable] = useState(product.available);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-3 rounded-card bg-white p-3 shadow-card">
      <Link href={`/business/businesses/${businessId}/products/${product.id}/edit`} className="flex-1">
        <p className="font-medium text-ink-900">{product.name}</p>
        <p className="ltr-number text-sm text-ink-500">
          MVR {(product.sale_price ?? product.price).toFixed(2)}
          {product.sale_price && <span className="ml-1 line-through">MVR {product.price.toFixed(2)}</span>}
        </p>
        <p className="text-xs text-ink-500">
          {product.stock_quantity <= 0 ? "Out of stock" : `${product.stock_quantity} in stock`}
        </p>
      </Link>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          const next = !available;
          setAvailable(next);
          startTransition(() => toggleProductAvailability(product.id, businessId, next));
        }}
        role="switch"
        aria-checked={available}
        aria-label="Available"
        className={clsx(
          "flex h-touch items-center rounded-pill px-3 text-xs font-semibold",
          available ? "bg-lagoon-500 text-white" : "bg-ink-300 text-white",
        )}
      >
        {available ? "Available" : "Unavailable"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => deleteProduct(product.id, businessId))}
        aria-label="Delete product"
        className="flex h-touch w-touch items-center justify-center rounded-full text-coral-500"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
