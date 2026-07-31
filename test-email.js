import { sendEmail } from './services/emailService.js';

async function testFastFail() {
    console.log("Testing fail fast email...");
    const start = Date.now();
    await sendEmail("test@example.com", "Test", "Test");
    console.log("Finished in", Date.now() - start, "ms");
    process.exit(0);
}
testFastFail();
