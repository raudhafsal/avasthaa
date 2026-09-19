"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavoriteBusiness } from "@/lib/actions/favorites";
import { clsx } from "clsx";

export function FavoriteButton({ businessId, initiallyFavorited }: { businessId: string; initiallyFavorited: boolean }) {
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      onClick={() => {
        const next = !favorited;
        setFavorited(next);
        startTransition(() => toggleFavoriteBusiness(businessId, favorited));
      }}
      className="flex h-touch w-touch items-center justify-center rounded-full bg-white/90 shadow-card disabled:opacity-60"
    >
      <Heart
        size={20}
        className={clsx(favorited ? "fill-coral-500 text-coral-500" : "text-ink-500")}
      />
    </button>
  );
}
