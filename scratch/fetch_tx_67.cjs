require('dotenv').config();
const mongoose = require('mongoose');

async function checkTx() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const tx = await db.collection('transactions').findOne({ reference: { $regex: '6711511429' } });
    if (!tx) {
        const tx2 = await db.collection('transactions').findOne({ "api_response.orderid": "6711511429" });
        console.log("Found by orderid?", tx2);
    } else {
        console.log("Transaction:", tx);
    }
    process.exit(0);
}
checkTx();
