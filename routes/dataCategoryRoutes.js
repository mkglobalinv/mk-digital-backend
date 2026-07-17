import express from 'express';
import { getProviderCategories, getPublicCategories, createCategory, updateCategory, toggleStatus, toggleVisibility, autoDetectCategories, deleteCategory } from '../controllers/dataCategoryController.js';
import { adminAuth } from '../middlewares/adminAuth.js';

const router = express.Router();

// Public routes (Customers fetching available categories)
router.get('/public', getPublicCategories);

// Admin routes
router.get('/admin/:providerName', adminAuth, getProviderCategories);
router.get('/admin/:providerName/auto-detect', adminAuth, autoDetectCategories);
router.post('/admin', adminAuth, createCategory);
router.put('/admin/:id', adminAuth, updateCategory);
router.delete('/admin/:id', adminAuth, deleteCategory);
router.patch('/admin/:id/toggle-status', adminAuth, toggleStatus);
router.patch('/admin/:id/toggle-visibility', adminAuth, toggleVisibility);

export default router;
