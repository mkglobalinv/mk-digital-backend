import { getSupabaseClient } from './supabaseClient.js';

// Add debugging
console.log('[Supabase Storage] Initializing storage service module...');

const getBucketName = () => process.env.SUPABASE_BUCKET || 'Reseller-app';

/**
 * Uploads a file buffer to Supabase Storage and returns its public URL
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} originalName - The original name of the file
 * @param {string} mimetype - The mimetype of the file
 * @returns {Promise<string>} The public URL of the uploaded file
 */
export const uploadBufferToSupabase = async (fileBuffer, originalName, mimetype) => {
    try {
        const supabase = getSupabaseClient();
        const SUPABASE_BUCKET = getBucketName();

        if (!fileBuffer || fileBuffer.length === 0) {
            throw new Error("Invalid file buffer: Buffer is empty or undefined.");
        }

        // Validate storage access and verify bucket exists
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (bucketsError) {
            console.error('Supabase bucket listing error:', bucketsError);
            if (bucketsError.message?.includes('JWT') || bucketsError.message?.includes('JWS') || bucketsError.message?.includes('Auth')) {
                throw new Error("Supabase authentication failure: Invalid service key or unauthorized.");
            }
            throw new Error("Supabase storage unavailable or access denied.");
        }

        const bucketExists = buckets.some(b => b.name === SUPABASE_BUCKET);
        if (!bucketExists) {
            console.log(`[Supabase] Bucket '${SUPABASE_BUCKET}' missing. Attempting to create it...`);
            const { data: newBucket, error: createError } = await supabase.storage.createBucket(SUPABASE_BUCKET, {
                public: true, // Make bucket public so users can download APKs
                allowedMimeTypes: ['application/vnd.android.package-archive', 'application/octet-stream', 'application/zip', 'application/x-zip-compressed']
            });
            
            if (createError) {
                console.error('Supabase bucket creation error:', createError);
                // If it fails because of permissions or other reasons, we might still want to try uploading 
                // in case it was created concurrently or permissions are just weird, but throwing is safer.
                throw new Error(`Supabase bucket missing and auto-creation failed: ${createError.message}`);
            }
            console.log(`[Supabase] Bucket '${SUPABASE_BUCKET}' successfully created.`);
        }

        const ext = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : '';
        const baseName = originalName.includes('.') ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName;
        
        const cleanName = baseName.replace(/[^a-zA-Z0-9.\-_]/g, '-').toLowerCase();
        // Preserve extension exactly to prevent corruption
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${cleanName}${ext}`;

        const { data, error } = await supabase.storage
            .from(SUPABASE_BUCKET)
            .upload(fileName, fileBuffer, {
                contentType: mimetype,
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            if (error.message?.includes('JWT') || error.message?.includes('JWS') || error.message?.includes('Auth')) {
                throw new Error("Supabase authentication failure: Invalid service key format.");
            }
            if (error.statusCode === 403 || error.message?.includes('denied')) {
                throw new Error("Supabase upload denied: Insufficient permissions.");
            }
            throw new Error(`Failed to upload to Supabase: ${error.message}`);
        }

        const { data: publicUrlData } = supabase.storage
            .from(SUPABASE_BUCKET)
            .getPublicUrl(fileName);

        return publicUrlData.publicUrl;
    } catch (error) {
        console.error('Failed to upload file to Supabase:', error.message || error);
        throw error;
    }
};
