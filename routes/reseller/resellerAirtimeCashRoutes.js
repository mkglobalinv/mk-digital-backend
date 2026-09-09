import express from 'express';
import { auth, restrictToBusinessSession } from '../../middlewares/auth.js';
import { restrictToBasicOrPremium } from '../../middlewares/tierMiddleware.js';
import { getOwnPricing, listOwnTenantTransactions } from '../../controllers/resellerAirtimeCashController.js';

const router = express.Router();

// Audit fix (Phase 2.1): the previous guard checked req.user.role directly, which
// middlewares/auth.js's Proxy always reports as 'user' whenever req.reseller is set
// -- i.e. on every request that lands on a reseller subdomain, including the
// reseller_admin's own. That masked the reseller_admin out of their own endpoints.
//
// restrictToBusinessSession is the mechanism the rest of the app already uses to
// tell "this is the reseller_admin managing their own site" apart from "this is a
// customer/visitor on the reseller's storefront" (see routes/resellerRoutes.js,
// which uses the identical auth + restrictToBusinessSession + restrictToBasicOrPremium
// combination for the reseller's own console routes). A business session's
// session_type is only ever 'business' when req.reseller was NOT set for that
// request (auth.js forces session_type to 'retail' whenever req.reseller is set,
// regardless of who is authenticated) -- so by the time restrictToBasicOrPremium's
// req.user.role check runs, req.user is guaranteed to be the real (non-Proxied)
// user object, and the role check is trustworthy.
router.use(auth);
router.use(restrictToBusinessSession);
router.use(restrictToBasicOrPremium);

router.get('/pricing', getOwnPricing);
router.get('/transactions', listOwnTenantTransactions);

export default router;
