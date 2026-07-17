import User from '../models/User.js';
import crypto from 'crypto';

export const apiAuth = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const apiSecret = req.headers['x-api-secret'];

        if (!apiKey || !apiSecret) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Unauthorized: Missing API Key or Secret' 
            });
        }

        let user = await User.findOne({ apiKey });
        let isSandbox = false;

        if (!user) {
            user = await User.findOne({ testApiKey: apiKey });
            if (user) isSandbox = true;
        }

        if (!user) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Unauthorized: Invalid API Key' 
            });
        }

        // Validate Secret
        const secretToMatch = isSandbox ? user.testApiSecret : user.apiSecret;
        if (secretToMatch !== apiSecret) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Unauthorized: Invalid API Secret' 
            });
        }

        // HMAC Signature Verification (Optional but recommended for high security)
        const signature = req.headers['x-api-signature'];
        if (signature) {
            const payload = JSON.stringify(req.body);
            const expectedSignature = crypto.createHmac('sha256', secretToMatch).update(payload).digest('hex');
            if (expectedSignature !== signature) {
                return res.status(401).json({ 
                    status: 'error', 
                    message: 'Unauthorized: Invalid Request Signature' 
                });
            }
        }

        if (user.isSuspended) {
            return res.status(403).json({ 
                status: 'error', 
                message: 'Forbidden: Account suspended' 
            });
        }

        // IP Whitelisting
        const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (user.ipWhitelist && user.ipWhitelist.length > 0) {
            const isWhitelisted = user.ipWhitelist.some(ip => {
                return ip === clientIp || clientIp.includes(ip);
            });

            if (!isWhitelisted) {
                console.log(`[API Auth] IP Blocked: ${clientIp} for user ${user.email}`);
                return res.status(403).json({ 
                    status: 'error', 
                    message: `Forbidden: IP address ${clientIp} not whitelisted` 
                });
            }
        }

        req.isSandbox = isSandbox;
        req.user = user;
        next();
    } catch (err) {
        console.error('[API Auth Error]', err.message);
        res.status(500).json({ status: 'error', message: 'Internal server error during authentication' });
    }
};

export const generateApiCredentials = () => {
    const apiKey = 'mk_' + crypto.randomBytes(16).toString('hex');
    const apiSecret = 'sk_' + crypto.randomBytes(24).toString('hex');
    return { apiKey, apiSecret };
};
