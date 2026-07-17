export const getCleanStatus = (rawStatus) => {
    if (!rawStatus) return 'pending';
    const status = String(rawStatus).toLowerCase();
    
    // Explicit exact matches first
    if (status === 'success' || status === 'successful') return 'success';
    if (status === 'failed') return 'failed';
    if (status === 'pending' || status === 'processing') return 'pending';

    // Fuzzy matching for backend errors
    if (status.includes('success')) return 'success';
    
    if (
        status.includes('fail') || 
        status.includes('offline') || 
        status.includes('invalid') || 
        status.includes('error') ||
        status.includes('insufficient') ||
        status.includes('decline')
    ) {
        return 'failed';
    }

    if (
        status.includes('timeout') || 
        status.includes('awaiting') || 
        status.includes('processing') || 
        status.includes('queue')
    ) {
        return 'pending';
    }

    // Default to pending for unknown statuses
    return 'pending';
};

export const getCleanStatusText = (cleanStatus) => {
    if (cleanStatus === 'success') return 'Successful';
    if (cleanStatus === 'failed') return 'Failed';
    return 'Processing';
};
