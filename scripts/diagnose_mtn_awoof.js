import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const ARTIFACT_DIR = path.resolve('C:/Users/userpc/.gemini/antigravity/brain/9b5d5f65-d81f-47f1-a849-2c2b702634e3');

async function diagnose() {
    console.log("Running diagnostic for M1GBA...");
    
    // Inject token before module import
    process.env.PEYFLEX_API_TOKEN = 'dummy_diagnostic_token';
    const { buyDataWithPeyflex } = await import('../services/providers/peyflex.js');
    
    // We will hook into console.log to capture the payload
    let capturedPayload = null;
    const originalLog = console.log;
    console.log = function(...args) {
        const msg = args.join(' ');
        if (msg.includes('[Peyflex Request] Payload:')) {
            capturedPayload = msg.replace('[Peyflex Request] Payload: ', '');
        }
        originalLog.apply(console, args);
    };

    const result = await buyDataWithPeyflex('MTN', 'M1GBA', '08012345678', 'Awoof');
    
    // Restore console.log
    console.log = originalLog;

    let parsedPayload = {};
    if (capturedPayload) {
        try {
            parsedPayload = JSON.parse(capturedPayload);
        } catch(e) {}
    }

    let report = `# Diagnostic Report: M1GBA Purchase Failure\n\n`;
    report += `## Summary of Request\n`;
    report += `- **Selected Plan**: M1GBA (1GB MTN Awoof)\n`;
    report += `- **Provider**: Peyflex\n`;
    report += `- **Category Input**: Awoof\n`;
    report += `- **Network Input**: MTN\n\n`;

    report += `## Investigation Answers\n`;
    report += `1. **Which provider endpoint is receiving this request?**\n`;
    report += `   \`/api/data/purchase/\`\n`;
    
    report += `2. **Which network identifier is being sent to PayFlex?**\n`;
    report += `   \`${parsedPayload.network}\`\n`;
    
    report += `3. **Is M1GBA being routed to mtn_sme_data by mistake?**\n`;
    report += `   ${parsedPayload.network === 'mtn_sme_data' ? 'Yes' : 'No'}\n`;
    
    report += `4. **Is M1GBA being routed to mtn_gifting_data by mistake?**\n`;
    report += `   ${parsedPayload.network === 'mtn_gifting_data' ? 'Yes' : 'No'}\n`;

    report += `\n## Exact Payload Sent\n`;
    report += "```json\n" + JSON.stringify(parsedPayload, null, 2) + "\n```\n";

    report += `\n## PayFlex Response\n`;
    report += "```json\n" + JSON.stringify(result, null, 2) + "\n```\n";
    
    const filename = `M1GBA_Diagnostic_Report.md`;
    fs.writeFileSync(path.join(ARTIFACT_DIR, filename), report, 'utf-8');
    
    console.log("Diagnostic complete.");
    process.exit(0);
}

diagnose();
