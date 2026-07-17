import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';
import dotenv from 'dotenv';

dotenv.config();

export const superAdminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;
    
    if (!token) {
      console.log("[SuperAdminAuth] No token provided in headers or query");
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const secret = process.env.JWT_SECRET || 'mk_sub_data_secret_2024_premium';
    const decoded = jwt.verify(token, secret);
    
    // Security Requirement: Never reuse old/invalidated sessions
    const session = await Session.findOne({ token, userId: decoded.id, isValid: true });
    if (!session) {
      console.log("[SuperAdminAuth] Session missing or marked invalid for token");
      return res.status(401).json({ message: 'Session expired or invalidated. Please login again.' });
    }
    
    console.log(`[SuperAdminAuth] Decoded ID: ${decoded.id}`);

    const user = await User.findOne({ _id: decoded.id, role: 'superadmin' });

    if (!user) {
      console.log(`[SuperAdminAuth] User not found or not a superadmin: ${decoded.id}`);
      return res.status(403).json({ message: 'Access denied. Super Admin privileges required.' });
    }

    if (user.isSuspended) {
      console.log(`[SuperAdminAuth] Super admin account suspended: ${user.email}`);
      return res.status(403).json({ message: 'Your super admin account has been suspended.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error("[SuperAdminAuth] Token verification failed:", err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
