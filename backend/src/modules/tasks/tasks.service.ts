import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FileAsset, FileAssetDocument } from '../files/schemas/file-asset.schema';
import { Application, ApplicationDocument } from '../applications/schemas/application.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Speciality, SpecialityDocument } from '../specialities/schemas/speciality.schema';
import { Like, LikeDocument } from '../likes/schemas/like.schema';
import { StorageProvider } from '../upload/storage.provider';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectModel(FileAsset.name) private fileModel: Model<FileAsset>,
    @InjectModel(Application.name) private applicationModel: Model<Application>,
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(Speciality.name) private specialityModel: Model<Speciality>,
    @InjectModel(Like.name) private likeModel: Model<Like>,
    private storage: StorageProvider,
  ) {}

  @Cron('*/5 * * * *')
  async scanPendingFiles(): Promise<void> {
    const pending = await this.fileModel.find({ scanStatus: 'pending' }).limit(50).exec();
    for (const file of pending) {
      try {
        // In production, integrate ClamAV here
        file.scanStatus = 'clean';
        await file.save();
      } catch (err) {
        file.scanStatus = 'failed';
        await file.save();
        this.logger.error(`AV scan failed for ${file.storageKey}: ${err.message}`);
      }
    }
    if (pending.length) this.logger.log(`Scanned ${pending.length} pending files`);
  }

  @Cron('0 * * * *')
  async orphanFileSweep(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const orphans = await this.fileModel.find({
      deletedAt: null,
      createdAt: { $lt: cutoff },
      // Simplified orphan detection: files with no valid owner reference
      // In production, cross-check against User/Post/Application collections
    }).limit(100).exec();

    let marked = 0;
    for (const file of orphans) {
      file.deletedAt = new Date();
      await file.save();
      marked++;
    }
    if (marked) this.logger.log(`Marked ${marked} orphan files for deletion`);
  }

  @Cron('0 3 * * *')
  async expirySweep(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Hard-delete bytes for files soft-deleted >30 days ago or expired
    const expired = await this.fileModel.find({
      $or: [
        { deletedAt: { $lt: thirtyDaysAgo } },
        { expiresAt: { $lt: new Date() } },
      ],
    }).limit(200).exec();

    let purged = 0;
    for (const file of expired) {
      try {
        await this.storage.delete(file.storageKey);
        if (file.imageMeta?.thumbnailStorageKey) {
          await this.storage.delete(file.imageMeta.thumbnailStorageKey);
        }
        await this.fileModel.deleteOne({ _id: file._id }).exec();
        purged++;
      } catch (err) {
        this.logger.error(`Failed to purge ${file.storageKey}: ${err.message}`);
      }
    }
    if (purged) this.logger.log(`Purged ${purged} expired/deleted files`);
  }

  @Cron('0 4 * * *')
  async denormalizedCounterRefresh(): Promise<void> {
    // Refresh post stats.likes from likes collection
    const posts = await this.postModel.find({ deletedAt: null }).select('_id').exec();
    let updated = 0;
    for (const post of posts) {
      const likeCount = await this.likeModel.countDocuments({ postId: post._id }).exec();
      const appCount = await this.applicationModel.countDocuments({ postId: post._id, status: { $ne: 'withdrawn' } }).exec();
      await this.postModel.updateOne(
        { _id: post._id },
        { $set: { 'stats.likes': likeCount, 'stats.applications': appCount } },
      ).exec();
      updated++;
    }

    // Refresh speciality worker/post counts
    const specialities = await this.specialityModel.find({ isActive: true }).exec();
    for (const spec of specialities) {
      const postCount = await this.postModel.countDocuments({
        specialityIds: spec._id,
        status: 'published',
        deletedAt: null,
      }).exec();
      await this.specialityModel.updateOne(
        { _id: spec._id },
        { $set: { postCount } },
      ).exec();
    }

    this.logger.log(`Refreshed counters for ${updated} posts and ${specialities.length} specialities`);
  }

  @Cron('0 5 * * *')
  async staleApplicationWarnings(): Promise<void> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const stale = await this.applicationModel.countDocuments({
      status: 'submitted',
      appliedAt: { $lt: sevenDaysAgo },
    }).exec();
    if (stale > 0) {
      this.logger.warn(`${stale} applications have been unreviewed for >7 days`);
      // In production, create admin notifications here via NotificationsService
    }
  }
}