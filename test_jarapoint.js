import dotenv from 'dotenv';
dotenv.config();
async function test() {
    const { buyAirtimeWithJarapoint } = await import('./services/providers/jarapoint.js');
    const res = await buyAirtimeWithJarapoint('MTN', 100, '08133131020', 'VTU');
    console.log("Jarapoint Result:", JSON.stringify(res, null, 2));
    process.exit(0);
}
test();
