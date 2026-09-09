import AirtimeCashPricing from '../../models/AirtimeCashPricing.js';

export class PricingNotConfiguredError extends Error {
    constructor(network) {
        super(`Airtime-to-Cash is not configured for ${network} yet. Please try again later.`);
        this.name = 'PricingNotConfiguredError';
    }
}

export class AmountOutOfRangeError extends Error {
    constructor(min, max) {
        super(`Amount must be between ₦${min} and ₦${max}.`);
        this.name = 'AmountOutOfRangeError';
    }
}

/**
 * Resolves the effective pricing row for a tenant+network: a tenant-specific row
 * overrides the global (tenantId: null) row for that network. Returns null if
 * neither exists yet.
 */
export async function resolveEffectivePricing(tenantId, network) {
    const net = String(network || '').toUpperCase();

    if (tenantId) {
        const tenantRow = await AirtimeCashPricing.findOne({ tenantId, network: net, isEnabled: true });
        if (tenantRow) return { row: tenantRow, source: 'tenant' };
    }

    const globalRow = await AirtimeCashPricing.findOne({ tenantId: null, network: net, isEnabled: true });
    if (globalRow) return { row: globalRow, source: 'global' };

    return null;
}

/**
 * The single source of truth for what a customer will receive. Never trust a
 * frontend-supplied payout figure -- this is the only place that number is computed,
 * and every caller (the /quote endpoint, and transaction creation) goes through it.
 *
 * @returns {{ conversionPercentage, fixedFee, payoutAmount, source, pricingId, minAmount, maxAmount }}
 */
export async function calculateAirtimeCashQuote({ tenantId, network, amount }) {
    const net = String(network || '').toUpperCase();
    const numericAmount = Number(amount);

    if (!['MTN', 'AIRTEL', 'GLO', '9MOBILE'].includes(net)) {
        throw new Error('Unsupported network.');
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error('Invalid amount.');
    }

    const resolved = await resolveEffectivePricing(tenantId, net);
    if (!resolved) {
        throw new PricingNotConfiguredError(net);
    }

    const { row, source } = resolved;

    if (numericAmount < row.minAmount || numericAmount > row.maxAmount) {
        throw new AmountOutOfRangeError(row.minAmount, row.maxAmount);
    }

    const rawPayout = (numericAmount * row.conversionPercentage) / 100 - row.fixedFee;
    const payoutAmount = Math.max(0, Math.round(rawPayout * 100) / 100);

    return {
        conversionPercentage: row.conversionPercentage,
        fixedFee: row.fixedFee,
        payoutAmount,
        source,
        pricingId: row._id,
        minAmount: row.minAmount,
        maxAmount: row.maxAmount
    };
}
