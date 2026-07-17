import express from 'express';
import { adminAuth } from '../middlewares/adminAuth.js';
import { indexRepository, searchIndex } from '../services/codeIndexerService.js';
import CodeIndex from '../models/CodeIndex.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Github Webhook endpoint (no adminAuth needed, but requires webhook secret verification in prod)
router.post('/webhook/github', async (req, res) => {
    // In a real scenario, we'd verify the github signature here
    // And trigger a git pull. For now, we just trigger the indexer.
    const projectRoot = path.resolve(__dirname, '../../'); // Assumes mk-digital-backend is the root
    
    // We launch it asynchronously
    indexRepository(projectRoot).then(result => {
        console.log('GitHub Push Webhook Indexing Result:', result);
    });

    res.status(200).json({ success: true, message: 'Webhook received. Indexing started.' });
});

// Admin-protected routes
router.use(adminAuth);

router.post('/index/force', async (req, res) => {
    try {
        const result = await indexRepository(path.resolve('./')); // Index current directory
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to index', error: err.message });
    }
});

router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ success: false, message: 'Query is required' });
        
        const results = await searchIndex(query);
        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Search failed', error: err.message });
    }
});

router.get('/explorer', async (req, res) => {
    try {
        const files = await CodeIndex.find().sort({ fileType: 1, filePath: 1 });
        res.json({ success: true, data: files });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to retrieve code index', error: err.message });
    }
});

export default router;
