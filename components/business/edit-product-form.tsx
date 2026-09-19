"use client";

import { useFormState } from "react-dom";
import { updateProduct } from "@/lib/actions/products";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  description: string | null;
  image_url: string | null;
  sku: string | null;
  stock_quantity: number;
  category_id: string | null;
}

export function EditProductForm({
  product,
  businessId,
  categories,
}: {
  product: Product;
  businessId: string;
  categories: Category[];
}) {
  const [state, formAction] = useFormState(updateProduct, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="businessId" value={businessId} />
      <TextField name="name" label="Product name" defaultValue={product.name} required />
      <TextField name="price" type="number" step="0.01" min="0" label="Price (MVR)" defaultValue={product.price} required />
      <TextField name="salePrice" type="number" step="0.01" min="0" label="Sale price" defaultValue={product.sale_price ?? ""} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoryId" className="text-sm font-medium text-ink-700">
          Category
        </label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={product.category_id ?? ""}
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
      <TextField name="stockQuantity" type="number" min="0" label="Stock quantity" defaultValue={product.stock_quantity} />
      <TextField name="sku" label="SKU" defaultValue={product.sku ?? ""} />
      <TextField name="description" label="Description" defaultValue={product.description ?? ""} />
      <TextField name="imageUrl" label="Image URL" defaultValue={product.image_url ?? ""} />
      {state.error && <p className="text-sm text-coral-600">{state.error}</p>}
      <Button type="submit">Save changes</Button>
    </form>
  );
}
