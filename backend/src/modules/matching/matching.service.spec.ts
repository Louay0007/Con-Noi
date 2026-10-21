import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MatchingService } from './matching.service';
import { Post } from '../posts/schemas/post.schema';

describe('MatchingService', () => {
  let service: MatchingService;
  let postModel: any;

  beforeEach(async () => {
    postModel = {
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue([]),
      updateOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        { provide: getModelToken(Post.name), useValue: postModel },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
  });

  it('should return empty items when no specialities provided', async () => {
    const result = await service.findForYou('userId', [], undefined, undefined, 20);
    expect(result.items).toEqual([]);
    expect(postModel.find).toHaveBeenCalled();
  });

  it('should call aggregate with scoring pipeline when specialities provided', async () => {
    const mockPosts = [{ _id: 'post1', score: 5.5 }];
    postModel.aggregate.mockResolvedValue(mockPosts);

    const result = await service.findForYou('userId', ['spec1'], 'Milano', undefined, 20);
    expect(postModel.aggregate).toHaveBeenCalled();
    expect(result.items).toEqual(mockPosts);
    expect(result.nextCursor).toBeNull();
  });

  it('should set nextCursor when results exceed limit', async () => {
    const mockPosts = Array.from({ length: 21 }, (_, i) => ({ _id: `post${i}`, score: 5 }));
    postModel.aggregate.mockResolvedValue(mockPosts);

    const result = await service.findForYou('userId', ['spec1'], undefined, undefined, 20);
    expect(result.items.length).toBe(20);
    expect(result.nextCursor).toBe('post20');
  });

  it('should increment view count', async () => {
    await service.incrementView('postId');
    expect(postModel.updateOne).toHaveBeenCalledWith(
      { _id: 'postId' },
      { $inc: { 'stats.views': 1 } },
    );
  });

  it('should update like count with delta', async () => {
    await service.updateLikeCount('postId', 1);
    expect(postModel.updateOne).toHaveBeenCalledWith(
      { _id: 'postId' },
      { $inc: { 'stats.likes': 1 } },
    );
  });

  it('should update application count with delta', async () => {
    await service.updateApplicationCount('postId', -1);
    expect(postModel.updateOne).toHaveBeenCalledWith(
      { _id: 'postId' },
      { $inc: { 'stats.applications': -1 } },
    );
  });
});