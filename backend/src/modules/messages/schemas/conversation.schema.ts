import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
 @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true, index: true })
 participants: Types.ObjectId[];

 @Prop({ type: Types.ObjectId, ref: 'Application', default: null })
 applicationId: Types.ObjectId;

 @Prop({ type: Types.ObjectId, ref: 'Post', default: null })
 postId: Types.ObjectId;

 @Prop({ enum: ['post', 'application', 'direct', 'admin_contact'], default: 'direct' })
 context: string;

 @Prop({ maxlength: 300, default: null })
 lastMessage: string;

 @Prop({ default: Date.now, index: true })
 lastMessageAt: Date;

 @Prop({ type: Types.ObjectId, ref: 'User', default: null })
 lastSenderId: Types.ObjectId;

 @Prop({ type: Map, of: Number, default: {} })
 unreadCounts: Map<string, number>;

 @Prop({ default: false })
 isClosed: boolean;

 @Prop({ type: Types.ObjectId, ref: 'User', default: null })
 closedBy: Types.ObjectId;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ participants: 1, lastMessageAt: -1 });