import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

/**
 * Notification types understood by the frontend (`TYPE_CONFIG` in
 * NotificationsPanel.tsx) and the backend. Keep this list in sync with both:
 * writing a type outside this enum silently failed validation, which is why
 * status-change notifications never reached users.
 */
export const NOTIFICATION_TYPES = [
  'application_received',
  'application_status',
  'application_accepted',
  'application_rejected',
  'new_message',
  'new_post_matching',
  'admin_message',
  'admin_broadcast',
  'account',
  'broadcast',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: NOTIFICATION_TYPES })
  type: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  body: string;

  @Prop({ type: Object, default: {} })
  data: Record<string, unknown>;

  @Prop({ type: Date, default: null })
  readAt: Date | null;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
