import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto, UpdatePostDto, PostFilterDto } from './dto/post.dto';
import { MatchingService } from '../matching/matching.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    private matchingService: MatchingService,
  ) {}

  async create(dto: CreatePostDto, adminId: string): Promise<PostDocument> {
    const doc = await this.postModel.create({
      ...dto,
      specialityIds: dto.specialityIds.map((id) => new Types.ObjectId(id)),
      createdBy: new Types.ObjectId(adminId),
      status: dto.status || 'draft',
      publishedAt: dto.status === 'published' ? new Date() : null,
    });
    return doc;
  }

  async update(id: string, dto: UpdatePostDto, adminId: string): Promise<PostDocument> {
    const post = await this.postModel.findById(id);
    if (!post || post.deletedAt) throw new NotFoundException('Post not found');

    Object.assign(post, dto);
    if (dto.specialityIds) {
      post.specialityIds = dto.specialityIds.map((sid) => new Types.ObjectId(sid));
    }
    post.updatedBy = new Types.ObjectId(adminId);
    await post.save();
    return post;
  }

  async changeStatus(id: string, action: string, adminId: string): Promise<PostDocument> {
    const post = await this.postModel.findById(id);
    if (!post || post.deletedAt) throw new NotFoundException('Post not found');

    const transitions: Record<string, { from: string[]; to: string }> = {
      publish: { from: ['draft'], to: 'published' },
      close: { from: ['published'], to: 'closed' },
      archive: { from: ['published', 'closed'], to: 'archived' },
      restore: { from: ['archived'], to: 'published' },
    };

    const rule = transitions[action];
    if (!rule) throw new BadRequestException(`Invalid action: ${action}`);
    if (!rule.from.includes(post.status)) {
      throw new BadRequestException(`Cannot ${action} from status ${post.status}`);
    }

    if (action === 'publish') {
      if (!post.title || !post.description || !post.specialityIds?.length || !post.location?.city || !post.employmentType || !post.company?.name) {
        throw new BadRequestException('Post missing required fields for publishing');
      }
      post.publishedAt = new Date();
    }

    post.status = rule.to;
    post.updatedBy = new Types.ObjectId(adminId);
    await post.save();
    return post;
  }

  async softDelete(id: string, adminId: string): Promise<void> {
    const post = await this.postModel.findById(id);
    if (!post) throw new NotFoundException('Post not found');
    post.deletedAt = new Date();
    post.status = 'archived';
    post.updatedBy = new Types.ObjectId(adminId);
    await post.save();
  }

  async findById(id: string): Promise<PostDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.postModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  async findPublished(filters: PostFilterDto, page: number, limit: number): Promise<{ items: PostDocument[]; total: number }> {
    const query: Record<string, unknown> = { status: 'published', deletedAt: null };

    if (filters.specialityIds?.length) {
      query.specialityIds = { $in: filters.specialityIds.map((id) => new Types.ObjectId(id)) };
    }
    if (filters.city) query['location.city'] = { $regex: filters.city, $options: 'i' };
    if (filters.employmentType) query.employmentType = filters.employmentType;
    if (filters.remote !== undefined) query['location.remote'] = filters.remote;
    if (filters.salaryMin !== undefined || filters.salaryMax !== undefined) {
      query['salary.max'] = {};
      if (filters.salaryMin !== undefined) (query['salary.max'] as any).$gte = filters.salaryMin;
      if (filters.salaryMax !== undefined) (query['salary.max'] as any).$lte = filters.salaryMax;
    }
    if (filters.q) query.$text = { $search: filters.q };

    let sortObj: Record<string, 1 | -1> = { publishedAt: -1 };
    if (filters.sort === 'salary') sortObj = { 'salary.max': -1 };

    const [items, total] = await Promise.all([
      this.postModel.find(query).sort(sortObj).skip((page - 1) * limit).limit(limit).exec(),
      this.postModel.countDocuments(query).exec(),
    ]);

    return { items, total };
  }

  async findForYou(userId: string, specialityIds: string[], city?: string, cursor?: string, limit: number = 20) {
    return this.matchingService.findForYou(userId, specialityIds, city, cursor, limit);
  }

  async incrementView(postId: string): Promise<void> {
    await this.matchingService.incrementView(postId);
  }
}