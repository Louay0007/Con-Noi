import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
 @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
 threadId: Types.ObjectId;

 @Prop({ type: Types.ObjectId, ref: 'User', required: true })
 senderId: Types.ObjectId;

 @Prop({ type: Types.ObjectId, ref: 'User', required: true })
 recipientId: Types.ObjectId;

 @Prop({ maxlength: 4000, default: null })
 body: string;

 @Prop({ type: [{ fileId: { type: Types.ObjectId, ref: 'FileAsset' } }], default: [] })
 attachments: { fileId: Types.ObjectId }[];

 @Prop({ default: null })
 readAt: Date;

 @Prop({ default: null })
 deletedAt: Date;

 @Prop({ default: null })
 editedAt: Date;

 @Prop({ default: Date.now, index: true })
 sentAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ threadId: 1, sentAt: 1 });
MessageSchema.index({ recipientId: 1, readAt: 1 });