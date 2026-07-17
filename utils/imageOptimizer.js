import jimp from 'jimp';
import path from 'path';
import fs from 'fs';

/**
 * Optimizes an uploaded image and moves it to the final destination.
 * 
 * @param {string} tempPath - The current path of the uploaded image in temp directory
 * @param {string} destinationDir - The final directory (e.g. 'uploads/logos')
 * @param {number} width - Maximum width to scale to
 * @param {number} height - Maximum height to scale to
 * @param {number} quality - JPEG compression quality (0-100)
 * @returns {Promise<string>} - The final public URL of the optimized image
 */
export const optimizeImage = async (tempPath, destinationDir, width = 512, height = jimp.AUTO, quality = 80) => {
    try {
        if (!fs.existsSync(destinationDir)) {
            fs.mkdirSync(destinationDir, { recursive: true });
        }

        const image = await jimp.read(tempPath);
        const fileName = path.basename(tempPath);
        // Force conversion to optimized JPEG for storage savings if needed, 
        // or just keep original format. We will keep original format but compress.
        
        const finalPath = path.join(destinationDir, fileName);
        
        await image
            .resize(width, height)
            .quality(quality)
            .writeAsync(finalPath);
            
        // Remove the temporary unoptimized file
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }

        // Return a relative URL suitable for static serving
        return `/${destinationDir.replace(/\\/g, '/')}/${fileName}`;
    } catch (err) {
        console.error("Image Optimization Error:", err);
        // Fallback: move the file without optimization if Jimp fails
        const fileName = path.basename(tempPath);
        const finalPath = path.join(destinationDir, fileName);
        fs.renameSync(tempPath, finalPath);
        return `/${destinationDir.replace(/\\/g, '/')}/${fileName}`;
    }
};
