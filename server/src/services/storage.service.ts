import fs from 'fs';
import path from 'path';
import { AppError } from '../middleware/error.middleware';

/**
 * Interface simples para abstração de storage
 */
export interface IStorageProvider {
    uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<string>;
    deleteFile(url: string): Promise<void>;
}

/**
 * Provedor Local (para desenvolvimento)
 */
export class LocalStorageProvider implements IStorageProvider {
    private uploadDir: string;

    constructor() {
        this.uploadDir = path.resolve(__dirname, '../../uploads');
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async uploadFile(file: Buffer, fileName: string): Promise<string> {
        const filePath = path.join(this.uploadDir, fileName);
        fs.writeFileSync(filePath, file);
        return `/uploads/${fileName}`;
    }

    async deleteFile(url: string): Promise<void> {
        const fileName = path.basename(url);
        const filePath = path.join(this.uploadDir, fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

/**
 * Serviço Principal que decide o provedor
 */
export class StorageService {
    private provider: IStorageProvider;

    constructor() {
        // Por enquanto, usa local. Futuramente injetar S3 aqui via env.
        this.provider = new LocalStorageProvider();
    }

    async upload(file: Buffer, originalName: string, mimeType: string): Promise<string> {
        // Security checks
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        const maxFileSize = 5 * 1024 * 1024; // 5MB

        if (!allowedMimeTypes.includes(mimeType)) {
            throw new AppError(400, 'Tipo de arquivo não permitido');
        }

        if (file.length > maxFileSize) {
            throw new AppError(400, 'Arquivo muito grande (máximo 5MB)');
        }

        const ext = path.extname(originalName);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`;
        return this.provider.uploadFile(file, fileName, mimeType);
    }
}

export const storageService = new StorageService();
