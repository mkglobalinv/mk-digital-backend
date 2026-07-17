-- =======================================================================================
-- CRITICAL SECURITY MIGRATION: ROW LEVEL SECURITY (RLS) FOR MONGO-JWT AUTHENTICATION
-- =======================================================================================

-- 1. Create a helper function to safely extract the MongoDB user ID from the custom JWT
CREATE OR REPLACE FUNCTION get_mongo_user_id()
RETURNS text AS $$
BEGIN
  -- Extract the 'id' claim from the JWT (this matches jwt.sign({ id: user._id }) from your backend)
  RETURN current_setting('request.jwt.claims', true)::json->>'id';
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;


-- 2. Enable RLS on all critical tables
-- (Note: If any of these tables don't exist in Supabase, the ALTER TABLE will fail, 
-- but you should run it for the ones that do exist, such as wallet_ledger and notifications)

DO $$ 
BEGIN
  -- Enable RLS safely, ignoring errors if table doesn't exist
  BEGIN ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN END;
  BEGIN ALTER TABLE notifications ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN END;
  BEGIN ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN END;
  BEGIN ALTER TABLE reseller_custom_prices ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN END;
END $$;


-- 3. Drop any existing permissive policies (Optional, to ensure clean slate)
DO $$ 
BEGIN
  BEGIN DROP POLICY IF EXISTS "Allow all access" ON wallet_ledger; EXCEPTION WHEN OTHERS THEN END;
  BEGIN DROP POLICY IF EXISTS "Allow all access" ON notifications; EXCEPTION WHEN OTHERS THEN END;
  BEGIN DROP POLICY IF EXISTS "Allow all access" ON feature_flags; EXCEPTION WHEN OTHERS THEN END;
  BEGIN DROP POLICY IF EXISTS "Allow all access" ON reseller_custom_prices; EXCEPTION WHEN OTHERS THEN END;
END $$;


-- 4. Create Strict RLS Policies forcing `user_id = get_mongo_user_id()`
-- WALLET LEDGER
CREATE POLICY "Strict isolated access for wallet_ledger" 
ON wallet_ledger 
FOR ALL 
USING (user_id = get_mongo_user_id());

-- NOTIFICATIONS
CREATE POLICY "Strict isolated access for notifications" 
ON notifications 
FOR ALL 
USING (user_id = get_mongo_user_id());

-- FEATURE FLAGS
CREATE POLICY "Strict isolated access for feature_flags" 
ON feature_flags 
FOR ALL 
USING (user_id = get_mongo_user_id());

-- RESELLER CUSTOM PRICES (reseller_id instead of user_id)
CREATE POLICY "Strict isolated access for reseller_custom_prices" 
ON reseller_custom_prices 
FOR ALL 
USING (reseller_id = get_mongo_user_id());


-- =======================================================================================
-- WARNING TO ADMIN:
-- For this to work, you MUST set your Supabase JWT Secret to match your backend's JWT_SECRET.
-- 1. Go to Supabase Dashboard -> Settings -> API -> JWT Settings
-- 2. Enter the same JWT Secret used in your backend's .env file.
-- =======================================================================================
