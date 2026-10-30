import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { User } from '../users/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';

/** Thread shape returned to clients (participants resolved, preview shaped). */
export type ThreadView = {
  _id: string;
  participants: Array<{ id: string; fullName: string; avatarUrl?: string }>;
  lastMessage?: { body: string; createdAt: string; senderId: string };
  unreadCount: number;
  context: string;
  isClosed: boolean;
  updatedAt: string;
};

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Conversation.name) private convModel: Model<Conversation>,
    @InjectModel(Message.name) private msgModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,
    private notifications: NotificationsService,
  ) {}

  async findOrCreateThread(params: {
    senderId: string;
    recipientId: string;
    postId?: string;
    applicationId?: string;
    context?: string;
  }): Promise<ConversationDocument> {
    if (params.senderId === params.recipientId) {
      throw new BadRequestException('You cannot start a conversation with yourself');
    }
    for (const id of [params.senderId, params.recipientId]) {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid participant id');
      }
    }

    const participants = [params.senderId, params.recipientId].sort();
    const query: Record<string, unknown> = {
      participants: { $all: participants.map((p) => new Types.ObjectId(p)) },
    };
    if (params.applicationId) query.applicationId = new Types.ObjectId(params.applicationId);
    if (params.postId) query.postId = new Types.ObjectId(params.postId);

    const existing = await this.convModel.findOne(query).exec();
    if (existing) {
      if (existing.isClosed) {
        existing.isClosed = false;
        existing.closedBy = null;
        await existing.save();
      }
      return existing;
    }

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
    if (!Types.ObjectId.isValid(params.threadId)) {
      throw new NotFoundException('Conversation not found');
    }
    if (!params.body?.trim() && !params.attachmentFileIds?.length) {
      throw new BadRequestException('A message needs text or an attachment');
    }

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
      body: params.body?.trim() || null,
      attachments: (params.attachmentFileIds || []).map((fid) => ({
        fileId: new Types.ObjectId(fid),
      })),
      sentAt: new Date(),
    });

    const preview = params.body?.trim()
      ? params.body.trim().substring(0, 300)
      : '[attachment]';
    const recipientKey = recipientId.toString();
    const currentUnread = thread.unreadCounts.get(recipientKey) || 0;
    thread.unreadCounts.set(recipientKey, currentUnread + 1);
    thread.lastMessage = preview;
    thread.lastMessageAt = message.sentAt;
    thread.lastSenderId = senderOid;
    await thread.save();

    await this.notifications
      .create({
        userId: recipientKey,
        type: 'new_message',
        title: 'Nuovo messaggio',
        body: preview,
        data: { threadId: params.threadId },
      })
      .catch(() => undefined);

    return message;
  }

  async getThreads(userId: string): Promise<ThreadView[]> {
    const threads = await this.convModel
      .find({ participants: new Types.ObjectId(userId), isClosed: false })
      .sort({ lastMessageAt: -1 })
      .exec();

    if (!threads.length) return [];

    // Resolve the other participants so the UI can show a name instead of an id.
    const otherIds = new Set<string>();
    for (const t of threads) {
      for (const p of t.participants) {
        const id = p.toString();
        if (id !== userId) otherIds.add(id);
      }
    }
    const users = await this.userModel
      .find({ _id: { $in: [...otherIds] } })
      .select('_id fullName avatarUrl')
      .lean()
      .exec();
    const userById = new Map(users.map((u) => [u._id.toString(), u]));

    return threads.map((t) => {
      const others = t.participants
        .map((p) => p.toString())
        .filter((id) => id !== userId)
        .map((id) => {
          const u = userById.get(id);
          return {
            id,
            fullName: (u?.fullName as string) ?? 'Utente',
            avatarUrl: (u?.avatarUrl as string) ?? undefined,
          };
        });

      const lastSenderId = t.lastSenderId?.toString();
      return {
        _id: t._id.toString(),
        participants: others,
        // The UI reads lastMessage.body / .createdAt — the stored value is a
        // plain preview string plus lastMessageAt, so shape it here instead of
        // making every client know the storage detail.
        lastMessage: t.lastMessage
          ? {
              body: t.lastMessage,
              createdAt: (t.lastMessageAt ?? new Date()).toISOString(),
              senderId: lastSenderId ?? '',
            }
          : undefined,
        unreadCount: t.unreadCounts?.get(userId) ?? 0,
        context: t.context,
        isClosed: t.isClosed,
        updatedAt: (t.lastMessageAt ?? new Date()).toISOString(),
      };
    });
  }

  async getMessages(
    threadId: string,
    userId: string,
    cursor?: string,
    limit: number = 50,
  ): Promise<{ items: MessageDocument[]; nextCursor: string | null }> {
    if (!Types.ObjectId.isValid(threadId)) {
      throw new NotFoundException('Conversation not found');
    }
    const thread = await this.convModel.findById(threadId).exec();
    if (!thread) throw new NotFoundException('Conversation not found');
    if (!thread.participants.some((p) => p.equals(new Types.ObjectId(userId)))) {
      throw new ForbiddenException('Not a participant');
    }

    const matchStage: Record<string, unknown> = {
      threadId: new Types.ObjectId(threadId),
      deletedAt: null,
    };
    if (cursor && Types.ObjectId.isValid(cursor)) {
      matchStage._id = { $lt: new Types.ObjectId(cursor) };
    }

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const messages = await this.msgModel
      .find(matchStage)
      .sort({ sentAt: -1 })
      .limit(safeLimit + 1)
      .exec();

    const items = messages.slice(0, safeLimit);
    const nextCursor = messages.length > safeLimit ? messages[safeLimit]._id.toString() : null;

    const userOid = new Types.ObjectId(userId);
    await this.msgModel
      .updateMany(
        { threadId: new Types.ObjectId(threadId), recipientId: userOid, readAt: null },
        { $set: { readAt: new Date() } },
      )
      .exec();
    thread.unreadCounts.set(userId, 0);
    await thread.save();

    return { items, nextCursor };
  }

  async markThreadRead(threadId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(threadId)) return;
    const userOid = new Types.ObjectId(userId);
    await this.msgModel
      .updateMany(
        { threadId: new Types.ObjectId(threadId), recipientId: userOid, readAt: null },
        { $set: { readAt: new Date() } },
      )
      .exec();
    const thread = await this.convModel.findById(threadId).exec();
    if (thread) {
      thread.unreadCounts.set(userId, 0);
      await thread.save();
    }
  }

  async closeThread(threadId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(threadId)) {
      throw new NotFoundException('Conversation not found');
    }
    const thread = await this.convModel.findById(threadId).exec();
    if (!thread) throw new NotFoundException('Conversation not found');
    // Only a participant may close a thread.
    if (!thread.participants.some((p) => p.equals(new Types.ObjectId(userId)))) {
      throw new ForbiddenException('Not a participant in this conversation');
    }
    thread.isClosed = true;
    thread.closedBy = new Types.ObjectId(userId);
    await thread.save();
  }

  async getUnreadCount(userId: string): Promise<number> {
    const threads = await this.convModel
      .find({ participants: new Types.ObjectId(userId), isClosed: false })
      .exec();
    let total = 0;
    for (const t of threads) {
      total += t.unreadCounts.get(userId) || 0;
    }
    return total;
  }
}
