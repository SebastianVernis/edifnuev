/**
 * Upload Utility
 * Handles file storage in Cloudflare R2 (Production) or Local Disk (Development)
 */
import fs from 'fs';
import path from 'path';

/**
 * Upload a file from base64 data
 * @param {string} base64Data - The file content in base64 format
 * @param {string} fileName - Original file name
 * @param {string} folder - Destination folder (e.g., 'payments', 'expenses')
 * @param {Object} env - Environment variables (for Cloudflare R2 binding)
 * @returns {Promise<string>} - The public URL or path of the uploaded file
 */
export const uploadBase64File = async (base64Data, fileName, folder, env = null) => {
    if (!base64Data) return null;

    // Remove metadata prefix if present (e.g., "data:image/png;base64,")
    const base64Content = base64Data.includes('base64,') 
        ? base64Data.split('base64,')[1] 
        : base64Data;
    
    const extension = path.extname(fileName) || '.jpg';
    const uniqueFileName = `${Date.now()}_${Math.round(Math.random() * 1E9)}${extension}`;
    const key = `${folder}/${uniqueFileName}`;

    // Cloudflare R2 Strategy
    if (env && env.UPLOADS) {
        console.log(`☁️ Uploading to R2: ${key}`);
        try {
            // In Workers, we use a different approach than Buffer if needed, 
            // but recent Node.js compatibility allows Buffer.
            const binaryString = atob(base64Content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            await env.UPLOADS.put(key, bytes, {
                httpMetadata: {
                    contentType: getMimeType(extension)
                }
            });
            
            // Return a path that can be proxied or a direct URL if configured
            return `/api/uploads/${key}`;
        } catch (error) {
            console.error('❌ Error uploading to R2:', error);
            throw new Error('Error al subir archivo a R2');
        }
    }

    // Local Disk Strategy (Local Development)
    console.log(`📁 Saving to local disk: ${key}`);
    try {
        const rootDir = process.cwd();
        const uploadDir = path.join(rootDir, 'public', 'uploads', folder);
        
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, uniqueFileName);
        const buffer = Buffer.from(base64Content, 'base64');
        fs.writeFileSync(filePath, buffer);

        return `/uploads/${folder}/${uniqueFileName}`;
    } catch (error) {
        console.error('❌ Error saving to local disk:', error);
        throw new Error('Error al guardar archivo localmente');
    }
};

/**
 * Helper to get MIME type from extension
 */
function getMimeType(extension) {
    const types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.webp': 'image/webp'
    };
    return types[extension.toLowerCase()] || 'application/octet-stream';
}

export default {
    uploadBase64File
};
