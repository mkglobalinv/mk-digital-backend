/**
 * Centralized Configuration and Pricing Map for Assisted Services.
 * This is the authoritative source for Assisted Services pricing.
 * The frontend must NEVER determine the amount charged.
 */

export const ASSISTED_SERVICES_CONFIG = {
    // NIN Modification Services
    'nin-name-modification': { name: 'Name Modification (NIN)', amount: 6000, expectedProcessingTime: '1 day' },
    'nin-dob-modification': { name: 'Date of Birth Modification (NIN)', amount: 36500, expectedProcessingTime: '1 day' },
    'nin-phone-modification': { name: 'Phone Modification (NIN)', amount: 6000, expectedProcessingTime: '1 day' },
    'nin-address-modification': { name: 'Address Modification (NIN)', amount: 6000, expectedProcessingTime: '1 day' },
    'nin-state-lga-modification': { name: 'State & LGA Modification (NIN)', amount: 8500, expectedProcessingTime: '1 day' },
    
    // BVN Update Services
    'bvn-name-update': { name: 'Name Update (BVN)', amount: 9000, expectedProcessingTime: '5 working days' },
    'bvn-phone-update': { name: 'Phone Update (BVN)', amount: 9000, expectedProcessingTime: '5 working days' },
    'bvn-dob-update': { name: 'DOB Update (BVN)', amount: 9000, expectedProcessingTime: '5 working days' },
    
    // BVN Affidavit Services
    'bvn-affidavit-with': { name: 'BVN Update With Court Affidavit', amount: 7500, expectedProcessingTime: '5 working days' },
    'bvn-affidavit-without': { name: 'BVN Update Without Court Affidavit', amount: 9000, expectedProcessingTime: '5 working days' },
    
    // CAC Registration Services
    'cac-business-name': { name: 'Business Name Registration (CAC)', amount: 30000, expectedProcessingTime: '2 days' },
    'cac-private-limited': { name: 'Private Limited Registration (CAC)', amount: 65000, expectedProcessingTime: '2 days' },
    'cac-public-limited': { name: 'Public Limited Registration (CAC)', amount: 120000, expectedProcessingTime: '2 days' },
    'cac-ngo': { name: 'Incorporated Trustee / NGO (CAC)', amount: 85000, expectedProcessingTime: '2 days' },
};

/**
 * Returns the configuration for a specific assisted service type.
 * @param {string} serviceType - The service identifier (e.g., 'nin-name-modification')
 * @returns {Object|null} The configuration object or null if not found.
 */
export const getAssistedServiceConfig = (serviceType) => {
    return ASSISTED_SERVICES_CONFIG[serviceType] || null;
};
