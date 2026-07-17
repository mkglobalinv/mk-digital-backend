-- Migration script to upgrade basic_prices schema for Reseller Pricing Logic

-- 1. Add reseller_cost and reseller_selling_price to basic_prices
ALTER TABLE basic_prices 
ADD COLUMN IF NOT EXISTS reseller_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reseller_selling_price NUMERIC DEFAULT 0;

-- 2. Migrate existing selling_price to reseller_selling_price if applicable,
--    and set reseller_cost to selling_price (assuming old selling price was the cost).
--    Modify this update statement based on your exact business needs for existing data.
UPDATE basic_prices
SET 
  reseller_cost = selling_price,
  reseller_selling_price = selling_price + 20 -- Adding default margin for existing plans
WHERE reseller_cost = 0 AND reseller_selling_price = 0 AND selling_price > 0;

-- Note: The admin UI now expects to read/write 'reseller_cost' and 'reseller_selling_price' instead of just 'selling_price'.
