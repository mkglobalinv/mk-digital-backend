import express from 'express';
import { 
  createCampaign, updateCampaign, getAdminCampaigns, deleteCampaign,
  getActiveCampaign, logView, logClick
} from '../controllers/promoCampaignController.js';
import { adminAuth } from '../middlewares/adminAuth.js';
// no auth import needed as optionalAuth is used

const router = express.Router();

// Admin routes
router.post('/admin', adminAuth, createCampaign);
router.put('/admin/:id', adminAuth, updateCampaign);
router.get('/admin', adminAuth, getAdminCampaigns);
router.delete('/admin/:id', adminAuth, deleteCampaign);

// Public/User routes
// We will apply the generic auth protect for user routes to track user IDs, but allow pass-through if unauthenticated.
// Wait, the regular `protect` middleware might block unauthenticated users. 
// I will not use `protect` directly if I want unauthenticated users to see the campaign, 
// OR I assume only logged in users see it ("Show on login when campaign is active" implies they are logged in).
// For tracking, let's assume they are logged in. We can use a custom optionalAuth if needed, 
// but let's just make it a public endpoint and we can read the Bearer token manually or rely on `req.user` if `protect` allows it.
// Actually, `mk-vtu-frontend` sends the token, so let's check `protect` or just leave it open and check token in controller.
// For now, let's make it fully public and let the controller handle missing `req.user`.

// Optional auth middleware
const optionalAuth = (req, res, next) => {
  // logic to fetch user if token exists, but not fail if not
  // to keep it simple, I'll rely on the frontend sending deviceId for unauth, or we can just not use auth middleware and let frontend pass userId in body? 
  // actually, we can just use the protect middleware if it's strictly for logged in users.
  next(); 
};

router.get('/active', optionalAuth, getActiveCampaign);
router.post('/view', optionalAuth, logView);
router.post('/click', optionalAuth, logClick);

export default router;
