-- SUPABASE MIGRATION SCRIPT - PHASE 2
-- Execute this script in your Supabase SQL Editor

-- 1. FEATURE FLAGS TABLE
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(24) UNIQUE NOT NULL, -- Corresponds to Reseller User ID
    custom_domain BOOLEAN DEFAULT false,
    apk_generation BOOLEAN DEFAULT false,
    pwa_enabled BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    premium_analytics BOOLEAN DEFAULT false,
    ai_tools BOOLEAN DEFAULT false,
    playstore_publish BOOLEAN DEFAULT false,
    ios_app BOOLEAN DEFAULT false,
    premium_branding BOOLEAN DEFAULT false,
    dedicated_support BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.feature_flags FOR SELECT USING (true);


-- 2. PRICING TIERS (Global)
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id VARCHAR(50) UNIQUE NOT NULL,
    network VARCHAR(20) NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    admin_cost NUMERIC(10, 2) NOT NULL,
    default_retail_price NUMERIC(10, 2) NOT NULL,
    default_reseller_price NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.pricing_tiers FOR SELECT USING (true);


-- 3. RESELLER CUSTOM PRICING
CREATE TABLE IF NOT EXISTS public.reseller_custom_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reseller_id VARCHAR(24) NOT NULL,
    plan_id VARCHAR(50) NOT NULL,
    custom_retail_price NUMERIC(10, 2),
    custom_api_price NUMERIC(10, 2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(reseller_id, plan_id)
);

ALTER TABLE public.reseller_custom_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.reseller_custom_prices FOR SELECT USING (true);


-- 4. ANALYTICS AGGREGATION TABLE (for fast dashboard queries)
CREATE TABLE IF NOT EXISTS public.daily_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    reseller_id VARCHAR(24) NOT NULL, -- Or 'system' for global admin stats
    total_transactions INTEGER DEFAULT 0,
    successful_transactions INTEGER DEFAULT 0,
    failed_transactions INTEGER DEFAULT 0,
    total_revenue NUMERIC(15, 2) DEFAULT 0,
    total_profit NUMERIC(15, 2) DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, reseller_id)
);

ALTER TABLE public.daily_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.daily_analytics FOR SELECT USING (true);


-- Enable Realtime for these tables
BEGIN;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.feature_flags;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing_tiers;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reseller_custom_prices;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_analytics;
COMMIT;
