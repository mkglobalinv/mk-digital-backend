-- Migration script to upgrade vip_prices schema for Reseller Pricing Logic

-- 1. Add reseller_cost and reseller_selling_price to vip_prices
ALTER TABLE vip_prices 
ADD COLUMN IF NOT EXISTS reseller_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reseller_selling_price NUMERIC DEFAULT 0;

-- 2. Migrate existing selling_price to reseller_selling_price if applicable,
--    and set reseller_cost to selling_price (assuming old selling price was the cost).
UPDATE vip_prices
SET 
  reseller_cost = selling_price,
  reseller_selling_price = selling_price + 20
WHERE reseller_cost = 0 AND reseller_selling_price = 0 AND selling_price > 0;
