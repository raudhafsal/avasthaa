"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import Image from "next/image";
import { Plus, Minus } from "lucide-react";
import { addMenuItemToCart } from "@/lib/actions/cart";
import type { MenuItemOptionGroup } from "@/lib/services/catalog";
import type { Locale } from "@/lib/i18n/dictionaries";
import { t } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";

interface MenuItem {
  id: string;
  name: string;
  name_dhivehi: string | null;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  optionGroups: MenuItemOptionGroup[];
}

export function MenuItemCard({
  item,
  businessId,
  locale,
}: {
  item: MenuItem;
  businessId: string;
  locale: Locale;
}) {
  const strings = t(locale);
  const hasOptions = item.optionGroups.length > 0;
  const [expanded, setExpanded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [state, formAction] = useFormState(addMenuItemToCart, {});

  const name = locale === "dv" && item.name_dhivehi ? item.name_dhivehi : item.name;

  const selectedOptions = useMemo(() => {
    const out: { option_id: string; name: string; price_delta: number }[] = [];
    for (const group of item.optionGroups) {
      for (const optionId of selected[group.id] ?? []) {
        const option = group.options.find((o) => o.id === optionId);
        if (option) out.push({ option_id: option.id, name: option.name, price_delta: option.price_delta });
      }
    }
    return out;
  }, [selected, item.optionGroups]);

  const optionsTotal = selectedOptions.reduce((sum, o) => sum + o.price_delta, 0);
  const unitPrice = item.price + optionsTotal;

  function toggleOption(group: MenuItemOptionGroup, optionId: string) {
    setSelected((prev) => {
      const current = prev[group.id] ?? [];
      if (group.selection_type === "single") {
        return { ...prev, [group.id]: [optionId] };
      }
      const exists = current.includes(optionId);
      if (exists) return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
      if (group.max_select && current.length >= group.max_select) return prev;
      return { ...prev, [group.id]: [...current, optionId] };
    });
  }

  const requiredSatisfied = item.optionGroups
    .filter((g) => g.is_required)
    .every((g) => (selected[g.id] ?? []).length >= Math.max(1, g.min_select));

  if (!item.available) return null;

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-card bg-white p-3 shadow-card">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="menuItemId" value={item.id} />
      <input type="hidden" name="quantity" value={quantity} />
      <input type="hidden" name="unitPrice" value={unitPrice} />
      <input type="hidden" name="selectedOptions" value={JSON.stringify(selectedOptions)} />

      <div className="flex gap-3">
        {item.image_url && (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-sand-200">
            <Image src={item.image_url} alt="" fill className="object-cover" sizes="80px" />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-0.5">
          <p className="font-semibold text-ink-900">{name}</p>
          {item.description && <p className="line-clamp-2 text-sm text-ink-500">{item.description}</p>}
          <p className="ltr-number mt-1 font-semibold text-ocean-900">
            {strings.common.currency} {item.price.toFixed(2)}
          </p>
        </div>

        {hasOptions ? (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            className="h-touch w-touch shrink-0 self-start rounded-full bg-lagoon-500 text-white hover:bg-lagoon-600"
          >
            <Plus size={20} className="mx-auto" />
          </button>
        ) : (
          <Button type="submit" fullWidth={false} className="h-touch w-touch shrink-0 self-start !p-0">
            <Plus size={20} />
          </Button>
        )}
      </div>

      {hasOptions && expanded && (
        <div className="flex flex-col gap-4 border-t border-sand-200 pt-3">
          {item.optionGroups.map((group) => (
            <fieldset key={group.id} className="flex flex-col gap-2">
              <legend className="text-sm font-semibold text-ink-700">
                {locale === "dv" && group.name_dhivehi ? group.name_dhivehi : group.name}
                {group.is_required && <span className="text-coral-500"> *</span>}
              </legend>
              {group.options.map((option) => {
                const checked = (selected[group.id] ?? []).includes(option.id);
                return (
                  <label
                    key={option.id}
                    className="flex min-h-touch items-center justify-between gap-2 rounded-2xl border border-sand-200 px-3 py-2 has-[:checked]:border-ocean-500"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type={group.selection_type === "single" ? "radio" : "checkbox"}
                        name={`group-${group.id}`}
                        checked={checked}
                        onChange={() => toggleOption(group, option.id)}
                        disabled={!option.available}
                        className="h-5 w-5"
                      />
                      <span className="text-sm text-ink-900">
                        {locale === "dv" && option.name_dhivehi ? option.name_dhivehi : option.name}
                      </span>
                    </span>
                    {option.price_delta > 0 && (
                      <span className="ltr-number text-sm text-ink-500">+{option.price_delta.toFixed(2)}</span>
                    )}
                  </label>
                );
              })}
            </fieldset>
          ))}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-touch w-touch items-center justify-center rounded-full bg-sand-200"
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span className="ltr-number w-6 text-center font-semibold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-touch w-touch items-center justify-center rounded-full bg-sand-200"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>
            <Button type="submit" fullWidth={false} disabled={!requiredSatisfied} className="px-8">
              {strings.common.currency} {(unitPrice * quantity).toFixed(2)}
            </Button>
          </div>
        </div>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-coral-600">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-lagoon-600">✓ Added to cart</p>}
    </form>
  );
}
