import express from 'express';
import { adminAuth } from '../middlewares/adminAuth.js';
import DiagnosticReport from '../models/DiagnosticReport.js';
import CodeIndex from '../models/CodeIndex.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import ProviderStatus from '../models/ProviderStatus.js';

const router = express.Router();

router.use(adminAuth);

// Mock AI Engine since no API key is provided
router.post('/ask', async (req, res) => {
    try {
        const { query } = req.body;
        const lowerQuery = query.toLowerCase();
        let answer = "";
        let mode = "";

        const operationalKeywords = ['user', 'users', 'transaction', 'transactions', 'balance', 'balances', 'providers', 'provider', 'wallet', 'wallets', 'statistics', 'counts', 'failures', 'failure', 'success rate', 'success rates'];
        const codeKeywords = ['source code', 'code', 'route', 'controller', 'model', 'architecture'];

        const isCodeQuery = codeKeywords.some(w => lowerQuery.includes(w));
        const isOperationalQuery = operationalKeywords.some(w => lowerQuery.includes(w)) && !isCodeQuery;

        if (isOperationalQuery) {
            mode = "[LIVE DATABASE MODE]";
            let foundData = false;

            if (lowerQuery.includes('user')) {
                const count = await User.countDocuments();
                answer += `Current Users: **${count}** registered users.\n`;
                foundData = true;
            }
            if (lowerQuery.includes('transaction') || lowerQuery.includes('failure') || lowerQuery.includes('success')) {
                const total = await Transaction.countDocuments();
                const success = await Transaction.countDocuments({ status: 'Successful' });
                const failed = await Transaction.countDocuments({ status: 'Failed' });
                answer += `Transaction Statistics:\n- Total: **${total}**\n- Successful: **${success}**\n- Failed: **${failed}**\n`;
                foundData = true;
            }
            if (lowerQuery.includes('provider')) {
                const providers = await ProviderStatus.find({});
                const online = providers.filter(p => p.isAvailable).map(p => p.providerName).join(', ') || 'None';
                const offline = providers.filter(p => !p.isAvailable).map(p => p.providerName).join(', ') || 'None';
                answer += `Live Provider Status:\n- Online/Healthy: **${online}**\n- Offline/Disconnected: **${offline}**\n`;
                foundData = true;
            }

            if (!foundData) {
                answer = "I am connected to the live database, but could not determine exactly which metrics you need from your query.";
            }
        } else {
            mode = "[CODE ANALYSIS MODE]";
            
            // Query 1: List all providers detected
            if (lowerQuery.includes("list all providers") || lowerQuery.includes("all providers detected") || lowerQuery.includes("what providers")) {
                const providers = await CodeIndex.distinct("metadata.relatedProviders");
                if (providers.length === 0) {
                    answer = "I checked the CodeIndex, but no providers have been detected yet. Have you run the indexer?";
                } else {
                    answer = `I have scanned the CodeIndex and detected the following providers integrated in the codebase:\n\n${providers.map(p => `- **${p}**`).join('\n')}\n\nWould you like to see which files integrate a specific provider?`;
                }
            } 
            // Query 2 & 3: Find integrations for a specific provider
            else if (lowerQuery.includes("flutterwave") || lowerQuery.includes("payflex") || lowerQuery.includes("peyflex") || lowerQuery.includes("clubkonnect") || lowerQuery.includes("reloadly")) {
                let targetProvider = "";
                if (lowerQuery.includes("flutterwave")) targetProvider = "flutterwave";
                if (lowerQuery.includes("payflex") || lowerQuery.includes("peyflex")) targetProvider = "peyflex";
                if (lowerQuery.includes("clubkonnect")) targetProvider = "clubkonnect";
                if (lowerQuery.includes("reloadly")) targetProvider = "reloadly";

                const files = await CodeIndex.find({ "metadata.relatedProviders": targetProvider }).select("filePath fileType");
                if (files.length === 0) {
                    answer = `I searched the CodeIndex but could not find any files related to ${targetProvider}.`;
                } else {
                    const fileList = files.map(f => `- **${f.filePath}** (${f.fileType})`).join('\n');
                    answer = `I found **${files.length}** files related to **${targetProvider}** integrations in the CodeIndex:\n\n${fileList}\n\nLet me know if you need me to analyze or generate patches for any of these specific files.`;
                }
            }
            // General fallback search
            else {
                const searchWords = lowerQuery.split(' ').filter(w => w.length > 3);
                const searchPattern = searchWords.length > 0 ? searchWords[0] : lowerQuery;
                const regex = new RegExp(searchPattern, 'i');
                
                const files = await CodeIndex.find({ 
                    $or: [ { filePath: regex }, { 'metadata.relatedProviders': regex } ]
                }).limit(5).select("filePath fileType");
                
                if (files.length > 0) {
                    const fileList = files.map(f => `- **${f.filePath}**`).join('\n');
                    answer = `Based on your query "${query}", I found these relevant indexed files:\n\n${fileList}`;
                } else {
                    answer = `I searched the CodeIndex for "${query}" but could not find any matching files or providers. Please try a different query, such as "List all providers detected".`;
                }
            }
        }

        answer = `**${mode}**\n\n${answer}`;

        res.json({ success: true, data: { answer } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'AI Assistant failed', error: err.message });
    }
});

router.post('/generate-fix', async (req, res) => {
    try {
        const { reportId } = req.body;
        const report = await DiagnosticReport.findById(reportId);
        
        const mockPatch = `--- a/services/vtuService.js
+++ b/services/vtuService.js
@@ -45,2 +45,8 @@
-    const response = await axios.post(providerUrl, payload);
-    return response.data;
+    try {
+        const response = await axios.post(providerUrl, payload, { timeout: 5000 });
+        return response.data;
+    } catch (e) {
+        // Fallback or retry
+        throw new Error('Provider Timeout');
+    }`;

        res.json({
            success: true,
            data: {
                patch: mockPatch,
                explanation: 'This patch adds a strict 5000ms timeout and catch block to prevent the system from hanging when the provider goes offline.',
                riskAnalysis: 'Low risk. Only affects the timeout boundary of external calls.',
                riskLevel: 'Low',
                filesAffected: ['services/vtuService.js'],
                expectedOutcome: 'Transactions will instantly fail with Provider Timeout instead of hanging in pending state.'
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Patch generation failed' });
    }
});

export default router;
