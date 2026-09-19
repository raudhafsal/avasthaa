"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface MenuActionState {
  error?: string;
}

async function assertIsStaff() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "staff" && profile?.role !== "administrator" && profile?.role !== "super_administrator") {
    throw new Error("Not authorized");
  }
}

export async function addMenuCategory(_prev: MenuActionState, formData: FormData): Promise<MenuActionState> {
  const businessId = String(formData.get("businessId"));
  const name = String(formData.get("name") ?? "").trim();
  const nameDhivehi = (formData.get("nameDhivehi") as string) || null;
  if (!name) return { error: "Category name is required." };

  try {
    await assertIsStaff();
  } catch {
    return { error: "Not authorized." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("restaurant_categories")
    .insert({ business_id: businessId, name, name_dhivehi: nameDhivehi });
  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath(`/business/businesses/${businessId}/menu`);
  return {};
}

export async function addMenuItem(_prev: MenuActionState, formData: FormData): Promise<MenuActionState> {
  const businessId = String(formData.get("businessId"));
  const categoryId = (formData.get("categoryId") as string) || null;
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const description = (formData.get("description") as string) || null;
  const imageUrl = (formData.get("imageUrl") as string) || null;
  const preparationTime = Number(formData.get("preparationTime") ?? 15);

  if (!name || Number.isNaN(price) || price < 0) {
    return { error: "Enter a valid name and price." };
  }

  try {
    await assertIsStaff();
  } catch {
    return { error: "Not authorized." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("menu_items").insert({
    business_id: businessId,
    category_id: categoryId,
    name,
    price,
    description,
    image_url: imageUrl,
    preparation_time_minutes: preparationTime,
  });
  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath(`/business/businesses/${businessId}/menu`);
  return {};
}

export async function updateMenuItem(_prev: MenuActionState, formData: FormData): Promise<MenuActionState> {
  const itemId = String(formData.get("itemId"));
  const businessId = String(formData.get("businessId"));
  const categoryId = (formData.get("categoryId") as string) || null;
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const description = (formData.get("description") as string) || null;
  const imageUrl = (formData.get("imageUrl") as string) || null;
  const preparationTime = Number(formData.get("preparationTime") ?? 15);

  if (!name || Number.isNaN(price) || price < 0) {
    return { error: "Enter a valid name and price." };
  }

  try {
    await assertIsStaff();
  } catch {
    return { error: "Not authorized." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({
      category_id: categoryId,
      name,
      price,
      description,
      image_url: imageUrl,
      preparation_time_minutes: preparationTime,
    })
    .eq("id", itemId);
  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath(`/business/businesses/${businessId}/menu`);
  redirect(`/business/businesses/${businessId}/menu`);
}

export async function toggleMenuItemAvailability(itemId: string, businessId: string, available: boolean) {
  const supabase = createClient();
  await supabase.from("menu_items").update({ available }).eq("id", itemId);
  revalidatePath(`/business/businesses/${businessId}/menu`);
}

export async function deleteMenuItem(itemId: string, businessId: string) {
  const supabase = createClient();
  await supabase.from("menu_items").delete().eq("id", itemId);
  revalidatePath(`/business/businesses/${businessId}/menu`);
}
