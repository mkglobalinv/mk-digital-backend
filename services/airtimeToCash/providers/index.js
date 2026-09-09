import AirtimeCashProviderConfig from '../../../models/AirtimeCashProviderConfig.js';
import { AirtimeBridgeProvider } from './airtimeBridgeProvider.js';
import { MockAirtimeToCashProvider } from './mockProvider.js';

/**
 * Loads the current AirtimeBridge config (creating a disabled default row on first
 * use, exactly like GatewayConfig's per-provider documents) without ever returning
 * the decrypted apiToken to a caller that isn't about to hand it straight to the
 * provider client.
 */
export async function getProviderConfig() {
    let config = await AirtimeCashProviderConfig.findOne({ provider: 'airtimebridge' });
    if (!config) {
        config = await AirtimeCashProviderConfig.create({ provider: 'airtimebridge' });
    }
    return config;
}

/**
 * Resolves the provider implementation to use for a given config. Automated tests
 * (NODE_ENV=test) always get the mock provider regardless of stored config, so a
 * test run can never accidentally dial out to a real provider or move real money.
 * Outside tests, sandbox/test-mode config also resolves to the mock provider so
 * "sandbox" is meaningful even before AirtimeBridge's own contract is available;
 * live mode resolves to the real (currently stubbed) AirtimeBridgeProvider.
 */
export function resolveProvider(config) {
    if (process.env.NODE_ENV === 'test') {
        return new MockAirtimeToCashProvider();
    }
    if (config.isTestMode) {
        return new MockAirtimeToCashProvider();
    }
    return new AirtimeBridgeProvider({
        apiBaseUrl: config.credentials?.apiBaseUrl,
        apiToken: config.credentials?.apiToken,
        isTestMode: config.isTestMode
    });
}

export async function getProvider() {
    const config = await getProviderConfig();
    return { provider: resolveProvider(config), config };
}
