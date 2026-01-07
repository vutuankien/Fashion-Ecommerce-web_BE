import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

export const CloudinaryProvider = {
    provide: 'CLOUDINARY',
    useFactory: async () => {
        const cloudName = process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        // Support the misspelled var for backward compatibility, but prefer the correct name
        const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRECT;

        const missing: string[] = [];
        if (!cloudName) missing.push('CLOUDINARY_NAME or CLOUDINARY_CLOUD_NAME');
        if (!apiKey) missing.push('CLOUDINARY_API_KEY');
        if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');

        if (missing.length) {
            throw new Error(`Missing Cloudinary environment variables: ${missing.join(', ')}`);
        }

        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
        });

        // Try a lightweight API call to verify the credentials and log the result
        try {
            // Fetch a small list of resources to check connectivity/credentials
            await cloudinary.api.resources({ max_results: 1 });
            console.info('[Cloudinary] Connected successfully');
        } catch (err: any) {
            // Safely stringify the error for logging to avoid `Cannot convert object to primitive value`
            let errMsg: string;
            try {
                if (err instanceof Error) errMsg = err.message;
                else errMsg = JSON.stringify(err);
            } catch {
                errMsg = String(err);
            }

            console.error('[Cloudinary] Connection failed:', errMsg);
            // Re-throw with safe string
            throw new Error(`Cloudinary connection check failed: ${errMsg}`);
        }

        return cloudinary;
    },
};