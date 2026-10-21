import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ required: true, enum: ['worker', 'admin'], default: 'worker', index: true })
  role: string;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 120 })
  fullName: string;

  @Prop({ min: 16, max: 99, default: null })
  age: number;

  @Prop({ default: null, match: /^\+?[0-9\s]{6,20}$/ })
  phone: string;

  @Prop({ default: null, trim: true })
  city: string;

  @Prop({ default: null })
  province: string;

  @Prop({ default: null })
  address: string;

  @Prop({ default: null })
  avatarUrl: string;

  @Prop({ default: null, maxlength: 2000 })
  bio: string;

  @Prop({ default: null })
  birthDate: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Speciality' }], default: [], index: true })
  specialityIds: Types.ObjectId[];

  @Prop({ min: 0, max: 70, default: 0 })
  yearsExperience: number;

  @Prop({ type: [String], default: [] })
  certifications: string[];

  @Prop({ type: [String], default: [] })
  languages: string[];

  @Prop({ default: false })
  hasDriversLicence: boolean;

  @Prop({ enum: ['immediate', 'two_weeks', 'one_month', 'not_available'], default: 'immediate' })
  availability: string;

  @Prop({ type: Types.ObjectId, ref: 'FileAsset', default: null })
  resumeFileId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FileAsset', default: null })
  avatarFileId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'FileAsset' }], default: [] })
  certificateFiles: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'FileAsset' }], default: [] })
  sampleFiles: Types.ObjectId[];

  @Prop({ default: false })
  onboardingCompleted: boolean;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: false, select: false })
  emailVerified: boolean;

  @Prop({ default: null, select: false })
  emailVerifyToken: string;

  @Prop({ default: null, select: false })
  resetToken: string;

  @Prop({ default: null, select: false })
  resetTokenExpires: Date;

  @Prop({ default: null, select: false })
  refreshTokenHash: string;

  @Prop({ default: null })
  lastLoginAt: Date;

  @Prop({ default: 0, select: false })
  failedLoginCount: number;

  @Prop({ default: null, select: false })
  lockedUntil: Date;

  @Prop({ default: null })
  deletedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  deletedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  lastAdminActionBy: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ fullName: 'text', email: 'text', city: 'text' });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ specialityIds: 1, isActive: 1 });