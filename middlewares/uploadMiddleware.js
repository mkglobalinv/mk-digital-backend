import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Initialize structured storage architecture
const dirs = [
    'uploads/builds',
    'uploads/logos',
    'uploads/screenshots',
    'uploads/splash',
    'uploads/temp',
    'uploads/domains'
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Generic storage engine
const createStorage = (destinationFolder) => multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, destinationFolder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '-').toLowerCase();
        cb(null, uniqueSuffix + '-' + cleanName);
    }
});

// Filter for binaries (APK/AAB)
const binaryFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.apk', '.aab'].includes(ext)) cb(null, true);
    else cb(new Error('Invalid file type. Only .apk and .aab allowed.'), false);
};

// Filter for images
const imageFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) cb(null, true);
    else cb(new Error('Invalid file type. Only images allowed.'), false);
};

// Configured Uploaders
export const uploadBuild = multer({ 
    storage: createStorage('uploads/builds'),
    fileFilter: binaryFilter,
    limits: { fileSize: 150 * 1024 * 1024 } // 150MB
});

export const uploadBuildMemory = multer({ 
    storage: multer.memoryStorage(),
    fileFilter: binaryFilter,
    limits: { fileSize: 150 * 1024 * 1024 } // 150MB
});

export const uploadAsset = multer({ 
    storage: createStorage('uploads/temp'), // Images go to temp first, then optimized to final destination
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

export const uploadDomain = multer({
    storage: createStorage('uploads/domains'),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Secure Document Filter
const secureDocumentFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid document type. Only PDF, JPG, and PNG are allowed.'), false);
    }
};

export const uploadSecureDocument = multer({
    storage: multer.memoryStorage(),
    fileFilter: secureDocumentFilter,
    limits: { fileSize: 10 * 1024 * 1024, files: 5 } // 10MB max per file, max 5 files
});


// Default fallback export for backwards compatibility
export default uploadBuild;
