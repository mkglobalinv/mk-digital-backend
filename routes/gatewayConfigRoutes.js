import express from 'express';
import { adminAuth } from '../middlewares/adminAuth.js';
import { 
    getGateways, 
    updateGateway, 
    toggleGateway, 
    testGatewayConnection 
} from '../controllers/gatewayConfigController.js';

const router = express.Router();

// Require super admin for all gateway config operations
const requireSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Access Denied: Super Admin Required" });
    }
};

router.use(adminAuth, requireSuperAdmin);

router.get('/', getGateways);
router.post('/:provider', updateGateway);
router.post('/:provider/toggle', toggleGateway);
router.post('/:provider/test', testGatewayConnection);

export default router;
