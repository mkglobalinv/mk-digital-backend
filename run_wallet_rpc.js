import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
const { Client } = pg;

async function runMigration() {
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
        console.error("DATABASE_URL is not set in .env");
        process.exit(1);
    }

    const sql = `
  CREATE OR REPLACE FUNCTION process_wallet_adjustment(
    p_user_id text,
    p_amount numeric,
    p_type text, 
    p_wallet_type text, 
    p_reference text,
    p_description text
  )
  RETURNS TABLE (new_balance numeric)
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
      v_current_balance numeric;
      v_new_balance numeric;
  BEGIN
      -- We will skip strict checking against wallet_ledger for the starting balance 
      -- because wallet_ledger might be empty initially. Just calculate it.
      -- A better way is to pass the current balance from the application.
      
      -- Wait, since we are doing this for 'normal', 'vip' etc, and we want to allow initial adjustments
      -- Let's just trust the backend application to handle the exact MongoDB balances, and use this RPC
      -- to log the ledger and broadcast real-time updates.
      -- BUT we need it to return the 'new_balance'. 
      -- Actually, looking at the adminController.js, the backend sends the adjustment, and it expects 'new_balance' back.
      -- Since MongoDB is the source of truth currently (as seen in adminController.js where it falls back to MongoDB balance if rpc fails), 
      -- we should update the wallet_ledger to stream the change.
      
      -- For now, let's just make it a simple pass-through log function that returns a dummy balance (0) 
      -- OR let's make it actually compute the sum from wallet_ledger.
      
      SELECT COALESCE(SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE -amount END), 0)
      INTO v_current_balance
      FROM wallet_ledger
      WHERE user_id = p_user_id AND description LIKE '%' || p_wallet_type || '%'; -- Just a basic grouping if needed, but let's ignore wallet_type grouping for now

      IF p_type = 'credit' THEN
          v_new_balance := v_current_balance + p_amount;
      ELSIF p_type = 'debit' THEN
          v_new_balance := v_current_balance - p_amount;
      ELSE
          RAISE EXCEPTION 'Invalid transaction type %', p_type;
      END IF;

      INSERT INTO wallet_ledger (
          user_id, amount, transaction_type, previous_balance, new_balance, 
          reference, description
      ) VALUES (
          p_user_id, p_amount, p_type, v_current_balance, v_new_balance,
          p_reference, p_description || ' (' || p_wallet_type || ')'
      );

      RETURN QUERY SELECT v_new_balance;
  END;
  $$;
  `;

    const client = new Client({
        connectionString: dbUrl,
    });

    try {
        await client.connect();
        console.log("Connected to Supabase PostgreSQL.");
        console.log("Executing wallet RPC creation script...");
        
        await client.query(sql);
        
        console.log("RPC created successfully.");
    } catch (err) {
        console.error("Creation failed:", err);
    } finally {
        await client.end();
    }
}

runMigration();
