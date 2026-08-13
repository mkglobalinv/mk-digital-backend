import { buyAirtimeWithClubkonnect, buyDataWithClubkonnect, fetchDataPlansFromClubkonnect, buyElectricityWithClubkonnect, buyCableTVWithClubkonnect } from "./providers/clubkonnect.js";
import { buyAirtimeWithReloadly, buyDataWithReloadly } from "./providers/reloadly.js";
import { buyAirtimeWithPeyflex, buyDataWithPeyflex, buyElectricityWithPeyflex, buyCableTVWithPeyflex, buyEducationWithPeyflex } from "./providers/peyflexV2.js";
import {
    verifyNINWithBillsplash,
    verifyBVNWithBillsplash,
    verifyNINByPhoneWithBillsplash,
    verifyNINByDemographicsWithBillsplash
} from "./providers/billsplash.js";
import ProviderStatus from "../models/ProviderStatus.js";
import DataPlan from "../models/DataPlan.js";
import { handleProviderTransactionSuccess, handleProviderTransactionFailure } from "./providerMonitoringService.js";
import { fetchDataPlansFromPeyflex } from "./providers/peyflex.js"; 

const dataPlanCache = { smart: {}, value: {} };
const CACHE_TTL = 5 * 60 * 1000;

export const smartBuyAirtime = async (network, amount, phone, countryCode = 'NG', operatorId = null, option = 'smart') => {
    const startTime = Date.now();
    const transactionId = 'TXN-' + Date.now();
    console.log(`[Switcher] [${transactionId}] Attempting Airtime via ${option.toUpperCase()} for ${phone}...`);

    const pName = option === 'value' ? 'clubkonnect' : 'peyflex';
    
    try {
        const pStatus = await ProviderStatus.findOne({ providerName: pName });
        const primaryOffline = pStatus && (!pStatus.isAvailable || pStatus.apiStatus === 'disconnected' || pStatus.isUnderMaintenance);

        let result;
        let finalProvider = pName;

        if (primaryOffline) {
            const secondaryName = pName === 'clubkonnect' ? 'peyflex' : 'clubkonnect';
            const secStatus = await ProviderStatus.findOne({ providerName: secondaryName });
            const secondaryOffline = secStatus && (!secStatus.isAvailable || secStatus.apiStatus === 'disconnected' || secStatus.isUnderMaintenance);

            if (secondaryOffline) {
                const msg = `Both primary (${pName}) and failover (${secondaryName}) providers are offline.`;
                console.warn(`[Switcher] [${transactionId}] ${msg}`);
                return { status: "failed", message: msg };
            }

            console.log(`[Switcher] [${transactionId}] Primary provider ${pName} is offline. Routing directly to failover: ${secondaryName}`);
            finalProvider = secondaryName;
            if (secondaryName === 'clubkonnect') {
                result = await buyAirtimeWithClubkonnect(network, amount, phone);
            } else {
                result = await buyAirtimeWithPeyflex(network, amount, phone);
            }
        } else {
            console.log(`[Switcher] [${transactionId}] Primary provider attempt: ${pName}`);
            if (pName === 'clubkonnect') {
                result = await buyAirtimeWithClubkonnect(network, amount, phone);
                if (result && result.status === "failed") {
                    const reason = result.message || "Unknown Provider Error";
                    console.log(`[Switcher] [${transactionId}] ${pName} failed. Reason: ${reason}. Secondary provider attempt: peyflex...`);
                    result = await buyAirtimeWithPeyflex(network, amount, phone);
                    finalProvider = 'peyflex';
                }
            } else {
                result = await buyAirtimeWithPeyflex(network, amount, phone);
                if (result && result.status === "failed") {
                    const reason = result.message || "Unknown Provider Error";
                    console.log(`[Switcher] [${transactionId}] ${pName} failed. Reason: ${reason}. Secondary provider attempt: clubkonnect...`);
                    result = await buyAirtimeWithClubkonnect(network, amount, phone);
                    finalProvider = 'clubkonnect';
                }
            }
        }

        const duration = Date.now() - startTime;
        console.log(`[Switcher] [${transactionId}] Final provider selected: ${finalProvider} | Request duration: ${duration}ms`);

        if (result && result.status === "success") {
            await handleProviderTransactionSuccess(finalProvider);
            return { status: "success", provider_used: finalProvider, reference: result.reference, data: result.data };
        }
        if (result && result.status === "unknown") {
            return { status: "unknown", provider_used: finalProvider, reference: result.reference, message: result.message };
        }
        
        const errMessage = result ? result.message : 'Unknown error';
        await handleProviderTransactionFailure(finalProvider, errMessage);
        return { status: "failed", message: errMessage };
    } catch (err) {
        const duration = Date.now() - startTime;
        console.log(`[Switcher] [${transactionId}] Unhandled Error | Request duration: ${duration}ms`);
        await handleProviderTransactionFailure(pName, err.message);
        return { status: "failed", message: err.message };
    }
};

