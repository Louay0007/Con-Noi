import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  actorId: Types.ObjectId;

  @Prop({ required: true })
  actorRole: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true, enum: ['post', 'user', 'application', 'file', 'speciality', 'message'] })
  entity: string;

  @Prop({ type: Types.ObjectId, default: null })
  entityId: Types.ObjectId;

  @Prop({ type: Object, default: null })
  before: Record<string, unknown>;

  @Prop({ type: Object, default: null })
  after: Record<string, unknown>;

  @Prop({ default: null })
  ip: string;

  @Prop({ default: null })
  userAgent: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });