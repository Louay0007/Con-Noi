import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FileAssetDocument = FileAsset & Document;

@Schema({ timestamps: true })
export class FileAsset {
  @Prop({ required: true, enum: ['user', 'post', 'application', 'work_history', 'conversation', 'message'], index: true })
  ownerType: string;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({
    required: true,
    enum: [
      'resume', 'avatar', 'certificate', 'work_sample',
      'post_cover', 'post_gallery', 'post_attachment',
      'application_attachment', 'history_attachment', 'message_attachment', 'company_logo',
    ],
    index: true,
  })
  purpose: string;

  @Prop({ required: true, unique: true })
  storageKey: string;

  @Prop({ required: true, enum: ['disk', 's3'], default: 'disk' })
  provider: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true, maxlength: 255 })
  originalName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true, lowercase: true })
  extension: string;

  @Prop({ required: true, min: 1 })
  sizeBytes: number;

  @Prop({ required: true })
  checksum: string;

  @Prop({ default: false })
  isImage: boolean;

  @Prop({ type: Object, default: null })
  imageMeta: {
    width?: number;
    height?: number;
    thumbnailStorageKey?: string;
    blurhash?: string;
  };

  @Prop({ type: Object, default: null })
  extracted: {
    pageCount?: number;
    textPreview?: string;
  };

  @Prop({ enum: ['pending', 'clean', 'infected', 'failed'], default: 'pending', index: true })
  scanStatus: string;

  @Prop({ enum: ['private', 'owner', 'employer', 'public'], default: 'private' })
  visibility: string;

  @Prop({ default: null, index: true })
  expiresAt: Date;

  @Prop({ default: 0 })
  downloadCount: number;

  @Prop({ default: null })
  lastDownloadedAt: Date;

  @Prop({ default: null })
  deletedAt: Date;
}

export const FileAssetSchema = SchemaFactory.createForClass(FileAsset);

FileAssetSchema.index({ ownerType: 1, ownerId: 1, purpose: 1 });
FileAssetSchema.index({ checksum: 1 });
FileAssetSchema.index({ deletedAt: 1, expiresAt: 1 });