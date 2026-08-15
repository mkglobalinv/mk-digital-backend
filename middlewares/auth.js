import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';
import dotenv from 'dotenv';

dotenv.config();

export const auth = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: "No token" });
    }
    if (token.startsWith("Bearer ") || token.startsWith("Token ")) token = token.split(" ")[1];
    
    const secret = process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium";
    const verified = jwt.verify(token, secret);
    
    const session = await Session.findOne({ token, userId: verified.id, isValid: true });
    if (!session) {
        return res.status(401).json({ message: "Session expired." });
    }

    const user = await User.findById(verified.id);
    if (!user) {
        return res.status(401).json({ message: "User not found." });
    }

    if (user.isSuspended) {
        return res.status(403).json({ message: "Account suspended." });
    }
    
    if (user.role === 'reseller_admin') {
        const blockedStatuses = ['suspended', 'disabled', 'under_review'];
        if (blockedStatuses.includes(user.whiteLabelStatus)) {
            return res.status(403).json({ message: `Your reseller platform is currently ${user.whiteLabelStatus}. Access denied.` });
        }
    }
    
    if (req.reseller) {
        req.user = new Proxy(user, {
            get(target, prop, receiver) {
                if (prop === 'role') return 'user';
                const value = Reflect.get(target, prop, receiver);
                if (typeof value === 'function') {
                    return value.bind(target);
                }
                return value;
            },
            set(target, prop, value, receiver) {
                return Reflect.set(target, prop, value, receiver);
            }
        });
        req.session_type = 'retail';
    } else {
        req.user = user;
        req.session_type = verified.session_type || 'retail';
    }
    next();
  } catch (err) { 
    res.status(401).json({ message: "Invalid token" }); 
  }
};

export const restrictToRetailSession = (req, res, next) => {
  if (req.user.role !== 'admin' && req.session_type !== 'retail') {
    return res.status(403).json({ message: "Access Denied: Retail Session Required." });
  }
  next();
};

export const restrictToBusinessSession = (req, res, next) => {
  if (req.user.role !== 'admin' && req.session_type !== 'business') {
    return res.status(403).json({ message: "Your website administration session has expired. Please sign in again to continue managing your website." });
  }
  next();
};

export const restrictWhiteLabelCustomer = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        // If user is a customer of a white-label site (has referredBy and not the main domain)
        // OR if the host is a white-label domain, they shouldn't access developer features.
        const isResellerDomain = req.reseller ? true : false;
        
        if (isResellerDomain && user.role !== 'reseller_admin' && user.role !== 'admin') {
            return res.status(403).json({ 
                message: "Access Denied: End-users on white-label sites cannot access developer or reseller tools." 
            });
        }
        
        next();
    } catch (err) {
        res.status(500).json({ message: "Security check failed" });
    }
};
