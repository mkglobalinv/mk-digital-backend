-- PHASE 3 SUPABASE MIGRATION
-- Adds realtime transactions and withdrawal requests

-- 1. Transactions Table (Real-time replica of MongoDB Transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mongo_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    type TEXT NOT NULL, -- credit or debit
    status TEXT NOT NULL DEFAULT 'pending',
    reference TEXT,
    description TEXT,
    phone TEXT,
    network TEXT,
    profit NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and Realtime
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for transactions"
    ON public.transactions
    FOR SELECT
    USING (true);

CREATE POLICY "Allow service role full access for transactions"
    ON public.transactions
    USING (true)
    WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- 2. Withdrawal Requests Table (For Reseller Profits)
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mongo_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and Realtime
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for withdrawal_requests"
    ON public.withdrawal_requests
    FOR SELECT
    USING (true);

CREATE POLICY "Allow service role full access for withdrawal_requests"
    ON public.withdrawal_requests
    USING (true)
    WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests;
