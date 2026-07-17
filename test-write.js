import fs from 'fs';

async function testWrite() {
    try {
        fs.writeFileSync('LATEST_OTP.txt', 'test');
        console.log("Write success!");
    } catch(e) {
        console.log("Write failed:", e.message);
    }
}
testWrite();
