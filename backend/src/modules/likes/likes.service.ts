import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Like, LikeDocument } from './schemas/like.schema';
import { MatchingService } from '../matching/matching.service';

@Injectable()
export class LikesService {
  constructor(
    @InjectModel(Like.name) private likeModel: Model<Like>,
    private matchingService: MatchingService,
  ) {}

  async toggle(userId: string, postId: string): Promise<{ liked: boolean }> {
    const existing = await this.likeModel.findOne({
      userId: new Types.ObjectId(userId),
      postId: new Types.ObjectId(postId),
    }).exec();

    if (existing) {
      await this.likeModel.deleteOne({ _id: existing._id }).exec();
      await this.matchingService.updateLikeCount(postId, -1);
      return { liked: false };
    }

    await this.likeModel.create({
      userId: new Types.ObjectId(userId),
      postId: new Types.ObjectId(postId),
    });
    await this.matchingService.updateLikeCount(postId, 1);
    return { liked: true };
  }

  async getLikedIds(userId: string): Promise<string[]> {
    const likes = await this.likeModel.find({
      userId: new Types.ObjectId(userId),
    }).select('postId').exec();
    return likes.map((l) => l.postId.toString());
  }

  async isLiked(userId: string, postId: string): Promise<boolean> {
    const exists = await this.likeModel.findOne({
      userId: new Types.ObjectId(userId),
      postId: new Types.ObjectId(postId),
    }).exec();
    return !!exists;
  }
}