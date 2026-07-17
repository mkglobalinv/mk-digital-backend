import API from '../api';

const CACHE_KEY = 'vtu_data_plans_cache';
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes

/**
 * Smart Background Data Plan Preloading System
 */
class DataPlanCache {
    /**
     * Preload all data plans from backend
     */
    async preload() {
        try {
            console.log('[DataPlanCache] Starting background preload...');
            const res = await API.get('/api/vtu/data-plans/all');
            const plans = res.data || [];
            
            const cacheData = {
                plans,
                timestamp: Date.now()
            };
            
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
            console.log(`[DataPlanCache] Preloaded ${plans.length} plans successfully.`);
            return plans;
        } catch (err) {
            console.error('[DataPlanCache] Preload failed:', err.message);
            return null;
        }
    }

    /**
     * Get plans from cache
     * @returns {Array|null}
     */
    getPlans() {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;

        try {
            const cacheData = JSON.parse(raw);
            const now = Date.now();
            
            if (now - cacheData.timestamp > CACHE_EXPIRY) {
                console.log('[DataPlanCache] Cache expired.');
                // Trigger background refresh but return old data for instant UI
                this.preload();
            }
            
            return cacheData.plans;
        } catch (e) {
            return null;
        }
    }

    /**
     * Filter plans for specific network and option
     */
    getFilteredPlans(network, option = 'smart') {
        const allPlans = this.getPlans();
        if (!allPlans) return [];

        const provider = option === 'smart' ? 'peyflex' : 'clubkonnect';
        
        return allPlans.filter(p => 
            p.network.toUpperCase() === network.toUpperCase() && 
            p.provider.toLowerCase() === provider.toLowerCase()
        );
    }

    /**
     * Force refresh
     */
    async refresh() {
        return await this.preload();
    }

    /**
     * Clear cache (used for real-time pricing updates)
     */
    clear() {
        localStorage.removeItem(CACHE_KEY);
        console.log('[DataPlanCache] Cache cleared due to real-time update.');
    }
}

export const dataPlanCache = new DataPlanCache();
