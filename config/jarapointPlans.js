/**
 * Local Data Plans for Jarapoint (Value Option)
 * Since Jarapoint does not have a public endpoint to fetch plans, 
 * we store them here and map them to our internal IDs.
 */

export const JARAPOINT_PLANS = {
    "MTN": [
        { plan_code: "mtn_sme_1_weeks_500_mb", label: "MTN 500MB - 1 Week (₦150)", amount: 150, validity: "7 Days" },
        { plan_code: "mtn_sme_1_months_1_gb", label: "MTN 1GB - 1 Month (₦260)", amount: 260, validity: "30 Days" },
        { plan_code: "mtn_sme_1_months_2_gb", label: "MTN 2GB - 1 Month (₦520)", amount: 520, validity: "30 Days" },
        { plan_code: "mtn_sme_1_months_5_gb", label: "MTN 5GB - 1 Month (₦1300)", amount: 1300, validity: "30 Days" },
        { plan_code: "mtn_sme_1_months_10_gb", label: "MTN 10GB - 1 Month (₦2600)", amount: 2600, validity: "30 Days" }
    ],
    "GLO": [
        { plan_code: "glo_sme_1_months_500_mb", label: "GLO 500MB - 1 Month (₦200)", amount: 200, validity: "30 Days" },
        { plan_code: "glo_sme_1_months_1_gb", label: "GLO 1GB - 1 Month (₦450)", amount: 450, validity: "30 Days" },
        { plan_code: "glo_sme_1_months_2_gb", label: "GLO 2GB - 1 Month (₦900)", amount: 900, validity: "30 Days" }
    ],
    "AIRTEL": [
        { plan_code: "airtel_sme_1_weeks_500_mb", label: "Airtel 500MB - 1 Week (₦250)", amount: 250, validity: "7 Days" },
        { plan_code: "airtel_sme_1_weeks_1_gb", label: "Airtel 1GB - 1 Week (₦500)", amount: 500, validity: "7 Days" },
        { plan_code: "airtel_sme_1_months_2_gb", label: "Airtel 2GB - 1 Month (₦1000)", amount: 1000, validity: "30 Days" }
    ],
    "9MOBILE": [
        { plan_code: "9mobile_sme_1_months_500_mb", label: "9mobile 500MB - 1 Month (₦300)", amount: 300, validity: "30 Days" },
        { plan_code: "9mobile_sme_1_months_1_gb", label: "9mobile 1GB - 1 Month (₦600)", amount: 600, validity: "30 Days" }
    ]
};

export const getJarapointPlansForNetwork = (network) => {
    const net = network.toUpperCase();
    return JARAPOINT_PLANS[net] || [];
};
