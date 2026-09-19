"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface ProductActionState {
  error?: string;
}

export async function addProductCategory(_prev: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const businessId = String(formData.get("businessId"));
  const name = String(formData.get("name") ?? "").trim();
  const nameDhivehi = (formData.get("nameDhivehi") as string) || null;
  if (!name) return { error: "Category name is required." };

  const supabase = createClient();
  const { error } = await supabase
    .from("product_categories")
    .insert({ business_id: businessId, name, name_dhivehi: nameDhivehi });
  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath(`/business/businesses/${businessId}/products`);
  return {};
}

export async function addProduct(_prev: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const businessId = String(formData.get("businessId"));
  const categoryId = (formData.get("categoryId") as string) || null;
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const salePrice = formData.get("salePrice") ? Number(formData.get("salePrice")) : null;
  const description = (formData.get("description") as string) || null;
  const imageUrl = (formData.get("imageUrl") as string) || null;
  const sku = (formData.get("sku") as string) || null;
  const stockQuantity = Number(formData.get("stockQuantity") ?? 0);

  if (!name || Number.isNaN(price) || price < 0) {
    return { error: "Enter a valid name and price." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("products").insert({
    business_id: businessId,
    category_id: categoryId,
    name,
    price,
    sale_price: salePrice,
    description,
    image_url: imageUrl,
    sku,
    stock_quantity: stockQuantity,
  });
  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath(`/business/businesses/${businessId}/products`);
  return {};
}

export async function updateProduct(_prev: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const productId = String(formData.get("productId"));
  const businessId = String(formData.get("businessId"));
  const categoryId = (formData.get("categoryId") as string) || null;
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const salePrice = formData.get("salePrice") ? Number(formData.get("salePrice")) : null;
  const description = (formData.get("description") as string) || null;
  const imageUrl = (formData.get("imageUrl") as string) || null;
  const sku = (formData.get("sku") as string) || null;
  const stockQuantity = Number(formData.get("stockQuantity") ?? 0);

  if (!name || Number.isNaN(price) || price < 0) {
    return { error: "Enter a valid name and price." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .update({
      category_id: categoryId,
      name,
      price,
      sale_price: salePrice,
      description,
      image_url: imageUrl,
      sku,
      stock_quantity: stockQuantity,
    })
    .eq("id", productId);
  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath(`/business/businesses/${businessId}/products`);
  redirect(`/business/businesses/${businessId}/products`);
}

export async function toggleProductAvailability(productId: string, businessId: string, available: boolean) {
  const supabase = createClient();
  await supabase.from("products").update({ available }).eq("id", productId);
  revalidatePath(`/business/businesses/${businessId}/products`);
}

export async function deleteProduct(productId: string, businessId: string) {
  const supabase = createClient();
  await supabase.from("products").delete().eq("id", productId);
  revalidatePath(`/business/businesses/${businessId}/products`);
}
