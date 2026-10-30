import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class User {
  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ type: String, required: true, select: false })
  passwordHash: string;

  @Prop({ type: String, required: true, enum: ['worker', 'admin'], default: 'worker', index: true })
  role: string;

  @Prop({ type: String, required: true, trim: true, minlength: 2, maxlength: 120 })
  fullName: string;

  @Prop({ type: Number, min: 16, max: 99, default: null })
  age: number | null;

  @Prop({ type: String, default: null, match: /^\+?[0-9\s]{6,20}$/ })
  phone: string | null;

  @Prop({ type: String, default: null, trim: true })
  city: string | null;

  @Prop({ type: String, default: null })
  province: string | null;

  @Prop({ type: String, default: null })
  address: string | null;

  @Prop({ type: String, default: null })
  avatarUrl: string | null;

  @Prop({ type: String, default: null, maxlength: 2000 })
  bio: string | null;

  @Prop({ type: Date, default: null })
  birthDate: Date | null;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Speciality' }], default: [], index: true })
  specialityIds: Types.ObjectId[];

  @Prop({ type: Number, min: 0, max: 70, default: 0 })
  yearsExperience: number;

  @Prop({ type: [String], default: [] })
  certifications: string[];

  @Prop({ type: [String], default: [] })
  languages: string[];

  @Prop({ type: Boolean, default: false })
  hasDriversLicence: boolean;

  @Prop({
    type: String,
    enum: ['immediate', 'two_weeks', 'one_month', 'not_available'],
    default: 'immediate',
  })
  availability: string;

  @Prop({ type: Types.ObjectId, ref: 'FileAsset', default: null })
  resumeFileId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'FileAsset', default: null })
  avatarFileId: Types.ObjectId | null;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'FileAsset' }], default: [] })
  certificateFiles: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'FileAsset' }], default: [] })
  sampleFiles: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  onboardingCompleted: boolean;

  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: false, select: false })
  emailVerified: boolean;

  @Prop({ type: String, default: null, select: false })
  emailVerifyToken: string | null;

  @Prop({ type: String, default: null, select: false })
  resetToken: string | null;

  @Prop({ type: Date, default: null, select: false })
  resetTokenExpires: Date | null;

  @Prop({ type: String, default: null, select: false })
  refreshTokenHash: string | null;

  @Prop({ type: Date, default: null })
  lastLoginAt: Date | null;

  @Prop({ type: Number, default: 0, select: false })
  failedLoginCount: number;

  @Prop({ type: Date, default: null, select: false })
  lockedUntil: Date | null;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  deletedBy: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  lastAdminActionBy: Types.ObjectId | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ fullName: 'text', email: 'text', city: 'text' });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ specialityIds: 1, isActive: 1 });
