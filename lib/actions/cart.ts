"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CartActionState {
  error?: string;
  success?: boolean;
}

interface SelectedOption {
  option_id: string;
  name: string;
  price_delta: number;
}

async function getOrCreateCart(businessId: string, profileId: string) {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("carts")
    .select("id")
    .eq("business_id", businessId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("carts")
    .insert({ business_id: businessId, profile_id: profileId })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Could not start a cart");
  return created.id as string;
}

export async function addMenuItemToCart(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const businessId = String(formData.get("businessId"));
  const menuItemId = String(formData.get("menuItemId"));
  const quantity = Number(formData.get("quantity") ?? 1);
  const unitPrice = Number(formData.get("unitPrice"));
  const specialInstructions = (formData.get("specialInstructions") as string) || null;
  const selectedOptionsRaw = formData.get("selectedOptions");
  const selectedOptions: SelectedOption[] = selectedOptionsRaw
    ? JSON.parse(String(selectedOptionsRaw))
    : [];

  if (!businessId || !menuItemId || !quantity || Number.isNaN(unitPrice)) {
    return { error: "Something went wrong. Please try again." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to add items to your cart." };

  try {
    const cartId = await getOrCreateCart(businessId, user.id);

    // Merge into an identical existing line (same item + same options) by
    // bumping its quantity, rather than piling up duplicate rows every
    // time "Add" is tapped for something with no variations to pick.
    const { data: existingItems } = await supabase
      .from("cart_items")
      .select("id, quantity, selected_options")
      .eq("cart_id", cartId)
      .eq("menu_item_id", menuItemId);

    const optionsKey = JSON.stringify(
      [...selectedOptions].sort((a, b) => a.option_id.localeCompare(b.option_id)),
    );
    const match = (existingItems ?? []).find(
      (existing) =>
        JSON.stringify(
          [...(existing.selected_options ?? [])].sort((a: SelectedOption, b: SelectedOption) =>
            a.option_id.localeCompare(b.option_id),
          ),
        ) === optionsKey,
    );

    const { error } = match
      ? await supabase
          .from("cart_items")
          .update({ quantity: match.quantity + quantity })
          .eq("id", match.id)
      : await supabase.from("cart_items").insert({
          cart_id: cartId,
          menu_item_id: menuItemId,
          quantity,
          unit_price: unitPrice,
          selected_options: selectedOptions,
          special_instructions: specialInstructions,
        });
    if (error) return { error: "Something went wrong. Please try again." };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath("/cart");
  return { success: true };
}

export async function addProductToCart(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const businessId = String(formData.get("businessId"));
  const productId = String(formData.get("productId"));
  const quantity = Number(formData.get("quantity") ?? 1);
  const unitPrice = Number(formData.get("unitPrice"));

  if (!businessId || !productId || !quantity || Number.isNaN(unitPrice)) {
    return { error: "Something went wrong. Please try again." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to add items to your cart." };

  try {
    const cartId = await getOrCreateCart(businessId, user.id);

    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cartId)
      .eq("product_id", productId)
      .maybeSingle();

    const { error } = existing
      ? await supabase.from("cart_items").update({ quantity: existing.quantity + quantity }).eq("id", existing.id)
      : await supabase.from("cart_items").insert({
          cart_id: cartId,
          product_id: productId,
          quantity,
          unit_price: unitPrice,
        });
    if (error) return { error: "Something went wrong. Please try again." };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath("/cart");
  return { success: true };
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const supabase = createClient();
  if (quantity <= 0) {
    await supabase.from("cart_items").delete().eq("id", cartItemId);
  } else {
    await supabase.from("cart_items").update({ quantity }).eq("id", cartItemId);
  }
  revalidatePath("/cart");
}

export async function removeCartItem(cartItemId: string) {
  const supabase = createClient();
  await supabase.from("cart_items").delete().eq("id", cartItemId);
  revalidatePath("/cart");
}

export async function clearCart(cartId: string) {
  const supabase = createClient();
  await supabase.from("cart_items").delete().eq("cart_id", cartId);
  await supabase.from("carts").delete().eq("id", cartId);
  revalidatePath("/cart");
}
