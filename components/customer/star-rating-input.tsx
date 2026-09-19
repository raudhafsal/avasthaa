"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export function StarRatingInput({ name, label }: { name: string; label: string }) {
  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(0);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setValue(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className="p-0.5"
          >
            <Star
              size={28}
              className={(hover || value) >= n ? "fill-lagoon-500 text-lagoon-500" : "text-ink-300"}
            />
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
