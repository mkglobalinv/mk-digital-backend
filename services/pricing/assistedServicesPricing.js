/**
 * Centralized Configuration and Pricing Map for Assisted Services.
 * This is the authoritative source for Assisted Services pricing.
 * The frontend must NEVER determine the amount charged.
 */

export const ASSISTED_SERVICES_CONFIG = {
    // NIN Modification Services
    'nin-name-modification': { name: 'Name Modification (NIN)', amount: 6000, cost: 5500, expectedProcessingTime: '1 day' },
    'nin-dob-modification': { name: 'Date of Birth Modification (NIN)', amount: 36500, cost: 36000, expectedProcessingTime: '1 day' },
    'nin-phone-modification': { name: 'Phone Modification (NIN)', amount: 6000, cost: 5500, expectedProcessingTime: '1 day' },
    'nin-address-modification': { name: 'Address Modification (NIN)', amount: 6000, cost: 5500, expectedProcessingTime: '1 day' },
    'nin-state-lga-modification': { name: 'State & LGA Modification (NIN)', amount: 8500, cost: 8000, expectedProcessingTime: '1 day' },
    
    // BVN Update Services
    'bvn-name-update': { name: 'Name Update (BVN)', amount: 9000, cost: 8000, expectedProcessingTime: '5 working days' },
    'bvn-phone-update': { name: 'Phone Update (BVN)', amount: 9000, cost: 8000, expectedProcessingTime: '5 working days' },
    'bvn-dob-update': { name: 'DOB Update (BVN)', amount: 9000, cost: 8000, expectedProcessingTime: '5 working days' },
    
    // BVN Affidavit Services
    'bvn-affidavit-with': { name: 'BVN Update With Court Affidavit', amount: 7500, cost: 6500, expectedProcessingTime: '5 working days' },
    'bvn-affidavit-without': { name: 'BVN Update Without Court Affidavit', amount: 9000, cost: 8000, expectedProcessingTime: '5 working days' },
    
    // CAC Registration Services (Cost not yet configured, profit will be zero)
    'cac-business-name': { name: 'Business Name Registration (CAC)', amount: 30000, cost: null, expectedProcessingTime: '2 days' },
    'cac-private-limited': { name: 'Private Limited Registration (CAC)', amount: 65000, cost: null, expectedProcessingTime: '2 days' },
    'cac-public-limited': { name: 'Public Limited Registration (CAC)', amount: 120000, cost: null, expectedProcessingTime: '2 days' },
    'cac-ngo': { name: 'Incorporated Trustee / NGO (CAC)', amount: 85000, cost: null, expectedProcessingTime: '2 days' },

    // Birth Attestation Letter (see BirthAttestationPurchase.jsx)
    'birth-attestation-letter': { name: 'Birth Attestation Letter', amount: 22000, cost: null, expectedProcessingTime: '3-5 working days' },

    // Court Affidavit (see CourtAffidavitPage.jsx) — flat price covering all 8
    // affidavit types; the specific type selected is recorded in submittedData.
    'court-affidavit': { name: 'Court Affidavit', amount: 3500, cost: null, expectedProcessingTime: '2-3 working days' },
};

/**
 * Calculates profit split for a given service and reseller tier.
 * Returns { profit, resellerProfit, platformProfit, resellerShare, platformShare }
 */
export const calculateProfitSplit = (serviceType, resellerTier) => {
    const config = ASSISTED_SERVICES_CONFIG[serviceType];
    if (!config) return null;

    if (config.cost === null || config.cost === undefined) {
        return { profit: 0, resellerProfit: 0, platformProfit: 0, resellerShare: 0, platformShare: 0, cost: null, amount: config.amount };
    }

    const profit = config.amount - config.cost;
    
    let resellerShare = 0;
    let platformShare = 0;

    if (resellerTier === null || resellerTier === undefined) {
        // Main platform purchase (no reseller)
        resellerShare = 0;
        platformShare = 1.0;
    } else if (resellerTier === 'premium') {
        resellerShare = 0.60;
        platformShare = 0.40;
    } else {
        // Basic/VIP tier
        resellerShare = 0.30;
        platformShare = 0.70;
    }

    const resellerProfit = Number((profit * resellerShare).toFixed(2));
    const platformProfit = Number((profit * platformShare).toFixed(2));

    return { profit, resellerProfit, platformProfit, resellerShare, platformShare, cost: config.cost, amount: config.amount };
};

/**
 * Returns the configuration for a specific assisted service type.
 * @param {string} serviceType - The service identifier (e.g., 'nin-name-modification')
 * @returns {Object|null} The configuration object or null if not found.
 */
export const getAssistedServiceConfig = (serviceType) => {
    return ASSISTED_SERVICES_CONFIG[serviceType] || null;
};
