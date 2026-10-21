import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ApplicationsService } from './applications.service';
import { Application } from './schemas/application.schema';
import { Post } from '../posts/schemas/post.schema';
import { User } from '../users/schemas/user.schema';
import { MatchingService } from '../matching/matching.service';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let applicationModel: any;
  let postModel: any;
  let userModel: any;
  let matchingService: any;

  beforeEach(async () => {
    applicationModel = {
      find: jest.fn().mockReturnThis(),
      findOne: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      create: jest.fn().mockImplementation((data) => Promise.resolve({ ...data, _id: new Types.ObjectId(), save: jest.fn() })),
      exec: jest.fn().mockResolvedValue(null),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
    };

    postModel = {
      findOne: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    };

    userModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    };

    matchingService = {
      updateApplicationCount: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: getModelToken(Application.name), useValue: applicationModel },
        { provide: getModelToken(Post.name), useValue: postModel },
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: MatchingService, useValue: matchingService },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  describe('apply', () => {
    it('should throw if post not found', async () => {
      postModel.exec.mockResolvedValue(null);
      await expect(service.apply('post1', 'user1', {})).rejects.toThrow('Post not found');
    });

    it('should throw if post is not published', async () => {
      postModel.exec.mockResolvedValue({ status: 'draft' });
      await expect(service.apply('post1', 'user1', {})).rejects.toThrow('not accepting applications');
    });

    it('should throw if deadline passed', async () => {
      postModel.exec.mockResolvedValue({
        status: 'published',
        applicationDeadline: new Date(Date.now() - 86400000),
      });
      await expect(service.apply('post1', 'user1', {})).rejects.toThrow('deadline has passed');
    });

    it('should throw if user already applied', async () => {
      postModel.exec.mockResolvedValue({
        status: 'published',
        applicationDeadline: null,
        title: 'Test',
        company: { name: 'Co' },
        location: { city: 'MI' },
        specialityIds: [],
        employmentType: 'full_time',
      });
      userModel.exec.mockResolvedValue({ isActive: true });
      applicationModel.exec.mockResolvedValue({ _id: 'existing' });
      await expect(service.apply('post1', 'user1', {})).rejects.toThrow('already applied');
    });

    it('should create application with snapshot when valid', async () => {
      const postId = new Types.ObjectId();
      postModel.exec.mockResolvedValue({
        _id: postId,
        status: 'published',
        applicationDeadline: null,
        title: 'Muratore',
        slug: 'muratore',
        company: { name: 'Edil Rossi' },
        location: { city: 'Milano' },
        specialityIds: [],
        employmentType: 'full_time',
      });
      userModel.exec.mockResolvedValue({ _id: new Types.ObjectId(), isActive: true });
      applicationModel.exec.mockResolvedValue(null); // no existing

      const result = await service.apply(postId.toString(), new Types.ObjectId().toString(), { coverLetter: 'Hi' });
      expect(applicationModel.create).toHaveBeenCalled();
      expect(matchingService.updateApplicationCount).toHaveBeenCalledWith(postId.toString(), 1);
      expect(result.status).toBe('submitted');
    });
  });

  describe('withdraw', () => {
    it('should throw if application not found', async () => {
      applicationModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.withdraw('app1', 'user1')).rejects.toThrow('not found');
    });

    it('should throw if not the owner', async () => {
      const otherUser = new Types.ObjectId();
      applicationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ userId: otherUser, status: 'submitted' }),
      });
      await expect(service.withdraw('app1', 'differentUser')).rejects.toThrow('Cannot withdraw');
    });

    it('should throw if status is not submitted', async () => {
      const userId = new Types.ObjectId();
      applicationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ userId, status: 'accepted', save: jest.fn() }),
      });
      await expect(service.withdraw('app1', userId.toString())).rejects.toThrow('Cannot withdraw');
    });
  });

  describe('review', () => {
    it('should transition from submitted to accepted', async () => {
      const adminId = new Types.ObjectId();
      const app = {
        status: 'submitted',
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
        statusHistory: [],
        save: jest.fn().mockResolvedValue(true),
      };
      applicationModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(app) });

      const result = await service.review('app1', adminId.toString(), 'accepted', 'Good fit');
      expect(app.status).toBe('accepted');
      expect(app.save).toHaveBeenCalled();
    });

    it('should reject invalid transition', async () => {
      const adminId = new Types.ObjectId();
      const app = { status: 'rejected', save: jest.fn() };
      applicationModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(app) });

      await expect(service.review('app1', adminId.toString(), 'accepted')).rejects.toThrow('Cannot transition');
    });
  });
});