import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { Application, ApplicationDocument } from './schemas/application.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { MatchingService } from '../matching/matching.service';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(Application.name) private applicationModel: Model<Application>,
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(User.name) private userModel: Model<User>,
    private matchingService: MatchingService,
  ) {}

  async apply(
    postId: string,
    userId: string,
    data: { coverLetter?: string; attachmentFileIds?: string[]; contact?: { phone?: string; email?: string; availabilityNote?: string } },
    resumeFileId?: string | null,
  ): Promise<ApplicationDocument> {
    const post = await this.postModel.findOne({ _id: postId, deletedAt: null }).exec();
    if (!post) throw new NotFoundException('Post not found');
    if (post.status !== 'published') throw new BadRequestException('Post is not accepting applications');
    if (post.applicationDeadline && post.applicationDeadline < new Date()) {
      throw new BadRequestException('Application deadline has passed');
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.isActive) throw new ForbiddenException('User account is not active');

    const existing = await this.applicationModel.findOne({
      userId: new Types.ObjectId(userId),
      postId: new Types.ObjectId(postId),
    }).exec();
    if (existing) throw new BadRequestException('You have already applied to this post');

    const snapshot = {
      postTitle: post.title,
      postSlug: post.slug || undefined,
      companyName: post.company?.name || 'Unknown',
      city: post.location?.city,
      specialityNames: [] as string[],
      employmentType: post.employmentType,
    };

    const doc = await this.applicationModel.create({
      postId: new Types.ObjectId(postId),
      userId: new Types.ObjectId(userId),
      snapshot,
      coverLetter: data.coverLetter || null,
      attachmentFileIds: (data.attachmentFileIds || []).map((id) => new Types.ObjectId(id)),
      resumeFileId: resumeFileId ? new Types.ObjectId(resumeFileId) : null,
      status: 'submitted',
      statusHistory: [{
        to: 'submitted',
        actorId: new Types.ObjectId(userId),
        actorRole: 'worker',
        at: new Date(),
      }],
      contact: data.contact || null,
      appliedAt: new Date(),
    });

    await this.matchingService.updateApplicationCount(postId, 1);
    return doc;
  }

  async withdraw(applicationId: string, userId: string): Promise<ApplicationDocument> {
    const app = await this.applicationModel.findById(applicationId).exec();
    if (!app) throw new NotFoundException('Application not found');
    if (app.userId.toString() !== userId) throw new ForbiddenException('Cannot withdraw another user\'s application');
    if (app.status !== 'submitted') throw new BadRequestException(`Cannot withdraw application in status ${app.status}`);

    app.status = 'withdrawn';
    app.withdrawnAt = new Date();
    app.statusHistory.push({
      from: 'submitted',
      to: 'withdrawn',
      actorId: new Types.ObjectId(userId),
      actorRole: 'worker',
      at: new Date(),
    });
    await app.save();
    await this.matchingService.updateApplicationCount(app.postId.toString(), -1);
    return app;
  }

  async findMine(userId: string, status?: string): Promise<ApplicationDocument[]> {
    const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    if (status) query.status = status;
    return this.applicationModel.find(query).sort({ appliedAt: -1 }).exec();
  }

  async findById(id: string): Promise<ApplicationDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.applicationModel.findById(id).exec();
  }

  async findAll(filters: {
    status?: string;
    postId?: string;
    page: number;
    limit: number;
  }): Promise<{ items: ApplicationDocument[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (filters.status) query.status = filters.status;
    if (filters.postId) query.postId = new Types.ObjectId(filters.postId);

    const [items, total] = await Promise.all([
      this.applicationModel.find(query).sort({ appliedAt: -1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit).exec(),
      this.applicationModel.countDocuments(query).exec(),
    ]);
    return { items, total };
  }

  async review(
    applicationId: string,
    adminId: string,
    status: 'reviewed' | 'accepted' | 'rejected',
    reviewNotes?: string,
  ): Promise<ApplicationDocument> {
    const app = await this.applicationModel.findById(applicationId).exec();
    if (!app) throw new NotFoundException('Application not found');

    const validTransitions: Record<string, string[]> = {
      submitted: ['reviewed', 'accepted', 'rejected'],
      reviewed: ['accepted', 'rejected'],
    };
    const allowed = validTransitions[app.status];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${app.status} to ${status}`);
    }

    app.status = status;
    app.reviewedBy = new Types.ObjectId(adminId);
    app.reviewedAt = new Date();
    if (reviewNotes) app.reviewNotes = reviewNotes;
    app.statusHistory.push({
      from: app.status,
      to: status,
      actorId: new Types.ObjectId(adminId),
      actorRole: 'admin',
      note: reviewNotes || undefined,
      at: new Date(),
    });
    await app.save();
    return app;
  }
}