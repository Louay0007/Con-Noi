import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../src/app.module';

describe('Worker Platform E2E', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let workerToken: string;
  let adminToken: string;
  let specialityId: string;
  let postId: string;
  let applicationId: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            MONGO_URI: uri,
            JWT_ACCESS_SECRET: 'test-access-secret',
            JWT_REFRESH_SECRET: 'test-refresh-secret',
            JWT_ACCESS_TTL: '1h',
            JWT_REFRESH_TTL: '7d',
            STORAGE_DRIVER: 'disk',
            STORAGE_DIR: './test-uploads',
            THROTTLE_TTL_MS: 60000,
            THROTTLE_LIMIT: 1000,
            SEED_ADMIN_EMAIL: 'admin@test.it',
            SEED_ADMIN_PASSWORD: 'AdminTest1',
          })],
        }),
        MongooseModule.forRoot(uri),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  }, 60000);

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  describe('Auth Journey', () => {
    it('should register a worker', async () => {
      // First seed specialities via admin
      const adminLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.it', password: 'AdminTest1' });

      if (adminLogin.status === 201) {
        adminToken = adminLogin.body.data.accessToken;
      }

      // Register worker (specialityIds may be empty initially)
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'worker@test.it',
          password: 'WorkerTest1',
          fullName: 'Mario Rossi',
          age: 30,
          specialityIds: [],
        });
      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe('worker@test.it');
    });

    it('should login worker', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'worker@test.it', password: 'WorkerTest1' });
      expect(res.status).toBe(201);
      workerToken = res.body.data.accessToken;
      expect(workerToken).toBeDefined();
    });

    it('should get current user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${workerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe('Mario Rossi');
    });
  });

  describe('Admin Post Journey', () => {
    it('admin should create a post', async () => {
      // Ensure admin token exists
      if (!adminToken) {
        const login = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: 'admin@test.it', password: 'AdminTest1' });
        adminToken = login.body.data.accessToken;
      }

      const res = await request(app.getHttpServer())
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Muratore Esperto Milano',
          description: 'Cerchiamo muratore esperto per ristrutturazione.',
          specialityIds: [], // Will use empty for test simplicity
          location: { city: 'Milano', country: 'Italia' },
          employmentType: 'full_time',
          company: { name: 'Edil Test Srl' },
          status: 'published',
        });
      expect([200, 201]).toContain(res.status);
      postId = res.body.data._id || res.body.data.id;
      expect(postId).toBeDefined();
    });
  });

  describe('Worker Application Journey', () => {
    it('worker should apply to post', async () => {
      if (!postId) return;
      const res = await request(app.getHttpServer())
        .post(`/api/applications/posts/${postId}/apply`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({ coverLetter: 'Sono interessato.' });
      expect([200, 201]).toContain(res.status);
      applicationId = res.body.data._id || res.body.data.id;
      expect(applicationId).toBeDefined();
    });

    it('worker should list own applications', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/applications/me')
        .set('Authorization', `Bearer ${workerToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GDPR Journey', () => {
    it('worker should export own data', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/me/export')
        .set('Authorization', `Bearer ${workerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user).toBeDefined();
    });
  });
});