export const smartBuyData = async (network, dataPlan, phone, userPaymentAmount, countryCode = 'NG', operatorId = null, networkId = null, option = 'smart', category = null) => {
    const startTime = Date.now();
    const transactionId = 'TXN-' + Date.now();
    console.log(`[Switcher] [${transactionId}] Purchasing Data | Plan: ${dataPlan} | Category: ${category}`);
    
    try {
        const planRecord = await DataPlan.findOne({ api_plan_id: String(dataPlan) });
        if (!planRecord) return { status: "failed", message: `Data plan ${dataPlan} not found.` };
        
        // Ensure provider doesn't fallback to legacy decommissioned provider
        const pName = planRecord.provider === 'billsplash' ? 'clubkonnect' : planRecord.provider;
        const pStatus = await ProviderStatus.findOne({ providerName: pName });
        const primaryOffline = pStatus && (!pStatus.isAvailable || pStatus.apiStatus === 'disconnected' || pStatus.isUnderMaintenance);

        let result;
        let finalProvider = pName;

        if (primaryOffline) {
            const secondaryName = pName === 'clubkonnect' ? 'peyflex' : 'clubkonnect';
            const secStatus = await ProviderStatus.findOne({ providerName: secondaryName });
            const secondaryOffline = secStatus && (!secStatus.isAvailable || secStatus.apiStatus === 'disconnected' || secStatus.isUnderMaintenance);

            if (secondaryOffline) {
                return { status: "failed", message: `Both primary (${pName}) and failover (${secondaryName}) providers are offline.` };
            }

            console.log(`[Switcher] [${transactionId}] Primary provider ${pName} is offline. Routing directly to failover: ${secondaryName}`);
            finalProvider = secondaryName;
            if (secondaryName === 'clubkonnect') {
                result = await buyDataWithClubkonnect(networkId || network, dataPlan, phone);
            } else {
                result = await buyDataWithPeyflex(networkId || network, dataPlan, phone, category);
            }
        } else {
            console.log(`[Switcher] [${transactionId}] Primary provider attempt: ${pName}`);
            if (pName === 'clubkonnect') {
                result = await buyDataWithClubkonnect(networkId || network, dataPlan, phone);
                if (result && result.status === "failed") {
                    const reason = result.message || "Unknown Provider Error";
                    console.log(`[Switcher] [${transactionId}] ${pName} failed. Reason: ${reason}. Secondary provider attempt: peyflex...`);
                    result = await buyDataWithPeyflex(networkId || network, dataPlan, phone, category);
                    finalProvider = 'peyflex';
                }
            } else {
                result = await buyDataWithPeyflex(networkId || network, dataPlan, phone, category);
                if (result && result.status === "failed") {
                    const reason = result.message || "Unknown Provider Error";
                    console.log(`[Switcher] [${transactionId}] ${pName} failed. Reason: ${reason}. Secondary provider attempt: clubkonnect...`);
                    result = await buyDataWithClubkonnect(networkId || network, dataPlan, phone);
                    finalProvider = 'clubkonnect';
                }
            }
        }

        const duration = Date.now() - startTime;
        console.log(`[Switcher] [${transactionId}] Final provider selected: ${finalProvider} | Request duration: ${duration}ms`);

        if (result && (result.success || result.status === "success")) {
            await handleProviderTransactionSuccess(finalProvider);
            return { status: "success", provider_used: finalProvider, reference: result.reference, data: result.data };
        }
        if (result && result.status === "unknown") return { status: "unknown", provider_used: finalProvider, reference: result.reference };
        
        const errMessage = result ? result.message : 'No result returned';
        await handleProviderTransactionFailure(finalProvider, errMessage);
        return { status: "failed", message: errMessage };
    } catch (err) {
        const duration = Date.now() - startTime;
        console.log(`[Switcher] [${transactionId}] Unhandled Error | Request duration: ${duration}ms`);
        return { status: "failed", message: err.message };
    }
};

export const smartBuyElectricity = async (discoId, meterType, meterNumber, amount, phone, option = 'smart') => {
    const pName = option === 'value' ? 'clubkonnect' : 'peyflex';
    try {
        let result;
        if (pName === 'clubkonnect') {
            result = await buyElectricityWithClubkonnect(discoId, meterType, meterNumber, amount, phone);
            if (result && result.status === "failed") {
                console.log(`[Switcher] ${pName} failed. Failing over to peyflex...`);
                result = await buyElectricityWithPeyflex(discoId, meterType, meterNumber, amount, phone);
            }
        } else {
            result = await buyElectricityWithPeyflex(discoId, meterType, meterNumber, amount, phone);
            if (result && result.status === "failed") {
                console.log(`[Switcher] ${pName} failed. Failing over to clubkonnect...`);
                result = await buyElectricityWithClubkonnect(discoId, meterType, meterNumber, amount, phone);
            }
        }
        return result;
    } catch (err) { return { status: "failed", message: err.message }; }
};

