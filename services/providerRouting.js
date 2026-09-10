import DataPlan from "../models/DataPlan.js";
import ProviderCategory from "../models/ProviderCategory.js";

// ============================================================================
// Service+network provider routing, built entirely on top of the EXISTING
// ProviderCategory visibility mechanism (models/ProviderCategory.js,
// controllers/dataCategoryController.js) -- the same one that already gates
// which provider's data plans customers see per network+category (see
// server.js's GET /api/vtu/data-plans/:network, which already filters out
// any category whose ProviderCategory.visibility === 'HIDDEN').
//
// No new model, no new "current selection" record: the currently-effective
// provider for a network is DERIVED from which provider's categories are
// VISIBLE while every other provider's matching categories are HIDDEN. This
// is deliberately the minimal, non-duplicative approach -- a dedicated
// routing-config collection would just be a second source of truth for
// something ProviderCategory.visibility already fully determines at
// purchase-plan-listing time.
// ============================================================================

const DATA_NETWORKS = ["MTN", "AIRTEL", "GLO", "9MOBILE"];

// Ogdams is currently integrated for MTN data only (services/providers/ogdams.js,
// services/switcher.js's smartFetchDataPlans 'ogdams' branch). This is the
// single place that restriction is enforced for the admin-facing routing
// selection -- attempting to route any other service/network to Ogdams is
// rejected before any ProviderCategory row is ever touched.
function assertOgdamsAllowed(service, network) {
    if (service === "data" && network === "MTN") return;
    throw new Error(`Ogdams is not currently supported for ${service} + ${network}. Only DATA + MTN is available.`);
}

async function categoryNamesForNetwork(network) {
    const categories = await DataPlan.distinct("category", { network });
    return categories.map((c) => `${network} ${c || "Direct"}`);
}

async function providersForNetwork(network) {
    return DataPlan.distinct("provider", { network });
}

/**
 * The currently-effective data provider for a network, derived from
 * ProviderCategory state: a provider "owns" a network if every category that
 * network has plans for is VISIBLE for that provider AND HIDDEN for every
 * other provider with plans on that category. Returns null (not a guessed
 * provider name) when no single provider cleanly owns it -- e.g. the
 * pre-existing default state where multiple providers' plans are all
 * visible at once for a network.
 */
async function resolveDataProviderForNetwork(network) {
    const categoryNames = await categoryNamesForNetwork(network);
    const providers = await providersForNetwork(network);
    if (categoryNames.length === 0 || providers.length === 0) return { provider: null, providers };

    const rows = await ProviderCategory.find({ category_name: { $in: categoryNames.map((c) => new RegExp(`^${c}$`, "i")) } }).lean();

    for (const candidate of providers) {
        const ownsEveryCategory = categoryNames.every((catName) => {
            const row = rows.find((r) => r.category_name.toLowerCase() === catName.toLowerCase() && r.provider_name === candidate);
            const isVisible = row ? row.visibility === "VISIBLE" : true; // no row yet == default VISIBLE, matches ProviderCategory schema default
            if (!isVisible) return false;
            // every OTHER provider with plans in this exact category must be HIDDEN
            const otherProvidersHere = providers.filter((p) => p !== candidate);
            return otherProvidersHere.every((other) => {
                const otherRow = rows.find((r) => r.category_name.toLowerCase() === catName.toLowerCase() && r.provider_name === other);
                return otherRow ? otherRow.visibility === "HIDDEN" : false; // no row for the other provider == still default-visible == not cleanly excluded
            });
        });
        if (ownsEveryCategory) return { provider: candidate, providers };
    }
    return { provider: null, providers };
}

/**
 * GET-side summary for the admin Provider Manager: current effective
 * provider per DATA network (derived, see above), plus a fixed, read-only
 * note for AIRTIME -- there is no per-network airtime routing mechanism in
 * this codebase (services/switcher.js's smartBuyAirtime routes by `option`,
 * not by network, and Ogdams airtime is deliberately not wired in at all),
 * so airtime rows are informational only, not a live control.
 */
export async function getProviderRoutingSummary() {
    const data = [];
    for (const network of DATA_NETWORKS) {
        const { provider, providers } = await resolveDataProviderForNetwork(network);
        data.push({ service: "data", network, provider, availableProviders: providers });
    }
    const airtime = DATA_NETWORKS.map((network) => ({ service: "airtime", network, provider: "peyflex", fixed: true }));
    return { data, airtime };
}

/**
 * Sets the active data provider for one network: every category that
 * network has plans for becomes VISIBLE for `provider` and HIDDEN for every
 * other provider with plans in that same category. Auto-creates any missing
 * ProviderCategory row (mirrors controllers/dataCategoryController.js's
 * createCategory defaults) rather than requiring the admin to have already
 * visited "Manage Categories" for every provider first.
 *
 * Deliberately scoped to exactly one network at a time -- never touches
 * ProviderCategory rows for any other network, so selecting a provider for
 * MTN can never affect AIRTEL/GLO/9MOBILE visibility.
 */
export async function setDataProviderForNetwork(network, provider, adminId) {
    const net = String(network).toUpperCase();
    if (!DATA_NETWORKS.includes(net)) throw new Error(`Unsupported network: ${network}`);
    const providerLower = String(provider).toLowerCase();
    if (providerLower === "ogdams") assertOgdamsAllowed("data", net);

    const providers = await providersForNetwork(net);
    if (!providers.includes(providerLower)) {
        throw new Error(`Provider "${provider}" has no data plans for ${net} -- sync its plans first.`);
    }

    const categoryNames = await categoryNamesForNetwork(net);
    for (const catName of categoryNames) {
        for (const p of providers) {
            const visibility = p === providerLower ? "VISIBLE" : "HIDDEN";
            await ProviderCategory.findOneAndUpdate(
                { provider_name: p, category_name: catName },
                { $set: { visibility, updated_by: adminId }, $setOnInsert: { status: "ACTIVE" } },
                { upsert: true, setDefaultsOnInsert: true }
            );
        }
    }

    return resolveDataProviderForNetwork(net);
}

export { DATA_NETWORKS, resolveDataProviderForNetwork };
