import { createClient } from "@/lib/supabase/server";

export interface BusinessCategory {
  id: string;
  name: string;
  name_dhivehi: string;
  icon: string | null;
}

export interface BusinessCard {
  id: string;
  name: string;
  name_dhivehi: string | null;
  business_type: string;
  logo_url: string | null;
  cover_image_url: string | null;
  delivery_fee: number;
  minimum_order: number;
  estimated_prep_minutes: number;
  is_open: boolean;
  is_featured: boolean;
  rating_average: number;
  rating_count: number;
}

export async function getCategories(): Promise<BusinessCategory[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("business_categories")
    .select("id, name, name_dhivehi, icon")
    .eq("active", true)
    .order("sort_order");
  return data ?? [];
}

/**
 * Approved businesses visible to a customer, optionally scoped to an
 * island and/or a business_type, and optionally restricted to
 * restaurants (`kind: "restaurant"`) or shops (`kind: "shop"`).
 */
export async function getBusinesses(options: {
  islandId?: string | null;
  categoryId?: string | null;
  kind?: "restaurant" | "shop";
  openNow?: boolean;
  sort?: "rating" | "delivery_fee" | "featured";
  limit?: number;
}): Promise<BusinessCard[]> {
  const supabase = createClient();
  let query = supabase
    .from("businesses")
    .select(
      "id, name, name_dhivehi, business_type, logo_url, cover_image_url, delivery_fee, minimum_order, estimated_prep_minutes, is_open, is_featured, rating_average, rating_count",
    )
    .eq("approval_status", "approved");

  if (options.islandId) query = query.eq("island_id", options.islandId);
  if (options.categoryId) query = query.eq("category_id", options.categoryId);
  if (options.kind === "restaurant") query = query.eq("business_type", "restaurant");
  if (options.kind === "shop") query = query.neq("business_type", "restaurant");
  if (options.openNow) query = query.eq("is_open", true);

  switch (options.sort) {
    case "rating":
      query = query.order("rating_average", { ascending: false });
      break;
    case "delivery_fee":
      query = query.order("delivery_fee", { ascending: true });
      break;
    default:
      query = query.order("is_featured", { ascending: false }).order("rating_average", { ascending: false });
  }

  if (options.limit) query = query.limit(options.limit);

  const { data } = await query;
  return data ?? [];
}

export async function getBusinessById(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("businesses")
    .select(
      "id, name, name_dhivehi, description, description_dhivehi, business_type, logo_url, cover_image_url, delivery_fee, minimum_order, estimated_prep_minutes, is_open, rating_average, rating_count, island_id, address",
    )
    .eq("id", id)
    .eq("approval_status", "approved")
    .single();
  return data;
}

export interface MenuItemOption {
  id: string;
  name: string;
  name_dhivehi: string | null;
  price_delta: number;
  available: boolean;
}

export interface MenuItemOptionGroup {
  id: string;
  name: string;
  name_dhivehi: string | null;
  selection_type: "single" | "multiple";
  is_required: boolean;
  min_select: number;
  max_select: number | null;
  options: MenuItemOption[];
}

export async function getRestaurantMenu(businessId: string) {
  const supabase = createClient();
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("restaurant_categories")
      .select("id, name, name_dhivehi, sort_order")
      .eq("business_id", businessId)
      .order("sort_order"),
    supabase
      .from("menu_items")
      .select(
        "id, category_id, name, name_dhivehi, description, description_dhivehi, price, image_url, available, preparation_time_minutes, sort_order",
      )
      .eq("business_id", businessId)
      .order("sort_order"),
  ]);

  const itemIds = (items ?? []).map((i) => i.id);
  if (itemIds.length === 0) {
    return { categories: categories ?? [], items: [] };
  }

  const { data: groups } = await supabase
    .from("menu_item_option_groups")
    .select("id, menu_item_id, name, name_dhivehi, selection_type, is_required, min_select, max_select, sort_order")
    .in("menu_item_id", itemIds)
    .order("sort_order");

  const groupIds = (groups ?? []).map((g) => g.id);
  const { data: options } =
    groupIds.length > 0
      ? await supabase
          .from("menu_item_options")
          .select("id, option_group_id, name, name_dhivehi, price_delta, available, sort_order")
          .in("option_group_id", groupIds)
          .order("sort_order")
      : { data: [] as (MenuItemOption & { option_group_id: string })[] };

  const groupsByItem = new Map<string, MenuItemOptionGroup[]>();
  for (const group of groups ?? []) {
    const groupOptions = (options ?? []).filter((o) => o.option_group_id === group.id);
    const list = groupsByItem.get(group.menu_item_id) ?? [];
    list.push({ ...group, options: groupOptions });
    groupsByItem.set(group.menu_item_id, list);
  }

  const itemsWithOptions = (items ?? []).map((item) => ({
    ...item,
    optionGroups: groupsByItem.get(item.id) ?? [],
  }));

  return { categories: categories ?? [], items: itemsWithOptions };
}

export async function getShopProducts(businessId: string) {
  const supabase = createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("product_categories")
      .select("id, name, name_dhivehi, sort_order")
      .eq("business_id", businessId)
      .order("sort_order"),
    supabase
      .from("products")
      .select(
        "id, category_id, name, name_dhivehi, description, price, sale_price, image_url, stock_quantity, low_stock_threshold, is_featured, available",
      )
      .eq("business_id", businessId)
      .order("name"),
  ]);
  return { categories: categories ?? [], products: products ?? [] };
}
