import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LikeDocument = Like & Document;

@Schema({ timestamps: true })
export class Like {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  postId: Types.ObjectId;

  @Prop({ default: Date.now })
  likedAt: Date;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

LikeSchema.index({ userId: 1, postId: 1 }, { unique: true });
LikeSchema.index({ postId: 1, likedAt: -1 });