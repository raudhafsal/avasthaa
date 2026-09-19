/**
 * Avas Thaa — development seed script.
 *
 * Populates islands, platform-wide business categories, and a couple of
 * EXAMPLE businesses with menu/product items so the app has something to
 * browse locally. This is demo data only — the app must never depend on
 * it existing, and it should not be run against a production database
 * that already has real islands/businesses (it upserts on natural keys
 * where possible, but is not a migration and carries no safety net for
 * a live marketplace).
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL (from .env.local) and the
 * service-role key (never committed — pass it as an env var when you run
 * this, or export it in your shell first).
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Set SUPABASE_SERVICE_ROLE_KEY in your shell (never commit it) and re-run.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

// Inhabited islands of Thaa Atoll, Maldives. Dhivehi names are
// best-effort — review with a native speaker before relying on them,
// same caveat as the rest of this app's Dhivehi text.
const ISLANDS = [
  { island_name: "Veymandoo", island_name_dhivehi: "ވޭމަންޑޫ", lat: 2.2333, lng: 73.0833 },
  { island_name: "Guraidhoo", island_name_dhivehi: "ގުރައިދޫ", lat: 2.35, lng: 73.05 },
  { island_name: "Thimarafushi", island_name_dhivehi: "ތިމަރަފުށި", lat: 2.2667, lng: 73.05 },
  { island_name: "Vilufushi", island_name_dhivehi: "ވިލުފުށި", lat: 2.2833, lng: 73.05 },
  { island_name: "Omadhoo", island_name_dhivehi: "އޮމަދޫ", lat: 2.3167, lng: 72.9833 },
  { island_name: "Kibidhoo", island_name_dhivehi: "ކިބިދޫ", lat: 2.4, lng: 73.0333 },
  { island_name: "Buruni", island_name_dhivehi: "ބުރުނި", lat: 2.3, lng: 73.0 },
  { island_name: "Hirilandhoo", island_name_dhivehi: "ހިރިލަންދޫ", lat: 2.3, lng: 72.9667 },
];

const CATEGORIES = [
  { name: "Food", name_dhivehi: "ކާނާ", icon: "🍔", sort_order: 1 },
  { name: "Grocery", name_dhivehi: "ބާޒާރު", icon: "🛒", sort_order: 2 },
  { name: "Pharmacy", name_dhivehi: "ފާމަސީ", icon: "💊", sort_order: 3 },
  { name: "Shops", name_dhivehi: "ފިހާރަ", icon: "🛍️", sort_order: 4 },
  { name: "Bakery", name_dhivehi: "ބޭކަރީ", icon: "🍰", sort_order: 5 },
  { name: "Cafe", name_dhivehi: "ކެފޭ", icon: "☕", sort_order: 6 },
];

async function main() {
  console.log("Seeding islands…");
  const islandIds = {};
  for (const island of ISLANDS) {
    const { data: existing } = await supabase
      .from("islands")
      .select("id")
      .eq("island_name", island.island_name)
      .maybeSingle();
    if (existing) {
      islandIds[island.island_name] = existing.id;
      continue;
    }
    const { data, error } = await supabase
      .from("islands")
      .insert({
        island_name: island.island_name,
        island_name_dhivehi: island.island_name_dhivehi,
        latitude: island.lat,
        longitude: island.lng,
      })
      .select("id")
      .single();
    if (error) throw error;
    islandIds[island.island_name] = data.id;
  }
  console.log(`  ${Object.keys(islandIds).length} islands ready.`);

  console.log("Seeding business categories…");
  for (const category of CATEGORIES) {
    const { data: existing } = await supabase
      .from("business_categories")
      .select("id")
      .eq("name", category.name)
      .maybeSingle();
    if (!existing) {
      const { error } = await supabase.from("business_categories").insert(category);
      if (error) throw error;
    }
  }
  console.log(`  ${CATEGORIES.length} categories ready.`);

  console.log("Seeding island delivery rates (Veymandoo <-> Guraidhoo)…");
  const veymandoo = islandIds["Veymandoo"];
  const guraidhoo = islandIds["Guraidhoo"];
  for (const [origin, destination] of [
    [veymandoo, guraidhoo],
    [guraidhoo, veymandoo],
  ]) {
    const { data: existing } = await supabase
      .from("island_delivery_rates")
      .select("id")
      .eq("origin_island_id", origin)
      .eq("destination_island_id", destination)
      .maybeSingle();
    if (!existing) {
      await supabase.from("island_delivery_rates").insert({
        origin_island_id: origin,
        destination_island_id: destination,
        base_fee: 20,
        distance_fee: 15,
        requires_boat: true,
      });
    }
  }

  console.log("Seeding an example restaurant…");
  const { data: existingRestaurant } = await supabase
    .from("businesses")
    .select("id")
    .eq("name", "Veymandoo Grill (Example)")
    .maybeSingle();

  let restaurantId = existingRestaurant?.id;
  if (!restaurantId) {
    const { data, error } = await supabase
      .from("businesses")
      .insert({
        business_type: "restaurant",
        name: "Veymandoo Grill (Example)",
        description: "Demo restaurant seeded for local development.",
        phone: "9990001",
        island_id: veymandoo,
        address: "Main Road, Veymandoo",
        delivery_fee: 25,
        minimum_order: 50,
        estimated_prep_minutes: 20,
      })
      .select("id")
      .single();
    if (error) throw error;
    restaurantId = data.id;

    const { data: category } = await supabase
      .from("restaurant_categories")
      .insert({ business_id: restaurantId, name: "Popular", sort_order: 1 })
      .select("id")
      .single();

    await supabase.from("menu_items").insert([
      { business_id: restaurantId, category_id: category.id, name: "Chicken Burger", price: 120, preparation_time_minutes: 15 },
      { business_id: restaurantId, category_id: category.id, name: "Fried Rice", price: 90, preparation_time_minutes: 15 },
      { business_id: restaurantId, category_id: category.id, name: "Grilled Reef Fish", price: 150, preparation_time_minutes: 25 },
    ]);
  }
  console.log(`  Restaurant ready (${restaurantId}).`);

  console.log("Seeding an example shop…");
  const { data: existingShop } = await supabase
    .from("businesses")
    .select("id")
    .eq("name", "Veymandoo General Store (Example)")
    .maybeSingle();

  let shopId = existingShop?.id;
  if (!shopId) {
    const { data, error } = await supabase
      .from("businesses")
      .insert({
        business_type: "general_store",
        name: "Veymandoo General Store (Example)",
        description: "Demo shop seeded for local development.",
        phone: "9990002",
        island_id: veymandoo,
        address: "Harbour Road, Veymandoo",
        delivery_fee: 15,
        minimum_order: 0,
      })
      .select("id")
      .single();
    if (error) throw error;
    shopId = data.id;

    const { data: category } = await supabase
      .from("product_categories")
      .insert({ business_id: shopId, name: "Household", sort_order: 1 })
      .select("id")
      .single();

    await supabase.from("products").insert([
      { business_id: shopId, category_id: category.id, name: "Rice (5kg)", price: 85, stock_quantity: 40 },
      { business_id: shopId, category_id: category.id, name: "Cooking Oil (1L)", price: 45, stock_quantity: 30 },
      { business_id: shopId, category_id: category.id, name: "Drinking Water (case)", price: 60, stock_quantity: 20 },
    ]);
  }
  console.log(`  Shop ready (${shopId}).`);

  console.log("\nDone. Remember: this is demo data — set the example");
  console.log("businesses' approval_status to 'suspended' or delete them");
  console.log("before a real launch.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
