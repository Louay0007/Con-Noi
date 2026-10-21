import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true, trim: true, maxlength: 160 })
  title: string;

  @Prop({ unique: true, sparse: true })
  slug: string;

  @Prop({ default: null, maxlength: 280 })
  summary: string;

  @Prop({ required: true, maxlength: 8000 })
  description: string;

  @Prop({ type: [String], default: [] })
  requirements: string[];

  @Prop({ type: [String], default: [] })
  benefits: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Speciality' }], required: true, index: true })
  specialityIds: Types.ObjectId[];

  @Prop({ type: Object, required: true })
  location: {
    city: string;
    province?: string;
    country: string;
    address?: string;
    remote: boolean;
    coordinates?: { type: string; coordinates: number[] };
  };

  @Prop({ required: true, enum: ['full_time', 'part_time', 'contract', 'temporary', 'seasonal', 'internship'] })
  employmentType: string;

  @Prop({ enum: ['permanent', 'fixed_term', 'seasonal', 'noleggio', 'stage'], default: null })
  contractType: string;

  @Prop({ type: Object, default: null })
  salary: {
    min?: number;
    max?: number;
    currency: string;
    period: string;
    isNegotiable: boolean;
  };

  @Prop({ type: Object, default: null })
  schedule: {
    shift: string;
    hoursPerWeek: number;
  };

  @Prop({ type: Object, required: true })
  company: {
    name: string;
    logoFileId?: Types.ObjectId;
    website?: string;
    email?: string;
    phone?: string;
    sector?: string;
    size?: string;
  };

  @Prop({ type: Types.ObjectId, ref: 'FileAsset', default: null })
  coverFileId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'FileAsset' }], default: [] })
  galleryFileIds: Types.ObjectId[];

  @Prop({ type: [Object], default: [] })
  attachments: { fileId: Types.ObjectId; label: string; kind: string }[];

  @Prop({ required: true, enum: ['draft', 'published', 'closed', 'archived'], default: 'draft', index: true })
  status: string;

  @Prop({ default: null, index: true })
  publishedAt: Date;

  @Prop({ default: null })
  applicationDeadline: Date;

  @Prop({ default: null })
  startDate: Date;

  @Prop({ min: 1, max: 100, default: 1 })
  openings: number;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isUrgent: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  updatedBy: Types.ObjectId;

  @Prop({ type: Object, default: { views: 0, likes: 0, applications: 0 } })
  stats: { views: number; likes: number; applications: number };

  @Prop({ default: null })
  deletedAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ status: 1, publishedAt: -1 });
PostSchema.index({ specialityIds: 1, status: 1, publishedAt: -1 });
PostSchema.index({ 'location.city': 1, status: 1 });
PostSchema.index(
  { title: 'text', summary: 'text', description: 'text', 'company.name': 'text' },
  { weights: { title: 10, 'company.name': 6, summary: 3, description: 1 } },
);
PostSchema.index({ deletedAt: 1 }, { sparse: true });