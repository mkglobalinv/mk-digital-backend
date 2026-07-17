import bcrypt from 'bcrypt';
async function test() {
    try {
        const hash = await bcrypt.hash('test', 10);
        const match = await bcrypt.compare('test', hash);
        console.log("Bcrypt works:", match);
    } catch (e) {
        console.error("Bcrypt fails:", e);
    }
}
test();
