import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';
import dotenv from 'dotenv';

dotenv.config();

export const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;
    
    if (!token) {
      console.log("[AdminAuth] No token provided in headers or query");
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const secret = process.env.JWT_SECRET || 'mk_sub_data_secret_2024_premium';
    const decoded = jwt.verify(token, secret);
    
    // Security Requirement: Never reuse old/invalidated sessions
    const session = await Session.findOne({ token, userId: decoded.id, isValid: true });
    if (!session) {
      console.log("[AdminAuth] Session missing or marked invalid for token");
      return res.status(401).json({ message: 'Session expired or invalidated. Please login again.' });
    }
    
    console.log(`[AdminAuth] Decoded ID: ${decoded.id}`);

    const user = await User.findOne({ _id: decoded.id, role: { $in: ['admin', 'superadmin', 'reseller_admin'] } });

    if (!user) {
      console.log(`[AdminAuth] User not found or not an admin: ${decoded.id}`);
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    if (user.role === 'reseller_admin') {
      // Security Requirement: The Admin Portal (this middleware) exposes
      // platform-admin-tier controls (transaction reversal, maintenance mode,
      // content CRUD, etc.) far beyond the reseller's own trial dashboard.
      // A reseller_admin must be a fully activated reseller to use it — a
      // pending/free-trial signup must not get Admin Portal access just by
      // holding the role. The trial dashboard itself (/api/reseller/*) does
      // not use this middleware and is unaffected by this check.
      if (user.resellerActivationStatus !== 'active') {
        console.log(`[AdminAuth] Denied: reseller_admin ${user.email} has resellerActivationStatus='${user.resellerActivationStatus}' (not active)`);
        return res.status(403).json({ message: 'Access denied. Your reseller account is not yet activated.' });
      }

      const host = req.header('Host') || '';
      const subdomain = host.split('.')[0];
      if (user.admin_subdomain !== subdomain) {
         console.log(`[AdminAuth] Reseller attempted to access admin portal via wrong subdomain: ${host}`);
         return res.status(403).json({ message: 'Access denied. Please use your designated Admin Portal.' });
      }
    }

    if (user.isSuspended) {
      console.log(`[AdminAuth] Admin account suspended: ${user.email}`);
      return res.status(403).json({ message: 'Your admin account has been suspended.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error("[AdminAuth] Token verification failed:", err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
