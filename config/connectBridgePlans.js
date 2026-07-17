/**
 * Local Data Plans for ConnectBridge (Premium Option)
 * Since ConnectBridge does not have a public endpoint to fetch plans, 
 * we store them here and map them to our internal IDs.
 */

export const CONNECTBRIDGE_PLANS = {
    "MTN": [
        { plan_code: "1817", label: "MTN SME 500MB (Premium)", amount: 150, validity: "30 Days" },
        { plan_code: "1818", label: "MTN SME 1GB (Premium)", amount: 260, validity: "30 Days" },
        { plan_code: "1819", label: "MTN SME 2GB (Premium)", amount: 520, validity: "30 Days" },
        { plan_code: "1820", label: "MTN SME 3GB (Premium)", amount: 780, validity: "30 Days" },
        { plan_code: "1821", label: "MTN SME 5GB (Premium)", amount: 1300, validity: "30 Days" },
        { plan_code: "1777", label: "MTN SME 10GB (Premium)", amount: 2600, validity: "30 Days" }
    ],
    "GLO": [
        { plan_code: "1822", label: "GLO 1.05GB (Premium)", amount: 450, validity: "30 Days" }
    ],
    "AIRTEL": [
        { plan_code: "1823", label: "Airtel 1.5GB (Premium)", amount: 500, validity: "30 Days" }
    ],
    "9MOBILE": [
        { plan_code: "1824", label: "9mobile 1.5GB (Premium)", amount: 600, validity: "30 Days" }
    ]
};

export const getConnectBridgePlansForNetwork = (network) => {
    const net = network.toUpperCase();
    return CONNECTBRIDGE_PLANS[net] || [];
};
