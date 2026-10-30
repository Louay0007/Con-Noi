import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

export type AuditEntry = {
  _id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
};

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
      entityId: params.entityId && Types.ObjectId.isValid(params.entityId)
        ? new Types.ObjectId(params.entityId)
        : null,
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
  }): Promise<{ items: AuditEntry[]; total: number; page: number; limit: number }> {
    const query: Record<string, unknown> = {};
    if (filters.actorId && Types.ObjectId.isValid(filters.actorId)) {
      query.actorId = new Types.ObjectId(filters.actorId);
    }
    if (filters.entity) query.entity = filters.entity;
    if (filters.action) query.action = filters.action;
    if (filters.from || filters.to) {
      const createdAt: { $gte?: Date; $lte?: Date } = {};
      if (filters.from) createdAt.$gte = new Date(filters.from);
      if (filters.to) createdAt.$lte = new Date(filters.to);
      query.createdAt = createdAt;
    }

    const page = Math.max(1, filters.page);
    const limit = Math.min(100, Math.max(1, filters.limit));
    const [docs, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);
    const items: AuditEntry[] = docs.map((d) => {
      const raw = d as unknown as {
        _id: Types.ObjectId;
        actorId: Types.ObjectId;
        actorRole: string;
        action: string;
        entity: string;
        entityId?: Types.ObjectId | null;
        before?: Record<string, unknown> | null;
        after?: Record<string, unknown> | null;
        ip?: string | null;
        userAgent?: string | null;
        createdAt?: Date;
      };
      return {
        _id: raw._id.toString(),
        timestamp: raw.createdAt ? raw.createdAt.toISOString() : new Date().toISOString(),
        actor: raw.actorId.toString(),
        actorRole: raw.actorRole,
        action: raw.action,
        entity: raw.entity,
        entityId: raw.entityId ? raw.entityId.toString() : '',
        before: raw.before ?? undefined,
        after: raw.after ?? undefined,
        ip: raw.ip ?? undefined,
        userAgent: raw.userAgent ?? undefined,
      };
    });
    return { items, total, page, limit };
  }
}