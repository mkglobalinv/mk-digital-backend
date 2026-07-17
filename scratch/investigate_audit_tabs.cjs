const axios = require('axios');

(async () => {
    const adminToken = process.argv[2];
    const resellerId = process.argv[3];

    try {
        console.log("================================================");
        console.log("PART 1 – Customer Transactions");
        console.log("================================================");
        const custRes = await axios.get(`http://localhost:8800/api/admin/audit/reseller-customers/${resellerId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log("HTTP status code:", custRes.status);
        console.log("Exact response body:", JSON.stringify(custRes.data, null, 2).substring(0, 1500) + '... (truncated)');
        console.log("typeof response.data:", typeof custRes.data);
        console.log("Array.isArray(response.data):", Array.isArray(custRes.data));
        console.log("Array.isArray(response.data.customers):", Array.isArray(custRes.data.customers));
        console.log("Array.isArray(response.data.transactions):", Array.isArray(custRes.data.transactions));

        console.log("\n================================================");
        console.log("PART 2 – Profit Ledger");
        console.log("================================================");
        const profitRes = await axios.get(`http://localhost:8800/api/admin/audit/profit-ledger/${resellerId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log("HTTP status code:", profitRes.status);
        console.log("Exact response body:", JSON.stringify(profitRes.data, null, 2).substring(0, 1500) + '... (truncated)');
        console.log("typeof returned object:", typeof profitRes.data);
        console.log("Array.isArray(response.data):", Array.isArray(profitRes.data));
        console.log("Array.isArray(response.data.ledger):", Array.isArray(profitRes.data.ledger));
        console.log("Array.isArray(response.data.profits):", Array.isArray(profitRes.data.profits));

    } catch (err) {
        console.error(err.response ? err.response.data : err.message);
    }
})();
