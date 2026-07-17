import backgroundQueue from './backgroundQueue.js';

class AuditLogService {
    /**
     * Log an admin action to the audit logs asynchronously
     * @param {Object} req - The express request object (optional, for fetching IP/UserAgent)
     * @param {string} action - Descriptive action name (e.g., 'Credit User Wallet')
     * @param {string} actionType - Enumerated action type category
     * @param {string} userId - Target user ID affected by action
     * @param {any} previousValue - State before modification
     * @param {any} newValue - State after modification
     * @param {Object} details - Additional metadata dictionary
     */
    logAdminAction(req, action, actionType, userId, previousValue, newValue, details = {}) {
        const adminId = req?.user?.id || req?.user?._id || null;
        const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip) : 'system';
        const userAgent = req ? (req.headers['user-agent'] || 'Unknown') : 'System Loop';

        backgroundQueue.push('AUDIT_LOG', {
            adminId,
            action,
            actionType,
            userId,
            previousValue,
            newValue,
            details,
            ipAddress,
            userAgent,
            createdAt: new Date()
        });
        
        console.log(`[AuditLog] Logged admin action: ${action} for user ${userId || 'none'}`);
    }
}

export default new AuditLogService();
