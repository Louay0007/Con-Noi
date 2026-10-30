import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkHistoryDocument = WorkHistory & Document;

@Schema({ timestamps: true })
export class WorkHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 120 })
  positionTitle: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 120 })
  companyName: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Speciality' }], default: [] })
  specialityIds: Types.ObjectId[];

  @Prop({ type: String, default: null })
  location: string | null;

  @Prop({
    type: String,
    enum: ['full_time', 'part_time', 'contract', 'temporary', 'seasonal', 'internship'],
    default: null,
  })
  employmentType: string | null;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, default: null })
  endDate: Date | null;

  @Prop({ type: String, default: null, maxlength: 1000 })
  description: string | null;

  @Prop({ type: Boolean, default: true })
  isExternal: boolean;

  @Prop({ type: Boolean, default: false })
  isCurrent: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'FileAsset' }], default: [] })
  attachmentFileIds: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  sortOrder: number;

  @Prop({ type: Date, default: null, index: true })
  deletedAt: Date | null;
}

export const WorkHistorySchema = SchemaFactory.createForClass(WorkHistory);
WorkHistorySchema.index({ userId: 1, startDate: -1 });
WorkHistorySchema.index({ userId: 1, isCurrent: -1 });
WorkHistorySchema.index({ userId: 1, deletedAt: 1, sortOrder: 1 });
