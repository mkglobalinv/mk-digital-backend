import DiagnosticReport from '../models/DiagnosticReport.js';
import Transaction from '../models/Transaction.js';
import CodeIndex from '../models/CodeIndex.js';

// Static rule-based engine to map errors to root causes without LLM
const mapErrorToRootCause = (errorDetails, provider) => {
    const errorLower = errorDetails.toLowerCase();
    if (errorLower.includes('timeout') || errorLower.includes('econnrefused')) {
        return {
            cause: `The upstream provider (${provider}) is unreachable or timing out.`,
            confidence: 90
        };
    }
    if (errorLower.includes('balance') || errorLower.includes('insufficient funds')) {
        return {
            cause: `API account for ${provider} has insufficient balance.`,
            confidence: 95
        };
    }
    if (errorLower.includes('invalid') || errorLower.includes('not found')) {
        return {
            cause: `Provider ${provider} rejected the input or category is no longer valid.`,
            confidence: 85
        };
    }
    
    return {
        cause: `Unknown failure in ${provider} integration. Raw error: ${errorDetails}`,
        confidence: 50
    };
};

export const runDiagnosticScan = async () => {
    try {
        // Find recent failed transactions (last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const failedTxs = await Transaction.find({
            status: 'failed',
            createdAt: { $gte: oneHourAgo }
        }).limit(50);

        const newReports = [];

        for (const tx of failedTxs) {
            // Avoid duplicates
            const existing = await DiagnosticReport.findOne({ 'metadata.transactionId': tx._id.toString() });
            if (existing) continue;

            const provider = tx.provider || 'unknown';
            const errorReason = tx.paymentDetails?.apiResponse || tx.adminNotes || 'General API failure';
            
            const analysis = mapErrorToRootCause(errorReason, provider);
            
            // Look up affected files in CodeIndex
            const codeRefs = await CodeIndex.find({
                'metadata.relatedProviders': new RegExp(provider, 'i')
            }).limit(5).select('filePath');

            const affectedFiles = codeRefs.map(c => c.filePath);

            const report = await DiagnosticReport.create({
                issueTitle: `${tx.service || 'Transaction'} Failed`,
                failureType: 'Transaction',
                rootCause: analysis.cause,
                confidenceScore: analysis.confidence,
                affectedFiles,
                affectedServices: [tx.service || 'UnknownService'],
                metadata: {
                    transactionId: tx._id.toString(),
                    providerName: provider,
                    rawError: errorReason
                }
            });

            newReports.push(report);
        }

        return { success: true, message: `Scan complete. Found ${newReports.length} new issues.`, data: newReports };

    } catch (err) {
        console.error('Diagnostic Engine Error:', err);
        return { success: false, message: 'Scan failed', error: err.message };
    }
};

export const getDiagnosticReports = async () => {
    return await DiagnosticReport.find().sort({ createdAt: -1 }).limit(50);
};
