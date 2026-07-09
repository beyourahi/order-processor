-- Order Processor — local dev seed (idempotent). Populates the E2E_BYPASS_AUTH test user's app data.
-- Run: bun run seed   (→ wrangler d1 execute order_processor --local --file ./seed/seed.sql)
-- NEVER run against --remote / production. Fixed ids + INSERT OR REPLACE = re-runnable.
-- Timestamps are seconds (unixepoch), matching Drizzle mode:"timestamp" on every column here.
-- Owner is the synthesized bypass user (e2e-test-user).
--
-- NOTE: this app does NOT persist order batches to D1 — CSV → xlsx conversion + the output
-- editor are stateless/in-memory. The only user-owned app data that hydrates the signed-in
-- page is brand_settings (the merchant profile) + the copilot history. So the realistic
-- Shopify → SteadFast order fixtures live inside a seeded copilot conversation's tool_calls
-- JSON blob (ai_messages.tool_calls), the one column that can hold a batch of orders.

INSERT OR IGNORE INTO users (id, email, email_verified, name, image, created_at, updated_at)
VALUES ('e2e-test-user', 'e2e@test.local', 1, 'E2E Test User', NULL, unixepoch('now'), unixepoch('now'));

-- Merchant profile: contact + SteadFast merchant id + selected courier (renders on the signed-in page
-- and seeds the output editor's batch defaults). selected_courier must equal the Courier enum value.
INSERT OR REPLACE INTO brand_settings (id, user_id, contact_name, contact_phone, merchant_id, selected_courier, created_at, updated_at)
VALUES ('seed-bs-1', 'e2e-test-user', 'Tanvir Ahmed', '01712-345678', 'SF-DHK-88421', 'SteadFast', unixepoch('now'), unixepoch('now'));

-- Copilot history: one realistic conversation (title hydrates in the conversations panel).
-- INSERT OR REPLACE deletes the old row first, cascade-clearing its messages, so the two
-- message rows below re-seed cleanly on every run (no orphans, no duplicates).
INSERT OR REPLACE INTO ai_conversations (id, user_id, title, created_at, updated_at)
VALUES ('seed-conv-1', 'e2e-test-user', 'SteadFast batch — 6 Dhaka/Chittagong orders', unixepoch('now', '-1 days'), unixepoch('now'));

INSERT OR REPLACE INTO ai_messages (id, conversation_id, role, content, tool_calls, created_at)
VALUES ('seed-msg-1', 'seed-conv-1', 'user', 'Process my latest Shopify export — 6 COD orders for SteadFast, mostly Dhaka with a couple in Chittagong.', NULL, unixepoch('now', '-1 days'));

INSERT OR REPLACE INTO ai_messages (id, conversation_id, role, content, tool_calls, created_at)
VALUES ('seed-msg-2', 'seed-conv-1', 'assistant', 'Added 6 orders to the batch. Total COD 12,940 BDT across Dhaka and Chittagong.',
'[{"id":"call_seed_addrows","name":"addRows","args":{"rows":[{"name":"Nusrat Jahan","address":"House 12, Road 5, Dhanmondi, Dhaka 1205","phone":"01712-345678","amount":1850,"product":"Attar Oud Roll-On 6ml","quantity":2},{"name":"Rakibul Hasan","address":"Flat 4B, Green Road, Farmgate, Dhaka 1215","phone":"01819-223344","amount":2400,"product":"Premium Panjabi (Maroon, L)","quantity":1},{"name":"Sadia Islam","address":"Plot 7, Block C, Bashundhara R/A, Dhaka 1229","phone":"01912-778899","amount":990,"product":"Herbal Face Wash 100ml","quantity":3},{"name":"Mahmudul Karim","address":"House 45, CDA Avenue, Nasirabad, Chittagong 4000","phone":"01711-556677","amount":3200,"product":"Leather Wallet (Brown)","quantity":1},{"name":"Farhana Akter","address":"Road 11, Halishahar, Chittagong 4216","phone":"01677-889900","amount":1500,"product":"Cotton Saree (Teal)","quantity":1},{"name":"Imran Chowdhury","address":"House 3, Road 2, Uttara Sector 7, Dhaka 1230","phone":"01555-112233","amount":3000,"product":"Wireless Earbuds","quantity":2}]}}]',
unixepoch('now', '-1 days'));
