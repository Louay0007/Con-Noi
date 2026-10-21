import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '../posts/schemas/post.schema';

@Injectable()
export class MatchingService {
  constructor(@InjectModel(Post.name) private postModel: Model<Post>) {}

  async findForYou(
    userId: string,
    specialityIds: string[],
    city?: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<{ items: PostDocument[]; nextCursor: string | null }> {
    if (!specialityIds.length) {
      const items = await this.postModel
        .find({ status: 'published', deletedAt: null })
        .sort({ publishedAt: -1 })
        .limit(limit + 1)
        .exec();
      return {
        items: items.slice(0, limit),
        nextCursor: items.length > limit ? items[limit]._id.toString() : null,
      };
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const matchStage: Record<string, unknown> = {
      status: 'published',
      deletedAt: null,
      specialityIds: { $in: specialityIds.map((id) => new Types.ObjectId(id)) },
      $or: [
        { applicationDeadline: null },
        { applicationDeadline: { $gte: now } },
      ],
    };

    if (cursor) {
      matchStage._id = { $lt: new Types.ObjectId(cursor) };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          matchedCount: {
            $size: {
              $setIntersection: [
                '$specialityIds',
                specialityIds.map((id) => new Types.ObjectId(id)),
              ],
            },
          },
          overlapRatio: {
            $cond: [
              { $gt: [{ $size: '$specialityIds' }, 0] },
              {
                $divide: [
                  {
                    $size: {
                      $setIntersection: [
                        '$specialityIds',
                        specialityIds.map((id) => new Types.ObjectId(id)),
                      ],
                    },
                  },
                  { $size: '$specialityIds' },
                ],
              },
              0,
            ],
          },
          coverageRatio: {
            $cond: [
              { $gt: [specialityIds.length, 0] },
              {
                $divide: [
                  {
                    $size: {
                      $setIntersection: [
                        '$specialityIds',
                        specialityIds.map((id) => new Types.ObjectId(id)),
                      ],
                    },
                  },
                  specialityIds.length,
                ],
              },
              0,
            ],
          },
          recencyScore: {
            $switch: {
              branches: [
                { case: { $gte: ['$publishedAt', sevenDaysAgo] }, then: 1.0 },
                { case: { $gte: ['$publishedAt', thirtyDaysAgo] }, then: 0.7 },
              ],
              default: 0.4,
            },
          },
          proximityScore: {
            $cond: [
              { $eq: ['$location.city', city || ''] },
              1.0,
              {
                $cond: [
                  { $eq: ['$location.province', city || ''] },
                  0.6,
                  0.2,
                ],
              },
            ],
          },
          featuredBoost: { $cond: ['$isFeatured', 0.5, 0] },
          urgentBoost: { $cond: ['$isUrgent', 0.25, 0] },
          score: {
            $add: [
              { $multiply: ['$overlapRatio', 4] },
              { $multiply: ['$coverageRatio', 1.5] },
              { $multiply: ['$recencyScore', 2] },
              { $multiply: ['$proximityScore', 0.5] },
              '$featuredBoost',
              '$urgentBoost',
            ],
          },
        },
      },
      { $sort: { score: -1 as const, publishedAt: -1 as const, _id: -1 as const } },
      { $limit: limit + 1 },
    ];

    const results = await this.postModel.aggregate(pipeline).exec();
    const items = results.slice(0, limit);
    const nextCursor =
      results.length > limit ? results[limit]._id.toString() : null;

    return { items, nextCursor };
  }

  async incrementView(postId: string): Promise<void> {
    await this.postModel
      .updateOne({ _id: postId }, { $inc: { 'stats.views': 1 } })
      .exec();
  }

  async updateLikeCount(postId: string, delta: number): Promise<void> {
    await this.postModel
      .updateOne({ _id: postId }, { $inc: { 'stats.likes': delta } })
      .exec();
  }

  async updateApplicationCount(postId: string, delta: number): Promise<void> {
    await this.postModel
      .updateOne({ _id: postId }, { $inc: { 'stats.applications': delta } })
      .exec();
  }
}