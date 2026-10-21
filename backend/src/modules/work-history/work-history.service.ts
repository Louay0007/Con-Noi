import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkHistory, WorkHistoryDocument } from './schemas/work-history.schema';
import { CreateWorkHistoryDto, UpdateWorkHistoryDto } from './dto/work-history.dto';

@Injectable()
export class WorkHistoryService {
 constructor(@InjectModel(WorkHistory.name) private model: Model<WorkHistory>) {}

 async create(userId: string, dto: CreateWorkHistoryDto): Promise<WorkHistoryDocument> {
  if (dto.endDate && dto.startDate) {
   const start = new Date(dto.startDate);
   const end = new Date(dto.endDate);
   if (end <= start) throw new BadRequestException('endDate must be after startDate');
  }
  if (dto.isCurrent && dto.endDate) {
   throw new BadRequestException('Current role cannot have an endDate');
  }

  const count = await this.model.countDocuments({ userId: new Types.ObjectId(userId), deletedAt: null }).exec();
  if (count >= 30) throw new BadRequestException('Maximum 30 work history entries allowed');

  if (dto.isCurrent) {
   await this.model.updateMany(
    { userId: new Types.ObjectId(userId), isCurrent: true, deletedAt: null },
    { isCurrent: false },
   ).exec();
  }

  return this.model.create({
   ...dto,
   userId: new Types.ObjectId(userId),
   specialityIds: (dto.specialityIds || []).map((id) => new Types.ObjectId(id)),
   attachmentFileIds: (dto.attachmentFileIds || []).map((id) => new Types.ObjectId(id)),
   startDate: new Date(dto.startDate),
   endDate: dto.endDate ? new Date(dto.endDate) : null,
   sortOrder: count,
  });
 }

 async update(userId: string, id: string, dto: UpdateWorkHistoryDto): Promise<WorkHistoryDocument> {
  const doc = await this.model.findOne({ _id: id, userId: new Types.ObjectId(userId), deletedAt: null }).exec();
  if (!doc) throw new NotFoundException('Work history entry not found');

  if (dto.endDate && dto.startDate) {
   const start = new Date(dto.startDate);
   const end = new Date(dto.endDate);
   if (end <= start) throw new BadRequestException('endDate must be after startDate');
  }
  if (dto.isCurrent && dto.endDate) {
   throw new BadRequestException('Current role cannot have an endDate');
  }

  if (dto.isCurrent && !doc.isCurrent) {
   await this.model.updateMany(
    { userId: new Types.ObjectId(userId), isCurrent: true, deletedAt: null, _id: { $ne: doc._id } },
    { isCurrent: false },
   ).exec();
  }

  Object.assign(doc, dto);
  if (dto.specialityIds) doc.specialityIds = dto.specialityIds.map((sid) => new Types.ObjectId(sid));
  if (dto.attachmentFileIds) doc.attachmentFileIds = dto.attachmentFileIds.map((fid) => new Types.ObjectId(fid));
  if (dto.startDate) doc.startDate = new Date(dto.startDate);
  if (dto.endDate !== undefined) (doc as any).endDate = dto.endDate ? new Date(dto.endDate) : null;

  await doc.save();
  return doc;
 }

 async remove(userId: string, id: string): Promise<void> {
  const doc = await this.model.findOne({ _id: id, userId: new Types.ObjectId(userId), deletedAt: null }).exec();
  if (!doc) throw new NotFoundException('Work history entry not found');
  (doc as any).deletedAt = new Date();
  await doc.save();
 }

 async findAll(userId: string): Promise<WorkHistoryDocument[]> {
  return this.model
   .find({ userId: new Types.ObjectId(userId), deletedAt: null })
   .sort({ sortOrder: 1, startDate: -1 })
   .exec();
 }

 async reorder(userId: string, ids: string[]): Promise<void> {
  const ops = ids.map((id, index) => ({
   updateOne: {
    filter: { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId), deletedAt: null },
    update: { $set: { sortOrder: index } },
   },
  }));
  if (ops.length) await this.model.bulkWrite(ops);
 }
}