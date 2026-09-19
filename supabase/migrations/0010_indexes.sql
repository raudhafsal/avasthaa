-- Avas Thaa — 0010: indexes
-- Targets: FK lookups the app does constantly, status filters on hot
-- tables, and per-user/per-island scoping used by nearly every RLS policy.

create index idx_profiles_role on profiles (role);
create index idx_profiles_island on profiles (island_id);

create index idx_addresses_profile on addresses (profile_id);

create index idx_businesses_created_by on businesses (created_by);
create index idx_businesses_island on businesses (island_id);
create index idx_businesses_type_status on businesses (business_type, approval_status);
create index idx_businesses_category on businesses (category_id);

create index idx_business_hours_business on business_hours (business_id);
create index idx_restaurant_categories_business on restaurant_categories (business_id);
create index idx_product_categories_business on product_categories (business_id);

create index idx_menu_items_business on menu_items (business_id);
create index idx_menu_items_category on menu_items (category_id);
create index idx_menu_option_groups_item on menu_item_option_groups (menu_item_id);
create index idx_menu_options_group on menu_item_options (option_group_id);

create index idx_products_business on products (business_id);
create index idx_products_category on products (category_id);

create index idx_carts_profile on carts (profile_id);
create index idx_cart_items_cart on cart_items (cart_id);

create index idx_orders_customer on orders (customer_id);
create index idx_orders_business on orders (business_id);
create index idx_orders_status on orders (status);
create index idx_orders_created_at on orders (created_at desc);
create index idx_order_items_order on order_items (order_id);
create index idx_order_status_history_order on order_status_history (order_id);

create index idx_delivery_partners_island on delivery_partners (island_id);
create index idx_delivery_partners_online on delivery_partners (is_online) where is_online = true;
create index idx_partner_documents_partner on partner_documents (partner_id);

create index idx_deliveries_customer on deliveries (customer_id);
create index idx_deliveries_partner on deliveries (assigned_partner_id);
create index idx_deliveries_stage on deliveries (stage);
create index idx_deliveries_order on deliveries (order_id);
create index idx_delivery_stage_history_delivery on delivery_stage_history (delivery_id);
create index idx_delivery_locations_delivery on delivery_locations (delivery_id, recorded_at desc);

create index idx_wallet_transactions_wallet on wallet_transactions (wallet_id, created_at desc);
create index idx_payments_profile on payments (profile_id);
create index idx_payments_order on payments (order_id);
create index idx_partner_earnings_partner on partner_earnings (partner_id, created_at desc);
create index idx_payouts_partner on payouts (partner_id);

create index idx_coupon_usage_profile on coupon_usage (profile_id, coupon_id);

create index idx_favorites_profile on favorites (profile_id);
create index idx_reviews_business on reviews (business_id);
create index idx_reviews_partner on reviews (partner_id);

create index idx_notifications_profile_unread on notifications (profile_id, created_at desc) where read_at is null;
create index idx_support_tickets_profile on support_tickets (profile_id);
create index idx_support_tickets_status on support_tickets (status);
create index idx_support_messages_ticket on support_messages (ticket_id, created_at);

create index idx_island_rates_pair on island_delivery_rates (origin_island_id, destination_island_id);
create index idx_delivery_zones_pair on delivery_zones (origin_island_id, destination_island_id);

create index idx_admin_audit_logs_entity on admin_audit_logs (entity_type, entity_id);
create index idx_admin_audit_logs_admin on admin_audit_logs (admin_id, created_at desc);
