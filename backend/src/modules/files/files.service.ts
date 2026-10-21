import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { FileAsset, FileAssetDocument } from './schemas/file-asset.schema';
import { validateFileForPurpose } from './file-validation';
import { StorageProvider } from '../upload/storage.provider';

@Injectable()
export class FilesService {
  constructor(
    @InjectModel(FileAsset.name) private fileModel: Model<FileAsset>,
    private storage: StorageProvider,
  ) {}

  async upload(params: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    purpose: string;
    ownerType: string;
    ownerId: string;
    userId: string;
    userRole: string;
  }): Promise<FileAssetDocument> {
    const validation = validateFileForPurpose(params.purpose, params.mimeType, params.buffer.length);
    if (!validation.valid) throw new BadRequestException(validation.error);

    const checksum = crypto.createHash('sha256').update(params.buffer).digest('hex');
    const ext = params.originalName.split('.').pop()?.toLowerCase() || 'bin';
    const storageKey = `${params.ownerType}/${params.ownerId}/${params.purpose}/${crypto.randomUUID()}.${ext}`;
    const isImage = params.mimeType.startsWith('image/');

    await this.storage.put(storageKey, params.buffer, params.mimeType);

    const doc = await this.fileModel.create({
      ownerType: params.ownerType,
      ownerId: new Types.ObjectId(params.ownerId),
      purpose: params.purpose,
      storageKey,
      provider: 'disk',
      url: `/api/files/download/${storageKey}`,
      originalName: params.originalName,
      mimeType: params.mimeType,
      extension: ext,
      sizeBytes: params.buffer.length,
      checksum,
      isImage,
      scanStatus: 'clean',
      visibility: this.defaultVisibility(params.purpose),
    });

    return doc;
  }

  async findById(id: string): Promise<FileAssetDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.fileModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  async findByStorageKey(key: string): Promise<FileAssetDocument | null> {
    return this.fileModel.findOne({ storageKey: key, deletedAt: null }).exec();
  }

  async getStream(file: FileAssetDocument) {
    return this.storage.getStream(file.storageKey);
  }

  canAccess(file: FileAssetDocument, userId: string, userRole: string): boolean {
    if (userRole === 'admin') return true;
    if (file.visibility === 'public') return true;
    if (file.visibility === 'owner' && file.ownerId.toString() === userId) return true;
    if (file.visibility === 'private' && file.ownerId.toString() === userId) return true;
    return false;
  }

  async softDelete(id: string, userId: string, userRole: string): Promise<void> {
    const file = await this.findById(id);
    if (!file) throw new NotFoundException('File not found');
    if (!this.canAccess(file, userId, userRole)) throw new ForbiddenException('Cannot delete this file');
    file.deletedAt = new Date();
    await file.save();
  }

  async findMine(userId: string): Promise<FileAssetDocument[]> {
    return this.fileModel.find({
      ownerType: 'user',
      ownerId: new Types.ObjectId(userId),
      deletedAt: null,
    }).sort({ createdAt: -1 }).exec();
  }

  private defaultVisibility(purpose: string): string {
    switch (purpose) {
      case 'avatar': return 'public';
      case 'post_cover':
      case 'post_gallery':
      case 'post_attachment':
      case 'company_logo':
        return 'public';
      case 'resume':
      case 'certificate':
      case 'work_sample':
        return 'owner';
      case 'application_attachment':
        return 'private';
      case 'message_attachment':
        return 'private';
      default:
        return 'private';
    }
  }
}