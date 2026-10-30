import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application, ApplicationDocument } from './schemas/application.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Speciality } from '../specialities/schemas/speciality.schema';
import { MatchingService } from '../matching/matching.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectModel(Application.name) private applicationModel: Model<Application>,
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Speciality.name) private specialityModel: Model<Speciality>,
    private matchingService: MatchingService,
    private notifications: NotificationsService,
    private audit: AuditService,
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

    // Resolve names once, at apply time: this snapshot is the record shown to
    // admins later, and speciality labels must not depend on the post still
    // existing or still being published.
    const specialityDocs = await this.specialityModel
      .find({ _id: { $in: post.specialityIds ?? [] } })
      .select('name')
      .lean()
      .exec();

    const snapshot = {
      postTitle: post.title,
      postSlug: post.slug || undefined,
      companyName: post.company?.name || 'Unknown',
      city: post.location?.city,
      specialityNames: specialityDocs.map((s) => s.name as string),
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

    // Tell the admins someone applied, and record it for the audit trail.
    // Failures here must not fail the application itself, but they are logged
    // rather than silently discarded (a swallowed error hid a schema mismatch).
    await this.notifications
      .notifyAdmins({
        type: 'application_status',
        title: 'Nuova candidatura',
        body: `${doc.snapshot.postTitle} — nuova candidatura ricevuta.`,
        data: { applicationId: doc._id.toString(), postId },
        exceptUserId: userId,
      })
      .catch((err) => this.logger.warn(`Admin notification failed: ${err?.message ?? err}`));

    await this.audit
      .record({
        actorId: userId,
        actorRole: 'worker',
        action: 'create',
        entity: 'application',
        entityId: doc._id.toString(),
        after: { postId, status: 'submitted' },
      })
      .catch((err) => this.logger.warn(`Audit record failed: ${err?.message ?? err}`));

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

  /**
   * Application detail with an ownership check.
   * A worker may only read their own application; admins may read any.
   */
  async findByIdForUser(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<ApplicationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Application not found');
    }
    const app = await this.applicationModel.findById(id).exec();
    if (!app) throw new NotFoundException('Application not found');
    if (userRole !== 'admin' && app.userId.toString() !== userId) {
      throw new ForbiddenException('You cannot view another user\'s application');
    }
    return app;
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

    const previousStatus = app.status;

    app.status = status;
    app.reviewedBy = new Types.ObjectId(adminId);
    app.reviewedAt = new Date();
    if (reviewNotes) app.reviewNotes = reviewNotes;
    app.statusHistory.push({
      // Capture the status before the transition — reading app.status here
      // after assignment recorded "accepted -> accepted" in every audit trail.
      from: previousStatus,
      to: status,
      actorId: new Types.ObjectId(adminId),
      actorRole: 'admin',
      note: reviewNotes || undefined,
      at: new Date(),
    });
    await app.save();

    // Notify the worker their application changed — the whole point of
    // the status pipeline for the customer using this product.
    // Guarded: legacy rows may predate the userId field.
    const statusLabels: Record<string, string> = {
      reviewed: 'esaminata',
      accepted: 'accettata',
      rejected: 'rifiutata',
    };
    if (app.userId) {
      await this.notifications
        .create({
          userId: app.userId.toString(),
          type: 'application_status',
          title: 'Aggiornamento candidatura',
          body: `${app.snapshot?.postTitle ?? 'Candidatura'}: la tua candidatura è stata ${statusLabels[status] ?? status}.`,
          data: {
            applicationId: app._id.toString(),
            postId: app.postId?.toString(),
            status,
          },
        })
        .catch((err) => this.logger.warn(`Worker notification failed: ${err?.message ?? err}`));
    }

    await this.audit
      .record({
        actorId: adminId,
        actorRole: 'admin',
        action: 'status_change',
        entity: 'application',
        entityId: app._id?.toString(),
        before: { status: previousStatus },
        after: { status },
      })
      .catch((err) => this.logger.warn(`Audit record failed: ${err?.message ?? err}`));

    return app;
  }
}