"use client";

import { useTransition } from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { updateCartItemQuantity, removeCartItem } from "@/lib/actions/cart";

export function CartLineControls({
  cartItemId,
  quantity,
  removeLabel,
}: {
  cartItemId: string;
  quantity: number;
  removeLabel: string;
}) {
  const [isPending, startTransition] = useTransition();

  function changeBy(delta: number) {
    startTransition(() => {
      updateCartItemQuantity(cartItemId, quantity + delta);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => changeBy(-1)}
        aria-label="Decrease quantity"
        className="flex h-touch w-touch items-center justify-center rounded-full bg-sand-200 disabled:opacity-50"
      >
        <Minus size={16} />
      </button>
      <span className="ltr-number w-5 text-center font-semibold">{quantity}</span>
      <button
        type="button"
        disabled={isPending}
        onClick={() => changeBy(1)}
        aria-label="Increase quantity"
        className="flex h-touch w-touch items-center justify-center rounded-full bg-sand-200 disabled:opacity-50"
      >
        <Plus size={16} />
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => removeCartItem(cartItemId))}
        aria-label={removeLabel}
        className="flex h-touch w-touch items-center justify-center rounded-full text-coral-500 disabled:opacity-50"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
