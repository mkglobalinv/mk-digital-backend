import { getSupabaseClient } from './supabaseClient.js';
import crypto from 'crypto';
import path from 'path';

const BUCKET_NAME = 'assisted-service-documents';

/**
 * Uploads a document to the private Supabase bucket using an opaque key.
 * @param {Buffer} fileBuffer - The memory buffer of the file
 * @param {string} originalName - Original filename (to extract extension)
 * @param {string} mimeType - The MIME type of the file
 * @param {string} folder - Prefix folder (e.g. 'nin-mod')
 * @returns {Promise<string>} - The storage key of the uploaded document
 */
export const uploadPrivateDocument = async (fileBuffer, originalName, mimeType, folder = 'documents') => {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase client is not configured.');
    }

    const ext = path.extname(originalName).toLowerCase() || '';
    const opaqueFilename = `${crypto.randomUUID()}${ext}`;
    const storageKey = `${folder}/${opaqueFilename}`;

    const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .upload(storageKey, fileBuffer, {
            contentType: mimeType,
            upsert: false
        });

    if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
    }

    return storageKey;
};

/**
 * Generates a short-lived signed URL for admin document access.
 * @param {string} storageKey - The storage key returned from upload
 * @param {number} expiresInSeconds - Expiration time in seconds (default 10 mins)
 * @returns {Promise<string>} - The signed URL
 */
export const generateSignedUrl = async (storageKey, expiresInSeconds = 600) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase client is not configured.');
    }

    const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .createSignedUrl(storageKey, expiresInSeconds);

    if (error) {
        throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
};

/**
 * Deletes a document from storage. Used for rollback/cleanup.
 * @param {string} storageKey - The storage key to delete
 */
export const deletePrivateDocument = async (storageKey) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase
        .storage
        .from(BUCKET_NAME)
        .remove([storageKey]);
};
