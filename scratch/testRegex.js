const cleanPlanName = (name) => {
    if (!name) return '';
    return name
        // Strip prices like ₦220, - N500, (N150), = #200
        .replace(/(?:[-=@]?\s*\(?(?:₦|NGN|#)\s*\d+(?:,\d{3})*(?:\.\d+)?\)?|\bN\s*\d+(?:,\d{3})*(?:\.\d+)?\b)/gi, '')
        // Clean up trailing dashes or spaces
        .replace(/\s+-\s*$/, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
};

const testCases = [
    "MTN 1GB ₦220",
    "Airtel 2GB - N500",
    "GLO 500MB (N150)",
    "9Mobile 1.5GB @ #200",
    "MTN 1GB",
    "Airtel NGN 500",
    "Airtel 2GB - NGN500",
    "MTN 1GB - ₦ 230"
];

testCases.forEach(t => console.log(`${t} -> ${cleanPlanName(t)}`));
