import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FilesService } from './files.service';
import { FileAsset } from './schemas/file-asset.schema';
import { StorageProvider } from '../upload/storage.provider';

describe('FilesService', () => {
  let service: FilesService;
  let fileModel: any;
  let storage: any;

  beforeEach(async () => {
    fileModel = {
      find: jest.fn().mockReturnThis(),
      findOne: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      create: jest.fn().mockResolvedValue({}),
      exec: jest.fn().mockResolvedValue(null),
      sort: jest.fn().mockReturnThis(),
    };

    storage = {
      put: jest.fn().mockResolvedValue(undefined),
      getStream: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      exists: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: getModelToken(FileAsset.name), useValue: fileModel },
        { provide: StorageProvider, useValue: storage },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  describe('canAccess', () => {
    const ownerId = new Types.ObjectId();
    const otherId = new Types.ObjectId().toString();

    it('should allow admin access to any file', () => {
      const file = { visibility: 'private', ownerId } as any;
      expect(service.canAccess(file, otherId, 'admin')).toBe(true);
    });

    it('should allow public access to public files', () => {
      const file = { visibility: 'public', ownerId } as any;
      expect(service.canAccess(file, otherId, 'worker')).toBe(true);
    });

    it('should allow owner access to own private files', () => {
      const file = { visibility: 'private', ownerId } as any;
      expect(service.canAccess(file, ownerId.toString(), 'worker')).toBe(true);
    });

    it('should deny non-owner access to private files', () => {
      const file = { visibility: 'private', ownerId } as any;
      expect(service.canAccess(file, otherId, 'worker')).toBe(false);
    });

    it('should allow owner access to owner-visibility files', () => {
      const file = { visibility: 'owner', ownerId } as any;
      expect(service.canAccess(file, ownerId.toString(), 'worker')).toBe(true);
    });

    it('should deny non-owner access to owner-visibility files', () => {
      const file = { visibility: 'owner', ownerId } as any;
      expect(service.canAccess(file, otherId, 'worker')).toBe(false);
    });
  });
});