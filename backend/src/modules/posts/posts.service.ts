import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto, UpdatePostDto, PostFilterDto } from './dto/post.dto';
import { MatchingService } from '../matching/matching.service';
import { Speciality } from '../specialities/schemas/speciality.schema';

/** A post plus the human-readable speciality names for its ids. */
export type HydratedPost = Record<string, unknown> & {
  specialityNames?: string[];
};

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(Speciality.name) private specialityModel: Model<Speciality>,
    private matchingService: MatchingService,
  ) {}

  /**
   * Attaches `specialityNames` to each post.
   *
   * The API stores only ids, so every card rendered raw Mongo ids as chips.
   * Resolving names server-side keeps the frontend free of a second request
   * per card and keeps the label consistent everywhere.
   */
  private async hydrate(
    docs: Array<PostDocument | Record<string, unknown>>,
  ): Promise<HydratedPost[]> {
    if (!docs.length) return [];

    const ids = new Set<string>();
    for (const d of docs) {
      const list = (d as { specialityIds?: Types.ObjectId[] }).specialityIds ?? [];
      for (const id of list) ids.add(id.toString());
    }

    const specialities = ids.size
      ? await this.specialityModel
          .find({ _id: { $in: [...ids] } })
          .select('_id name')
          .lean()
          .exec()
      : [];

    const nameById = new Map(
      specialities.map((s) => [s._id.toString(), s.name as string]),
    );

    return docs.map((d) => {
      const plain =
        typeof (d as PostDocument).toObject === 'function'
          ? (d as PostDocument).toObject()
          : { ...(d as Record<string, unknown>) };
      const list = (plain.specialityIds ?? []) as unknown[];
      return {
        ...plain,
        specialityNames: list
          .map((id) => nameById.get(String(id)))
          .filter((n): n is string => Boolean(n)),
      };
    });
  }

  async create(dto: CreatePostDto, adminId: string): Promise<HydratedPost> {
    const doc = await this.postModel.create({
      ...dto,
      specialityIds: dto.specialityIds.map((id) => new Types.ObjectId(id)),
      createdBy: new Types.ObjectId(adminId),
      status: dto.status || 'draft',
      publishedAt: dto.status === 'published' ? new Date() : null,
    });
    const [hydrated] = await this.hydrate([doc]);
    return hydrated;
  }

  async update(id: string, dto: UpdatePostDto, adminId: string): Promise<HydratedPost> {
    const post = await this.postModel.findById(id);
    if (!post || post.deletedAt) throw new NotFoundException('Post not found');

    Object.assign(post, dto);
    if (dto.specialityIds) {
      post.specialityIds = dto.specialityIds.map((sid) => new Types.ObjectId(sid));
    }
    post.updatedBy = new Types.ObjectId(adminId);
    await post.save();
    const [hydrated] = await this.hydrate([post]);
    return hydrated;
  }

  async changeStatus(id: string, action: string, adminId: string): Promise<HydratedPost> {
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
      if (
        !post.title ||
        !post.description ||
        !post.specialityIds?.length ||
        !post.location?.city ||
        !post.employmentType ||
        !post.company?.name
      ) {
        throw new BadRequestException('Post missing required fields for publishing');
      }
      post.publishedAt = new Date();
    }

    post.status = rule.to;
    post.updatedBy = new Types.ObjectId(adminId);
    await post.save();
    const [hydrated] = await this.hydrate([post]);
    return hydrated;
  }

  async softDelete(id: string, adminId: string): Promise<void> {
    const post = await this.postModel.findById(id);
    if (!post) throw new NotFoundException('Post not found');
    post.deletedAt = new Date();
    post.status = 'archived';
    post.updatedBy = new Types.ObjectId(adminId);
    await post.save();
  }

  async findById(id: string): Promise<HydratedPost | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const post = await this.postModel.findOne({ _id: id, deletedAt: null }).exec();
    if (!post) return null;
    const [hydrated] = await this.hydrate([post]);
    return hydrated;
  }

  async findPublished(
    filters: PostFilterDto,
    page: number,
    limit: number,
  ): Promise<{ items: HydratedPost[]; total: number }> {
    const query: Record<string, unknown> = { status: 'published', deletedAt: null };

    if (filters.specialityIds?.length) {
      query.specialityIds = { $in: filters.specialityIds.map((id) => new Types.ObjectId(id)) };
    }
    if (filters.city) query['location.city'] = { $regex: filters.city, $options: 'i' };
    if (filters.employmentType) query.employmentType = filters.employmentType;
    if (filters.remote !== undefined) query['location.remote'] = filters.remote;
    if (filters.salaryMin !== undefined || filters.salaryMax !== undefined) {
      const salaryMax: { $gte?: number; $lte?: number } = {};
      if (filters.salaryMin !== undefined) salaryMax.$gte = filters.salaryMin;
      if (filters.salaryMax !== undefined) salaryMax.$lte = filters.salaryMax;
      query['salary.max'] = salaryMax;
    }
    if (filters.q) query.$text = { $search: filters.q };

    const sortObj: Record<string, 1 | -1> =
      filters.sort === 'salary' ? { 'salary.max': -1 } : { publishedAt: -1 };

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);

    const [items, total] = await Promise.all([
      this.postModel
        .find(query)
        .sort(sortObj)
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .exec(),
      this.postModel.countDocuments(query).exec(),
    ]);

    return { items: await this.hydrate(items), total };
  }

  async findForYou(
    userId: string,
    specialityIds: string[],
    city?: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<{ items: HydratedPost[]; nextCursor: string | null }> {
    const result = await this.matchingService.findForYou(
      userId,
      specialityIds,
      city,
      cursor,
      limit,
    );
    return {
      items: await this.hydrate(result.items),
      nextCursor: result.nextCursor,
    };
  }

  async incrementView(postId: string): Promise<void> {
    await this.matchingService.incrementView(postId);
  }
}
