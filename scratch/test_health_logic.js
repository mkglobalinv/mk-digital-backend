const calculateHealthScore = (telemetry) => {
    let score = 100;
    const cpu = telemetry.system?.cpu || 10;
    if (cpu > 80) score -= 20;
    else if (cpu > 50) score -= 10;

    const mem = telemetry.system?.memory || 64;
    if (mem > 85) score -= 15;
    else if (mem > 70) score -= 5;

    if (!telemetry.database?.connected) score -= 50;

    if (telemetry.backup?.lastStatus && telemetry.backup.lastStatus !== 'success') score -= 10;

    const latency = telemetry.latency || 142;
    if (latency > 500) score -= 10;
    else if (latency > 250) score -= 5;

    const errorRate = telemetry.errorRate || 0.02;
    if (errorRate > 5) score -= 15;
    else if (errorRate > 1) score -= 5;

    if (score < 10) score = 10;
    return score;
};

// UI Classification equivalents (from AdminDashboard.jsx)
const getLatencyStatus = (val) => {
    if (val < 300) return 'Excellent';
    if (val <= 800) return 'Good';
    if (val <= 1500) return 'Warning';
    return 'Critical';
};

const getFailureRateStatus = (val) => {
    if (val <= 5) return 'Healthy';
    if (val <= 15) return 'Warning';
    return 'Critical';
};

const getMemoryStatus = (val) => {
    if (val < 70) return 'Healthy';
    if (val <= 85) return 'Warning';
    return 'High Usage';
};

console.log("=== UI CLASSIFICATION TESTS ===");
const latencyTests = [200, 500, 1200, 2500];
latencyTests.forEach(l => console.log(`Latency ${l}ms -> ${getLatencyStatus(l)}`));

const errorTests = [2, 10, 25];
errorTests.forEach(e => console.log(`Failure Rate ${e}% -> ${getFailureRateStatus(e)}`));

const memTests = [50, 75, 92];
memTests.forEach(m => console.log(`Memory ${m}% -> ${getMemoryStatus(m)}`));

console.log("\n=== HEALTH SCORE DYNAMICS TESTS ===");
const baseTelemetry = {
    system: { cpu: 10, memory: 50 },
    database: { connected: true },
    backup: { lastStatus: 'success' },
    latency: 100,
    errorRate: 0.5
};

console.log("Base Health:", calculateHealthScore(baseTelemetry));

const tests = [
    { name: "High CPU (85%)", mod: { system: { cpu: 85, memory: 50 } } },
    { name: "High Memory (92%)", mod: { system: { cpu: 10, memory: 92 } } },
    { name: "High Latency (1200ms)", mod: { latency: 1200 } },
    { name: "High Error Rate (25%)", mod: { errorRate: 25 } },
    { name: "Database Offline", mod: { database: { connected: false } } },
    { name: "Backup Failed", mod: { backup: { lastStatus: 'failed' } } },
    { name: "Multiple Failures", mod: { database: { connected: false }, backup: { lastStatus: 'failed' }, system: { cpu: 90, memory: 90 }, latency: 2000, errorRate: 50 } }
];

tests.forEach(t => {
    const combined = { ...baseTelemetry, ...t.mod };
    // deep merge system if needed
    if (t.mod.system) combined.system = { ...baseTelemetry.system, ...t.mod.system };
    if (t.mod.database) combined.database = { ...baseTelemetry.database, ...t.mod.database };
    if (t.mod.backup) combined.backup = { ...baseTelemetry.backup, ...t.mod.backup };
    console.log(`${t.name} -> Score: ${calculateHealthScore(combined)}`);
});
