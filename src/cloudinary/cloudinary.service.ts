import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import 'multer';
interface UploadResult {
    public_id: string;
    secure_url: string;
    format: string;
    resource_type: string;
    bytes: number;
    original_filename: string;
}

interface UploadError {
    filename: string;
    error: string;
}

interface BatchUploadResult {
    successful: UploadResult[];
    failed: UploadError[];
    totalFiles: number;
    successCount: number;
    failCount: number;
}

interface UploadOptions {
    folder?: string;
    timeout?: number;
    maxFileSize?: number;
    allowedFormats?: string[];
    concurrentLimit?: number;
}

@Injectable()
export class CloudinaryService {
    private readonly DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private readonly DEFAULT_TIMEOUT = 30000; // 30s
    private readonly DEFAULT_CONCURRENT_LIMIT = 5;

    /**
     * Upload single file
     */
    async uploadFile(
        file: Express.Multer.File,
        options?: UploadOptions
    ): Promise<UploadResult> {
        this.validateFile(file, options);

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Upload timeout'));
            }, options?.timeout || this.DEFAULT_TIMEOUT);

            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: options?.folder || 'uploads',
                    resource_type: 'auto',
                    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
                },
                (error, result) => {
                    clearTimeout(timeoutId);

                    if (error) return reject(error);
                    if (!result) return reject(new Error('Upload failed'));

                    resolve({
                        public_id: result.public_id,
                        secure_url: result.secure_url,
                        format: result.format,
                        resource_type: result.resource_type,
                        bytes: result.bytes,
                        original_filename: file.originalname
                    });
                }
            );

            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }

    /**
     * Upload multiple files with concurrency control
     */
    async uploadMultipleFiles(
        files: Express.Multer.File[],
        options?: UploadOptions
    ): Promise<BatchUploadResult> {
        if (!files || files.length === 0) {
            throw new Error('No files provided');
        }

        const successful: UploadResult[] = [];
        const failed: UploadError[] = [];
        const concurrentLimit = options?.concurrentLimit || this.DEFAULT_CONCURRENT_LIMIT;

        // Upload với concurrency control
        for (let i = 0; i < files.length; i += concurrentLimit) {
            const batch = files.slice(i, i + concurrentLimit);
            const results = await Promise.allSettled(
                batch.map(file => this.uploadFile(file, options))
            );

            results.forEach((result, index) => {
                const file = batch[index];
                if (result.status === 'fulfilled') {
                    successful.push(result.value);
                } else {
                    failed.push({
                        filename: file.originalname,
                        error: result.reason.message || 'Upload failed'
                    });
                }
            });
        }

        return {
            successful,
            failed,
            totalFiles: files.length,
            successCount: successful.length,
            failCount: failed.length
        };
    }

    /**
     * Upload multiple files - tất cả thành công hoặc tất cả thất bại
     */
    async uploadMultipleFilesAtomic(
        files: Express.Multer.File[],
        options?: UploadOptions
    ): Promise<UploadResult[]> {
        if (!files || files.length === 0) {
            throw new Error('No files provided');
        }

        const uploadedResults: UploadResult[] = [];

        try {
            // Upload tuần tự để dễ rollback
            for (const file of files) {
                const result = await this.uploadFile(file, options);
                uploadedResults.push(result);
            }

            return uploadedResults;
        } catch (error) {
            // Rollback: xóa các file đã upload
            await this.deleteMultipleFiles(
                uploadedResults.map(r => r.public_id)
            );
            throw error;
        }
    }

    /**
     * Upload với progress tracking
     */
    async uploadMultipleFilesWithProgress(
        files: Express.Multer.File[],
        options?: UploadOptions,
        onProgress?: (progress: number, currentFile: string) => void
    ): Promise<BatchUploadResult> {
        if (!files || files.length === 0) {
            throw new Error('No files provided');
        }

        const successful: UploadResult[] = [];
        const failed: UploadError[] = [];
        let completed = 0;

        for (const file of files) {
            try {
                const result = await this.uploadFile(file, options);
                successful.push(result);
            } catch (error: any) {
                failed.push({
                    filename: file.originalname,
                    error: error.message || 'Upload failed'
                });
            }

            completed++;
            const progress = Math.round((completed / files.length) * 100);
            onProgress?.(progress, file.originalname);
        }

        return {
            successful,
            failed,
            totalFiles: files.length,
            successCount: successful.length,
            failCount: failed.length
        };
    }

    /**
     * Delete multiple files
     */
    async deleteMultipleFiles(publicIds: string[]): Promise<void> {
        if (!publicIds || publicIds.length === 0) return;

        await Promise.all(
            publicIds.map(id =>
                cloudinary.uploader.destroy(id).catch(err =>
                    console.error(`Failed to delete ${id}:`, err)
                )
            )
        );
    }

    /**
     * Kiểm tra tính hợp lệ của file
     */
    async validateFile(file: Express.Multer.File, options?: UploadOptions): Promise<void> {
        /** Kiểm tra file và buffer tồn tại */
        if (!file || !file.buffer) throw new Error('Invalid file');

        /** Lấy kích thước tối đa cho phép */
        const MAX_SIZE = options?.maxFileSize || this.DEFAULT_MAX_FILE_SIZE;
        /** Kiểm tra kích thước file */
        if (file.size > MAX_SIZE) throw new Error(`File ${file.originalname} exceeds maximum size of ${MAX_SIZE} bytes`);

        /** Kiểm tra định dạng file nếu có yêu cầu */
        if (options?.allowedFormats) {
            /** Lấy đuôi file */
            const EXT = file.originalname.split('.').pop()?.toLowerCase();
            /** Kiểm tra đuôi file có hợp lệ không */
            if (!EXT || !options.allowedFormats.includes(EXT)) throw new Error(
                `File format .${EXT} not allowed. Allowed: ${options.allowedFormats.join(', ')}`
            );
        }
    }
}