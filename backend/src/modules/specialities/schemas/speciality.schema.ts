import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SpecialityDocument = Speciality & Document;

@Schema({ timestamps: true })
export class Speciality {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({
    required: true,
    enum: ['edilizia', 'meccanica', 'elettrica', 'automotive', 'artigianato', 'industriale', 'generico'],
  })
  category: string;

  @Prop({ default: null })
  icon: string;

  @Prop({ default: '#2563eb' })
  color: string;

  @Prop({ default: null, maxlength: 400 })
  description: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  workerCount: number;

  @Prop({ default: 0 })
  postCount: number;
}

export const SpecialitySchema = SchemaFactory.createForClass(Speciality);

SpecialitySchema.index({ category: 1, isActive: 1, sortOrder: 1 });