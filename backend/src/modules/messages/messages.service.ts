import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class MessagesService {
 constructor(
  @InjectModel(Conversation.name) private convModel: Model<Conversation>,
  @InjectModel(Message.name) private msgModel: Model<Message>,
 ) {}

 async findOrCreateThread(params: {
  senderId: string;
  recipientId: string;
  postId?: string;
  applicationId?: string;
  context?: string;
 }): Promise<ConversationDocument> {
  const participants = [params.senderId, params.recipientId].sort();
  const query: Record<string, unknown> = {
   participants: participants.map((p) => new Types.ObjectId(p)),
  };
  if (params.applicationId) query.applicationId = new Types.ObjectId(params.applicationId);
  if (params.postId) query.postId = new Types.ObjectId(params.postId);

  const existing = await this.convModel.findOne(query).exec();
  if (existing) return existing;

  return this.convModel.create({
   participants: participants.map((p) => new Types.ObjectId(p)),
   applicationId: params.applicationId ? new Types.ObjectId(params.applicationId) : null,
   postId: params.postId ? new Types.ObjectId(params.postId) : null,
   context: params.context || 'direct',
   unreadCounts: new Map(),
  });
 }

 async sendMessage(params: {
  threadId: string;
  senderId: string;
  body?: string;
  attachmentFileIds?: string[];
 }): Promise<MessageDocument> {
  const thread = await this.convModel.findById(params.threadId).exec();
  if (!thread) throw new NotFoundException('Conversation not found');
  if (thread.isClosed) throw new BadRequestException('Conversation is closed');

  const senderOid = new Types.ObjectId(params.senderId);
  if (!thread.participants.some((p) => p.equals(senderOid))) {
   throw new ForbiddenException('Not a participant in this conversation');
  }

  const recipientId = thread.participants.find((p) => !p.equals(senderOid));
  if (!recipientId) throw new BadRequestException('Cannot determine recipient');

  const message = await this.msgModel.create({
   threadId: new Types.ObjectId(params.threadId),
   senderId: senderOid,
   recipientId,
   body: params.body || null,
   attachments: (params.attachmentFileIds || []).map((fid) => ({ fileId: new Types.ObjectId(fid) })),
   sentAt: new Date(),
  });

  const preview = params.body ? params.body.substring(0, 300) : '[attachment]';
  const recipientKey = recipientId.toString();
  const currentUnread = thread.unreadCounts.get(recipientKey) || 0;
  thread.unreadCounts.set(recipientKey, currentUnread + 1);
  thread.lastMessage = preview;
  thread.lastMessageAt = message.sentAt;
  thread.lastSenderId = senderOid;
  await thread.save();

  return message;
 }

 async getThreads(userId: string): Promise<ConversationDocument[]> {
  return this.convModel
   .find({ participants: new Types.ObjectId(userId), isClosed: false })
   .sort({ lastMessageAt: -1 })
   .exec();
 }

 async getMessages(threadId: string, userId: string, cursor?: string, limit: number = 50): Promise<{ items: MessageDocument[]; nextCursor: string | null }> {
  const thread = await this.convModel.findById(threadId).exec();
  if (!thread) throw new NotFoundException('Conversation not found');
  if (!thread.participants.some((p) => p.equals(new Types.ObjectId(userId)))) {
   throw new ForbiddenException('Not a participant');
  }

  const matchStage: Record<string, unknown> = {
   threadId: new Types.ObjectId(threadId),
   deletedAt: null,
  };
  if (cursor) matchStage._id = { $lt: new Types.ObjectId(cursor) };

  const messages = await this.msgModel
   .find(matchStage)
   .sort({ sentAt: -1 })
   .limit(limit + 1)
   .exec();

  const items = messages.slice(0, limit);
  const nextCursor = messages.length > limit ? messages[limit]._id.toString() : null;

  // Mark as read for the requesting user
  const userOid = new Types.ObjectId(userId);
  await this.msgModel.updateMany(
   { threadId: new Types.ObjectId(threadId), recipientId: userOid, readAt: null },
   { $set: { readAt: new Date() } },
  ).exec();
  thread.unreadCounts.set(userId, 0);
  await thread.save();

  return { items, nextCursor };
 }

 async markThreadRead(threadId: string, userId: string): Promise<void> {
  const userOid = new Types.ObjectId(userId);
  await this.msgModel.updateMany(
   { threadId: new Types.ObjectId(threadId), recipientId: userOid, readAt: null },
   { $set: { readAt: new Date() } },
  ).exec();
  const thread = await this.convModel.findById(threadId).exec();
  if (thread) {
   thread.unreadCounts.set(userId, 0);
   await thread.save();
  }
 }

 async closeThread(threadId: string, userId: string): Promise<void> {
  const thread = await this.convModel.findById(threadId).exec();
  if (!thread) throw new NotFoundException('Conversation not found');
  thread.isClosed = true;
  thread.closedBy = new Types.ObjectId(userId);
  await thread.save();
 }

 async getUnreadCount(userId: string): Promise<number> {
  const threads = await this.convModel.find({
   participants: new Types.ObjectId(userId),
   isClosed: false,
  }).exec();
  let total = 0;
  for (const t of threads) {
   total += t.unreadCounts.get(userId) || 0;
  }
  return total;
 }
}