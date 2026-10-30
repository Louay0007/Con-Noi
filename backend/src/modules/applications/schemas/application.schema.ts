import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApplicationDocument = Application & Document;

@Schema({ timestamps: true })
export class Application {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true, index: true })
  postId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Object, required: true })
  snapshot: {
    postTitle: string;
    postSlug?: string;
    companyName: string;
    city?: string;
    specialityNames: string[];
    employmentType?: string;
  };

  @Prop({ maxlength: 4000, default: null })
  coverLetter: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'FileAsset' }], default: [] })
  attachmentFileIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'FileAsset', default: null })
  resumeFileId: Types.ObjectId;

  @Prop({ required: true, enum: ['submitted', 'reviewed', 'accepted', 'rejected', 'withdrawn'], default: 'submitted', index: true })
  status: string;

  @Prop({ type: [Object], default: [] })
  statusHistory: {
    from?: string;
    to: string;
    actorId: Types.ObjectId;
    actorRole: string;
    note?: string;
    at: Date;
  }[];

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reviewedBy: Types.ObjectId;

  @Prop({ default: null })
  reviewedAt: Date;

  @Prop({ maxlength: 2000, default: null })
  reviewNotes: string;

  @Prop({ type: Types.ObjectId, ref: 'Conversation', default: null })
  threadId: Types.ObjectId;

  @Prop({ type: Object, default: null })
  contact: {
    phone?: string;
    email?: string;
    availabilityNote?: string;
  };

  @Prop({ default: Date.now, index: true })
  appliedAt: Date;

  @Prop({ default: null })
  withdrawnAt: Date;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);

ApplicationSchema.index({ userId: 1, postId: 1 }, { unique: true });
ApplicationSchema.index({ status: 1, appliedAt: -1 });
ApplicationSchema.index({ postId: 1, status: 1 });