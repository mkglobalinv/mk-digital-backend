import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function deployRPC() {
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
      -- Only checking wallet_ledger table for simplicity as it mirrors the actual balance
      SELECT COALESCE(SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE -amount END), 0)
      INTO v_current_balance
      FROM wallet_ledger
      WHERE user_id = p_user_id;

      IF p_type = 'credit' THEN
          v_new_balance := v_current_balance + p_amount;
      ELSIF p_type = 'debit' THEN
          IF v_current_balance < p_amount THEN
              RAISE EXCEPTION 'Insufficient balance in %', p_wallet_type;
          END IF;
          v_new_balance := v_current_balance - p_amount;
      ELSE
          RAISE EXCEPTION 'Invalid transaction type %', p_type;
      END IF;

      -- Insert into wallet_ledger to stream the balance change
      INSERT INTO wallet_ledger (
          user_id, amount, transaction_type, previous_balance, new_balance, 
          reference, description
      ) VALUES (
          p_user_id, p_amount, p_type, v_current_balance, v_new_balance,
          p_reference, p_description
      );

      RETURN QUERY SELECT v_new_balance;
  END;
  $$;
  `;

  // We can't directly execute arbitrary DDL from supabase-js without a proxy RPC
  // Wait, does supabase-js allow running arbitrary raw SQL? No, unless we use postgres connection.
  // I will check if we can execute this.
  
  console.log("To deploy this RPC, you need a postgres client or run it via Supabase Dashboard SQL Editor.");
}

deployRPC();
