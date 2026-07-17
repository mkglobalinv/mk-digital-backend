import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Storage Adapter Service
 * 
 * This service abstracts file operations to support multiple storage backends.
 * Currently supports 'local' storage, with architecture ready for S3/R2.
 */
class StorageAdapter {
    constructor() {
        this.strategy = process.env.STORAGE_STRATEGY || 'local';
        this.baseDir = process.cwd();
        this.publicUrl = process.env.PUBLIC_URL || ''; // For CDN/S3 base URLs
    }

    /**
     * Deletes a file from storage.
     * @param {string} filePath - Relative path from project root (e.g., 'uploads/builds/file.apk')
     */
    async delete(filePath) {
        if (this.strategy === 'local') {
            const absolutePath = path.join(this.baseDir, filePath);
            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
                return true;
            }
            return false;
        }
        // Future: S3.deleteObject(...)
        return false;
    }

    /**
     * Checks if a file exists.
     * @param {string} filePath - Relative path
     */
    async exists(filePath) {
        if (this.strategy === 'local') {
            return fs.existsSync(path.join(this.baseDir, filePath));
        }
        // Future: S3.headObject(...)
        return false;
    }

    /**
     * Moves a file from one location to another.
     * Useful for moving from 'uploads/temp' to final destination.
     * @param {string} srcPath - Source relative path
     * @param {string} destPath - Destination relative path
     */
    async move(srcPath, destPath) {
        if (this.strategy === 'local') {
            const src = path.join(this.baseDir, srcPath);
            const dest = path.join(this.baseDir, destPath);
            
            // Ensure destination directory exists
            const destDir = path.dirname(dest);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }

            fs.renameSync(src, dest);
            return true;
        }
        // Future: S3.copyObject(...) then S3.deleteObject(...)
        return false;
    }

    /**
     * Returns the full URL for a file.
     * @param {string} filePath - Relative path
     */
    getUrl(filePath) {
        if (this.strategy === 'local') {
            // Ensure path starts with a slash
            const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
            return `${this.publicUrl}${cleanPath.replace(/\\/g, '/')}`;
        }
        // Future: S3 signed URL or public bucket URL
        return `${this.publicUrl}/${filePath}`;
    }

    /**
     * Returns file statistics (size, mtime).
     * @param {string} filePath - Relative path
     */
    async getStats(filePath) {
        if (this.strategy === 'local') {
            const absolutePath = path.join(this.baseDir, filePath);
            if (fs.existsSync(absolutePath)) {
                const stats = fs.statSync(absolutePath);
                return {
                    size: stats.size,
                    sizeMb: (stats.size / (1024 * 1024)).toFixed(2),
                    mtime: stats.mtime
                };
            }
        }
        return null;
    }

    /**
     * Lists files in a directory.
     * @param {string} dirPath - Relative path
     */
    async list(dirPath) {
        if (this.strategy === 'local') {
            const absolutePath = path.join(this.baseDir, dirPath);
            if (fs.existsSync(absolutePath)) {
                return fs.readdirSync(absolutePath);
            }
            return [];
        }
        return [];
    }

    /**
     * Safely reads file content.
     * @param {string} filePath - Relative path
     */
    async read(filePath) {
        if (this.strategy === 'local') {
            const absolutePath = path.join(this.baseDir, filePath);
            if (fs.existsSync(absolutePath)) {
                return fs.readFileSync(absolutePath);
            }
        }
        return null;
    }

    /**
     * Writes content to a file.
     * @param {string} filePath - Relative path
     * @param {Buffer|string} content - Data to write
     */
    async write(filePath, content) {
        if (this.strategy === 'local') {
            const absolutePath = path.join(this.baseDir, filePath);
            const dir = path.dirname(absolutePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(absolutePath, content);
            return true;
        }
        return false;
    }
}

const storage = new StorageAdapter();
export default storage;
