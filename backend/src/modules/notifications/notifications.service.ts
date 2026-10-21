import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel(Notification.name) private model: Model<Notification>) {}

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

  async notifyAdmins(params: {
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    exceptUserId?: string;
  }): Promise<void> {
    // In production, query admin user IDs; here we accept pre-resolved list or broadcast
    // For simplicity, this method is a placeholder for batch admin notification
  }

  async broadcast(params: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<number> {
    // Broadcast creates one notification per active user
    // Implementation requires UsersService injection; simplified here
    return 0;
  }

  async findByUser(userId: string, limit: number = 50): Promise<NotificationDocument[]> {
    return this.model
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await this.model.updateOne(
      { _id: notificationId, userId: new Types.ObjectId(userId), readAt: null },
      { $set: { readAt: new Date() } },
    ).exec();
  }

  async markAllRead(userId: string): Promise<void> {
    await this.model.updateMany(
      { userId: new Types.ObjectId(userId), readAt: null },
      { $set: { readAt: new Date() } },
    ).exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.model.countDocuments({
      userId: new Types.ObjectId(userId),
      readAt: null,
    }).exec();
  }
}