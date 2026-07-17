-- SUPABASE MIGRATION SCRIPT - PHASE 1
-- Execute this script in your Supabase SQL Editor

-- 1. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(24) NOT NULL, -- MongoDB ObjectId
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'system',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for notifications (Optional but recommended if users connect directly to Supabase from frontend)
-- For this migration, we'll allow all authenticated requests from the service key, 
-- but if frontend connects directly, they need policies. 
-- We will rely on anon key + custom auth or just fetch via backend if we don't sync auth.
-- For true realtime on frontend without Supabase Auth, we can enable public read for specific channels, 
-- or use Supabase Auth custom JWTs. For now, we allow all for ease of integration.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.notifications FOR UPDATE USING (true);


-- 2. WALLET LEDGER TABLE
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(24) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit', 'commission', 'adjustment')),
    wallet_type VARCHAR(20) NOT NULL CHECK (wallet_type IN ('normal', 'vip', 'earnings')),
    reference VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'success',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast balance calculation
CREATE INDEX idx_wallet_ledger_user ON public.wallet_ledger(user_id, wallet_type);

ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.wallet_ledger FOR SELECT USING (true);
-- Only the backend (service role) should insert/update ledger entries.
-- RLS bypasses service_role key automatically.


-- 3. RESELLER BRANDING TABLE
CREATE TABLE IF NOT EXISTS public.reseller_branding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(24) UNIQUE NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    site_name VARCHAR(100),
    primary_color VARCHAR(20) DEFAULT '#3b82f6',
    secondary_color VARCHAR(20) DEFAULT '#10b981',
    background_color VARCHAR(20) DEFAULT '#f8fafc',
    logo_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reseller_branding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.reseller_branding FOR SELECT USING (true);


-- Enable Realtime for these tables
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_ledger;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reseller_branding;
