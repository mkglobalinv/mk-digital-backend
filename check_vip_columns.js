import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
    const { data, error } = await supabase.from('vip_prices').select('reseller_cost, reseller_selling_price').limit(1);
    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Success! Columns exist. Data:", data);
    }
}
check();
