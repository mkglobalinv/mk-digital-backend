import os from 'os';
import logger from './loggerService.js';

const cleanups = [];
let monitorInterval = null;

export const registerCleanup = (name, cleanupFn) => {
    cleanups.push({ name, cleanupFn });
    logger.info(`[MemoryProtection] Registered cache cleanup for: ${name}`);
};

export const startMemoryMonitor = () => {
    if (monitorInterval) return;

    logger.info('[MemoryProtection] Initializing System Resource & Memory Protection Service');

    monitorInterval = setInterval(() => {
        try {
            // Process Memory
            const processMem = process.memoryUsage();
            const heapUsedMb = (processMem.heapUsed / (1024 * 1024)).toFixed(1);
            const heapTotalMb = (processMem.heapTotal / (1024 * 1024)).toFixed(1);
            const rssMb = (processMem.rss / (1024 * 1024)).toFixed(1);
            const heapUsedPct = (processMem.heapUsed / processMem.heapTotal) * 100;

            // System Memory
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const systemUsedPct = ((totalMem - freeMem) / totalMem) * 100;

            logger.info(`[MemoryProtection] RAM telemetry: Process Heap: ${heapUsedMb}MB / ${heapTotalMb}MB (${heapUsedPct.toFixed(1)}%), RSS: ${rssMb}MB | System RAM: ${systemUsedPct.toFixed(1)}%`);

            // If heap usage or system RAM usage exceeds 85%
            if (heapUsedPct > 85 || systemUsedPct > 85) {
                logger.warn(`[MemoryProtection] CRITICAL: High memory usage detected (Heap: ${heapUsedPct.toFixed(1)}%, System RAM: ${systemUsedPct.toFixed(1)}%). Executing recovery protocols...`);

                // 1. Purge all registered caches
                cleanups.forEach(({ name, cleanupFn }) => {
                    try {
                        logger.info(`[MemoryProtection] Recovering memory: Purging cache '${name}'`);
                        cleanupFn();
                    } catch (err) {
                        logger.error(`[MemoryProtection] Error during cache cleanup for '${name}':`, err);
                    }
                });

                // 2. Trigger garbage collection if available
                if (global.gc) {
                    logger.warn('[MemoryProtection] Garbage collector is exposed. Triggering global.gc()');
                    global.gc();
                    const postGcMem = process.memoryUsage();
                    const postGcHeapMb = (postGcMem.heapUsed / (1024 * 1024)).toFixed(1);
                    logger.info(`[MemoryProtection] Post-GC Heap usage: ${postGcHeapMb}MB`);
                } else {
                    logger.warn('[MemoryProtection] Garbage collector is not exposed (run node with --expose-gc to enable manual GC)');
                }
            }
        } catch (err) {
            logger.error('[MemoryProtection] Monitor execution failed:', err);
        }
    }, 30000); // Check every 30 seconds
};

export const stopMemoryMonitor = () => {
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
        logger.info('[MemoryProtection] Memory monitor stopped.');
    }
};
