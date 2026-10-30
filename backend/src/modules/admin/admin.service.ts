import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Application, ApplicationDocument } from '../applications/schemas/application.schema';
import { Speciality, SpecialityDocument } from '../specialities/schemas/speciality.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(Application.name) private applicationModel: Model<Application>,
    @InjectModel(Speciality.name) private specialityModel: Model<Speciality>,
  ) {}

  async getDashboardStats(): Promise<Record<string, unknown>> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeWorkers,
      totalPosts,
      publishedPosts,
      totalApplications,
      acceptedApplications,
      rejectedApplications,
      recentSignups,
      recentPosts,
      recentApplications,
    ] = await Promise.all([
      this.userModel.countDocuments({ deletedAt: null }).exec(),
      this.userModel.countDocuments({ role: 'worker', isActive: true, deletedAt: null }).exec(),
      this.postModel.countDocuments({ deletedAt: null }).exec(),
      this.postModel.countDocuments({ status: 'published', deletedAt: null }).exec(),
      this.applicationModel.countDocuments().exec(),
      this.applicationModel.countDocuments({ status: 'accepted' }).exec(),
      this.applicationModel.countDocuments({ status: 'rejected' }).exec(),
      this.userModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, deletedAt: null }).exec(),
      this.postModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, deletedAt: null }).exec(),
      this.applicationModel.countDocuments({ appliedAt: { $gte: thirtyDaysAgo } }).exec(),
    ]);

    return {
      totals: {
        users: totalUsers,
        activeWorkers,
        posts: totalPosts,
        publishedPosts,
        applications: totalApplications,
        acceptedApplications,
        rejectedApplications,
      },
      last30Days: {
        signups: recentSignups,
        posts: recentPosts,
        applications: recentApplications,
      },
      acceptanceRate: totalApplications > 0
        ? Math.round((acceptedApplications / totalApplications) * 100)
        : 0,
    };
  }

  async getSpecialityDemand(): Promise<{ name: string; postCount: number; applicationCount: number }[]> {
    const pipeline = [
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'posts',
          let: { sid: '$_id' },
          pipeline: [
            { $match: { $expr: { $in: ['$$sid', '$specialityIds'] }, status: 'published', deletedAt: null } },
            { $count: 'count' },
          ],
          as: 'postCounts',
        },
      },
      {
        $lookup: {
          from: 'applications',
          let: { sid: '$_id' },
          pipeline: [
            { $match: { $expr: { $in: ['$$sid', '$snapshot.specialityNames'] } } },
            { $count: 'count' },
          ],
          as: 'appCounts',
        },
      },
      {
        $project: {
          name: 1,
          postCount: { $ifNull: [{ $arrayElemAt: ['$postCounts.count', 0] }, 0] },
          applicationCount: { $ifNull: [{ $arrayElemAt: ['$appCounts.count', 0] }, 0] },
        },
      },
      { $sort: { applicationCount: -1 as const } },
      { $limit: 10 },
    ];
    return this.specialityModel.aggregate(pipeline).exec();
  }

  async getTopPosts(limit: number = 10): Promise<PostDocument[]> {
    return this.postModel
      .find({ status: 'published', deletedAt: null })
      .sort({ 'stats.applications': -1 })
      .limit(limit)
      .exec();
  }

  async getApplicationFunnel(): Promise<Record<string, number>> {
    const statuses = ['submitted', 'reviewed', 'accepted', 'rejected', 'withdrawn'];
    const counts = await Promise.all(
      statuses.map((s) => this.applicationModel.countDocuments({ status: s }).exec()),
    );
    const result: Record<string, number> = {};
    statuses.forEach((s, i) => { result[s] = counts[i]; });
    return result;
  }
}