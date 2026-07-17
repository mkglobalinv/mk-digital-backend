import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import CodeIndex from '../models/CodeIndex.js';

// Simple heuristic file type detection
const detectFileType = (filePath) => {
    if (filePath.includes('models')) return 'model';
    if (filePath.includes('routes')) return 'route';
    if (filePath.includes('controllers')) return 'controller';
    if (filePath.includes('services')) return 'service';
    return 'other';
};

// Simple heuristic provider detection
const detectProviders = (content) => {
    const providers = [];
    const contentLower = content.toLowerCase();
    if (contentLower.includes('flutterwave')) providers.push('flutterwave');
    if (contentLower.includes('peyflex')) providers.push('peyflex');
    if (contentLower.includes('clubkonnect')) providers.push('clubkonnect');
    if (contentLower.includes('jarapoint')) providers.push('jarapoint');
    if (contentLower.includes('vtu')) providers.push('vtu');
    if (contentLower.includes('wallet')) providers.push('wallet');
    return providers;
};

const getFilesRecursively = (dir, fileList = []) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        // Ignore node_modules, .git, and hidden folders
        if (file.startsWith('.') || file === 'node_modules' || file.startsWith('mk-') || file.includes('scratch') || file.includes('backups')) {
            continue;
        }
        if (fs.statSync(filePath).isDirectory()) {
            getFilesRecursively(filePath, fileList);
        } else if (file.endsWith('.js')) {
            fileList.push(filePath);
        }
    }
    return fileList;
};

export const indexRepository = async (repoRoot) => {
    try {
        const files = getFilesRecursively(repoRoot);
        let indexedCount = 0;

        for (const filePath of files) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const hash = crypto.createHash('sha256').update(content).digest('hex');
            
            // Check if already indexed with same hash
            const relativePath = path.relative(repoRoot, filePath);
            const existing = await CodeIndex.findOne({ filePath: relativePath });
            
            if (existing && existing.contentHash === hash) {
                continue; // Unchanged
            }

            const fileType = detectFileType(relativePath);
            const relatedProviders = detectProviders(content);
            
            await CodeIndex.findOneAndUpdate(
                { filePath: relativePath },
                {
                    fileType,
                    contentHash: hash,
                    metadata: {
                        extractedRoutes: [], // Extracting via regex is complex, keep simple for now
                        dependencies: [],
                        relatedProviders
                    },
                    lastIndexedAt: new Date()
                },
                { upsert: true, new: true }
            );
            indexedCount++;
        }
        
        return { success: true, message: `Successfully indexed ${indexedCount} new/updated files.` };
    } catch (error) {
        console.error('Indexing error:', error);
        return { success: false, error: error.message };
    }
};

export const searchIndex = async (query) => {
    try {
        const regex = new RegExp(query, 'i');
        const results = await CodeIndex.find({
            $or: [
                { filePath: regex },
                { fileType: regex },
                { 'metadata.relatedProviders': regex }
            ]
        }).limit(50);
        return results;
    } catch (error) {
        throw error;
    }
};