export const smartBuyCableTV = async (cableId, packageId, smartcard, phone, option = 'smart') => {
    const pName = option === 'value' ? 'clubkonnect' : 'peyflex';
    try {
        let result;
        if (pName === 'clubkonnect') {
            result = await buyCableTVWithClubkonnect(cableId, packageId, smartcard, phone);
            if (result && result.status === "failed") {
                console.log(`[Switcher] ${pName} failed. Failing over to peyflex...`);
                result = await buyCableTVWithPeyflex(cableId, packageId, smartcard, phone);
            }
        } else {
            result = await buyCableTVWithPeyflex(cableId, packageId, smartcard, phone);
            if (result && result.status === "failed") {
                console.log(`[Switcher] ${pName} failed. Failing over to clubkonnect...`);
                result = await buyCableTVWithClubkonnect(cableId, packageId, smartcard, phone);
            }
        }
        return result;
    } catch (err) { return { status: "failed", message: err.message }; }
};

export const smartBuyEducation = async (examType, phone, option = 'smart') => {
    const transactionId = 'TXN-' + Date.now();
    console.log(`[Switcher] [${transactionId}] Education: ${examType} via Peyflex`);

    try {
        // Force Peyflex for Education as per Phase 4 Migration
        const result = await buyEducationWithPeyflex(examType, phone);
        return result;
    } catch (err) { 
        return { status: "failed", message: err.message }; 
    }
};

export const smartFetchDataPlans = async (network, option = 'smart') => {
    const identifiersMap = {
        'MTN': ['mtn_gifting_data', 'mtn_data_share', 'mtn_sme_data', 'mtn_corporate_data', 'mtn_smart_sme_data'],
        'GLO': ['glo_data', 'glo_sme_data', 'glo_gifting_data', 'glo_corporate_data'],
        'AIRTEL': ['airtel_data', 'airtel_sme_data', 'airtel_gifting_data', 'airtel_corporate_data'],
        '9MOBILE': ['9mobile_data', '9mobile_sme_data', '9mobile_gifting_data', '9mobile_corporate_data']
    };
    const identifiers = identifiersMap[network.toUpperCase()] || [network.toLowerCase()];
    
    const cacheKey = network.toUpperCase();
    const now = Date.now();
    if (dataPlanCache[option] && dataPlanCache[option][cacheKey]) {
        if (now - dataPlanCache[option][cacheKey].timestamp < CACHE_TTL) return dataPlanCache[option][cacheKey].data;
    }

    let allPlans = [];
    if (option === 'value') {
        try {
            const result = await fetchDataPlansFromClubkonnect(network);
            if (result && result.success && result.plans) allPlans = result.plans;
        } catch (e) { }
    } else {
        for (const id of identifiers) {
            try {
                const result = await fetchDataPlansFromPeyflex(id);
                if (result && result.success && result.plans) {
                    const normalized = result.plans.map(p => ({
                        ...p, provider: 'peyflex', plan_id: p.plan_code || p.plan_id, plan_code: p.plan_code || p.plan_id,
                        name: p.name || p.plan_name, price: p.price || p.amount, label: p.label || `${p.name || p.plan_name} - ₦${p.price || p.amount}`
                    }));
                    allPlans = [...allPlans, ...normalized];
                }
            } catch (e) { }
        }
    }
 
    if (allPlans.length > 0) {
        allPlans = allPlans.map(p => ({
            ...p, plan_code: p.plan_code || p.plan_id, name: p.name || p.plan_name, price: p.price || p.amount, label: p.label || `${p.name || p.plan_name} - ₦${p.price || p.amount}`
        }));
        const seen = new Set();
        allPlans = allPlans.filter(p => { const id = String(p.plan_id); const dup = seen.has(id); seen.add(id); return !dup; });

        if (!dataPlanCache[option]) dataPlanCache[option] = {};
        dataPlanCache[option][cacheKey] = { timestamp: now, data: allPlans };
        return allPlans;
    }
    throw new Error(`No data plans available for this network on the ${option} option.`);
};

/**
 * Route identity verification requests to Billsplash.
 * Identity services do not failover to VTU providers.
 */
export const smartBuyIdentity = async (service, params, provider = 'billsplash') => {
    const transactionId = 'TXN-' + Date.now();
    console.log(`[Switcher] [${transactionId}] Identity service: ${service} via ${provider}`);

    try {
        const payload = { ...params, consent: true };

        switch (service) {
            case 'nin-verify':
            case 'nin':
                return await verifyNINWithBillsplash(payload.nin);
            case 'bvn-verify':
            case 'bvn':
                return await verifyBVNWithBillsplash(payload.bvn);
            case 'nin-phone':
                return await verifyNINByPhoneWithBillsplash(payload.phone);
            case 'nin-demographics':
                return await verifyNINByDemographicsWithBillsplash({
                    firstname: payload.firstname, 
                    lastname: payload.lastname, 
                    gender: payload.gender, 
                    dob: payload.dob
                });
            case 'nin-tracking':
            case 'bvn-phone':
            case 'nin-modification':
                return { status: 'failed', message: `${service} is not currently supported by Billsplash.` };
            default:
                return { status: 'failed', message: `Unknown identity service: ${service}` };
        }
    } catch (err) {
        console.error(`[Switcher] [${transactionId}] Identity service error:`, err.message);
        return { status: 'failed', message: err.message };
    }
};
