"use client";

import { useFormState } from "react-dom";
import { updateMenuItem } from "@/lib/actions/menu";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  category_id: string | null;
  preparation_time_minutes: number;
}

export function EditItemForm({
  item,
  businessId,
  categories,
}: {
  item: Item;
  businessId: string;
  categories: Category[];
}) {
  const [state, formAction] = useFormState(updateMenuItem, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="itemId" value={item.id} />
      <input type="hidden" name="businessId" value={businessId} />
      <TextField name="name" label="Item name" defaultValue={item.name} required />
      <TextField name="price" type="number" step="0.01" min="0" label="Price (MVR)" defaultValue={item.price} required />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoryId" className="text-sm font-medium text-ink-700">
          Category
        </label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={item.category_id ?? ""}
          className="min-h-touch rounded-2xl border border-sand-200 bg-white px-4 py-3 text-base"
        >
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <TextField name="description" label="Description" defaultValue={item.description ?? ""} />
      <TextField name="imageUrl" label="Image URL" defaultValue={item.image_url ?? ""} />
      <TextField
        name="preparationTime"
        type="number"
        min="1"
        label="Prep time (minutes)"
        defaultValue={item.preparation_time_minutes}
      />
      {state.error && <p className="text-sm text-coral-600">{state.error}</p>}
      <Button type="submit">Save changes</Button>
    </form>
  );
}
