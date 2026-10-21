import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkHistoryDocument = WorkHistory & Document;

@Schema({ timestamps: true })
export class WorkHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 120 })
  positionTitle: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  companyName: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Speciality' }], default: [] })
  specialityIds: Types.ObjectId[];

  @Prop({ default: null })
  location: string;

  @Prop({ enum: ['full_time', 'part_time', 'contract', 'temporary', 'seasonal', 'internship'], default: null })
  employmentType: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ default: null })
  endDate: Date;

  @Prop({ default: null, maxlength: 1000 })
  description: string;

  @Prop({ default: true })
  isExternal: boolean;

  @Prop({ default: false })
  isCurrent: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'FileAsset' }], default: [] })
  attachmentFileIds: Types.ObjectId[];

  @Prop({ default: 0 })
  sortOrder: number;
}

export const WorkHistorySchema = SchemaFactory.createForClass(WorkHistory);
WorkHistorySchema.index({ userId: 1, startDate: -1 });
WorkHistorySchema.index({ userId: 1, isCurrent: -1 });