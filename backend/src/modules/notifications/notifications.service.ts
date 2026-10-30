import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private model: Model<Notification>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(params: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<NotificationDocument> {
    return this.model.create({
      userId: new Types.ObjectId(params.userId),
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data || {},
    });
  }

  /** Sends one notification to every active admin. */
  async notifyAdmins(params: {
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    exceptUserId?: string;
  }): Promise<number> {
    const admins = await this.userModel
      .find({ role: 'admin', isActive: true, deletedAt: null })
      .select('_id')
      .exec();

    const recipients = admins.filter(
      (a) => a._id.toString() !== params.exceptUserId,
    );
    if (!recipients.length) return 0;

    await this.model.insertMany(
      recipients.map((a) => ({
        userId: a._id,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data || {},
      })),
    );
    return recipients.length;
  }

  /** Sends one notification to every active user (optionally workers only). */
  async broadcast(params: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    audience?: 'all' | 'workers' | 'admins';
  }): Promise<number> {
    const query: Record<string, unknown> = { isActive: true, deletedAt: null };
    if (params.audience === 'workers') query.role = 'worker';
    if (params.audience === 'admins') query.role = 'admin';

    const users = await this.userModel.find(query).select('_id').exec();
    if (!users.length) return 0;

    await this.model.insertMany(
      users.map((u) => ({
        userId: u._id,
        type: 'admin_broadcast',
        title: params.title,
        body: params.body,
        data: params.data || {},
      })),
    );
    return users.length;
  }

  async findByUser(userId: string, limit: number = 50): Promise<NotificationDocument[]> {
    return this.model
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await this.model
      .updateOne(
        { _id: notificationId, userId: new Types.ObjectId(userId), readAt: null },
        { $set: { readAt: new Date() } },
      )
      .exec();
  }

  async markAllRead(userId: string): Promise<void> {
    await this.model
      .updateMany(
        { userId: new Types.ObjectId(userId), readAt: null },
        { $set: { readAt: new Date() } },
      )
      .exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.model
      .countDocuments({ userId: new Types.ObjectId(userId), readAt: null })
      .exec();
  }
}
