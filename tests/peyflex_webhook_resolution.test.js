// Regression test for the broken PeyFlex webhook / stuck "unknown" transaction bug.
//
// Root cause #1: services/providers/peyflex.js's requeryPeyflex() is a hard-coded
// stub that always returns { status: "pending" }, so PeyFlex data/airtime
// transactions that land in "unknown" (a purchase-call timeout or 5xx) can never
// auto-resolve via the periodic requery job.
//
// Root cause #2: routes/webhookRoutes.js's POST /peyflex handler destructured the
// `status` PeyFlex delivered in its webhook body, logged it, then discarded it and
// called resolveTransactionByReference() with no status — which fell back to the
// same broken requeryPeyflex() stub. Even a working webhook call could never
// resolve a transaction.
//
// The fix threads an optional `overrideResult` through resolveTransactionByReference
// -> resolvePendingTransaction so a webhook-delivered status is used directly
// instead of re-polling PeyFlex, and normalizePeyflexWebhookStatus() maps PeyFlex's
// webhook payload shapes to a definitive success/failed/null (unrecognized).

import { normalizePeyflexWebhookStatus } from '../routes/webhookRoutes.js';
import fs from 'fs';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
        console.log(`  PASS: ${message}`);
    } else {
        failed++;
        console.error(`  FAIL: ${message}`);
    }
}

console.log('\n1. normalizePeyflexWebhookStatus() — payload shape mapping');
assert(normalizePeyflexWebhookStatus({ status: true }) === 'success', 'boolean true -> success');
assert(normalizePeyflexWebhookStatus({ status: false }) === 'failed', 'boolean false -> failed');
assert(normalizePeyflexWebhookStatus({ status: 'success' }) === 'success', 'string "success" -> success');
assert(normalizePeyflexWebhookStatus({ status: 'SUCCESSFUL' }) === 'success', 'string "SUCCESSFUL" (case-insensitive) -> success');
assert(normalizePeyflexWebhookStatus({ status: 'failed' }) === 'failed', 'string "failed" -> failed');
assert(normalizePeyflexWebhookStatus({ status: 'declined' }) === 'failed', 'string "declined" -> failed');
assert(normalizePeyflexWebhookStatus({ Status: 'completed' }) === 'success', 'capitalized "Status" key -> success');
assert(normalizePeyflexWebhookStatus({ status_text: 'delivered' }) === 'success', 'status_text fallback key -> success');
assert(normalizePeyflexWebhookStatus({ status: 'processing' }) === null, 'unrecognized value -> null (no guess)');
assert(normalizePeyflexWebhookStatus({}) === null, 'empty payload -> null (no guess)');

console.log('\n2. Webhook handler wiring — override bypasses the broken requeryPeyflex() stub');
{
    const routeSrc = fs.readFileSync(new URL('../routes/webhookRoutes.js', import.meta.url), 'utf-8');
    assert(
        /resolveTransactionByReference\(reference,\s*\{\s*status:\s*normalizedStatus/.test(routeSrc),
        'POST /peyflex passes the normalized status as an override, not a bare requery call'
    );
    assert(
        /if \(reference && normalizedStatus\)/.test(routeSrc),
        'unrecognized/missing status never triggers a resolution attempt (no guessing)'
    );

    const requerySrc = fs.readFileSync(new URL('../services/requeryService.js', import.meta.url), 'utf-8');
    assert(
        /if \(overrideResult\) \{[\s\S]{0,400}result = overrideResult;/.test(requerySrc),
        'resolvePendingTransaction uses overrideResult in place of the provider-specific requery call'
    );
    assert(
        requerySrc.indexOf('if (overrideResult)') < requerySrc.indexOf("provider === 'peyflex'"),
        'the override check runs before requeryPeyflex() would ever be reached'
    );
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
    process.exitCode = 1;
}
