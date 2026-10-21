import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

@Injectable()
export class AuditService {
  constructor(@InjectModel(AuditLog.name) private model: Model<AuditLog>) {}

  async record(params: {
    actorId: string;
    actorRole: string;
    action: string;
    entity: string;
    entityId?: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
  }): Promise<AuditLogDocument> {
    return this.model.create({
      actorId: new Types.ObjectId(params.actorId),
      actorRole: params.actorRole,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ? new Types.ObjectId(params.entityId) : null,
      before: params.before || null,
      after: params.after || null,
      ip: params.ip || null,
      userAgent: params.userAgent || null,
    });
  }

  async findAll(filters: {
    actorId?: string;
    entity?: string;
    action?: string;
    from?: string;
    to?: string;
    page: number;
    limit: number;
  }): Promise<{ items: AuditLogDocument[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (filters.actorId) query.actorId = new Types.ObjectId(filters.actorId);
    if (filters.entity) query.entity = filters.entity;
    if (filters.action) query.action = filters.action;
    if (filters.from || filters.to) {
      query.createdAt = {};
      if (filters.from) (query.createdAt as any).$gte = new Date(filters.from);
      if (filters.to) (query.createdAt as any).$lte = new Date(filters.to);
    }

    const [items, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);
    return { items, total };
  }
}