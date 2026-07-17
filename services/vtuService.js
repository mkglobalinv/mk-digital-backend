import axios from "axios";
import { smartBuyAirtime, smartBuyData, smartBuyElectricity, smartBuyCableTV } from "./switcher.js";
import { 
    buyEPINWithClubkonnect, 
    buyEducationWithClubkonnect 
} from "./providers/clubkonnect.js";

// Helper to generate unique request ID
const generateRequestId = () => {
    return 'ck_' + Date.now() + Math.floor(Math.random() * 10000);
};

export const buyAirtime = async (network, amount, phone, countryCode = 'NG', operatorId = null, option = 'smart') => {
    return await smartBuyAirtime(network, amount, phone, countryCode, operatorId, option);
};

// ========================
// ELECTRICITY BILL PAYMENT
// ========================
export const buyElectricity = async (discoId, meterType, meterNumber, amount, phone, option = 'smart') => {
    return await smartBuyElectricity(discoId, meterType, meterNumber, amount, phone, option);
};

// ========================
// RECHARGE CARD (EPIN)
// ========================
export const buyEPIN = async (network, value, quantity) => {
    const networkMap = { 'MTN': '01', 'GLO': '02', '9MOBILE': '03', 'AIRTEL': '04' };
    const networkCode = networkMap[network.toUpperCase()];
    if (!networkCode) throw new Error("Unsupported network provider");
    return await buyEPINWithClubkonnect(networkCode, value, quantity);
};

// ========================
// EDUCATION PIN (WAEC/JAMB)
// ========================
export const buyEducation = async (examType, phone) => {
    return await buyEducationWithClubkonnect(examType, phone);
};

// ========================
// DATA BUNDLE
// ========================
export const buyData = async (network, dataPlan, phone, amount, countryCode = 'NG', operatorId = null, networkId = null, option = 'smart', category = null) => {
    return await smartBuyData(network, dataPlan, phone, amount, countryCode, operatorId, networkId, option, category);
};

// ========================
// CABLE TV SUBSCRIPTION
// ========================
export const buyCableTV = async (cableId, packageId, smartcard, phone, option = 'smart') => {
    return await smartBuyCableTV(cableId, packageId, smartcard, phone, option);
};
