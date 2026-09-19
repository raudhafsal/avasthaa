"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { addProductCategory, addProduct } from "@/lib/actions/products";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
}

export function AddProductCategoryForm({ businessId }: { businessId: string }) {
  const [state, formAction] = useFormState(addProductCategory, {});
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-ocean-900">
        + Add category
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-card bg-white p-3 shadow-card">
      <input type="hidden" name="businessId" value={businessId} />
      <TextField name="name" label="Category name" required />
      <TextField name="nameDhivehi" label="Dhivehi name (optional)" />
      {state.error && <p className="text-sm text-coral-600">{state.error}</p>}
      <div className="flex gap-2">
        <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

export function AddProductForm({ businessId, categories }: { businessId: string; categories: Category[] }) {
  const [state, formAction] = useFormState(addProduct, {});
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-ocean-900">
        + Add product
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-card bg-white p-3 shadow-card">
      <input type="hidden" name="businessId" value={businessId} />
      <TextField name="name" label="Product name" required />
      <TextField name="price" type="number" step="0.01" min="0" label="Price (MVR)" required />
      <TextField name="salePrice" type="number" step="0.01" min="0" label="Sale price (optional)" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoryId" className="text-sm font-medium text-ink-700">
          Category
        </label>
        <select
          id="categoryId"
          name="categoryId"
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
      <TextField name="stockQuantity" type="number" min="0" label="Stock quantity" defaultValue={0} />
      <TextField name="sku" label="SKU (optional)" />
      <TextField name="description" label="Description (optional)" />
      <TextField name="imageUrl" label="Image URL (optional)" placeholder="https://…" />
      {state.error && <p className="text-sm text-coral-600">{state.error}</p>}
      <div className="flex gap-2">
        <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
