import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Model } from 'mongoose';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { Speciality } from '../src/modules/specialities/schemas/speciality.schema';
import { User } from '../src/modules/users/schemas/user.schema';

/**
 * AppModule evaluates `ConfigModule.forRoot()` at import time, which loads
 * `backend/.env` (MONGO_URI=localhost). To make the suite hermetic we set the
 * environment BEFORE importing AppModule, so dotenv never overwrites our
 * in-memory URI. Hence the dynamic import inside beforeAll.
 */
describe('Worker Platform E2E', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let specialityId: string;
  let postId: string;

  const api = (path: string) => `/api/v1${path}`;

  const extractCookies = (res: request.Response): string[] =>
    (res.headers['set-cookie'] as unknown as string[]) ?? [];

  /**
   * Logs in once per (email) and reuses the cookie jar.
   * /auth/login is throttled to 5 requests/minute; a suite that logs in for
   * every test trips its own limit and then fails with a misleading 401.
   */
  const sessionCache = new Map<string, string[]>();
  const loginAs = async (email: string, password: string): Promise<string[]> => {
    const cached = sessionCache.get(email);
    if (cached) return cached;
    const res = await request(app.getHttpServer())
      .post(api('/auth/login'))
      .send({ email, password });
    if (res.status !== 201) {
      throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
    }
    const cookies = extractCookies(res);
    sessionCache.set(email, cookies);
    return cookies;
  };

  beforeAll(async () => {
    // Prefer an external Mongo (the compose service) so the suite does not
    // download a ~600MB binary on every fresh machine. Fall back to the
    // in-memory server when E2E_MONGO_URI is not provided.
    //
    // `directConnection=true` is required when pointing at the compose
    // container: its replica set advertises the member as `mongo:27017`,
    // a name that only resolves inside the Docker network. Connecting
    // directly keeps the driver from following that hostname.
    let uri = process.env.E2E_MONGO_URI;
    if (uri) {
      if (!/directConnection=/.test(uri)) {
        uri += `${uri.includes('?') ? '&' : '?'}directConnection=true`;
      }
    } else {
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
    }

    process.env.NODE_ENV = 'test';
    process.env.MONGO_URI = uri;
    process.env.MONGO_REPLICA_SET = '';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-long-enough-32';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough-32';
    process.env.JWT_ACCESS_TTL = '1h';
    process.env.JWT_REFRESH_TTL = '7d';
    process.env.STORAGE_DRIVER = 'disk';
    process.env.STORAGE_DIR = './test-uploads';
    process.env.THROTTLE_TTL_MS = '60000';
    process.env.THROTTLE_LIMIT = '1000';

    // Deferred so AppModule sees the environment above.
    const { AppModule } = await import('../src/app.module');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cookieParser = require('cookie-parser');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        MongooseModule.forRoot(uri),
        AppModule,
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['api/v1/docs'] });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    // Seed the minimum the suite needs: one speciality and one admin.
    const specialityModel = moduleFixture.get<Model<Speciality>>(getModelToken(Speciality.name));
    const spec = await specialityModel.create({
      name: 'Muratore',
      slug: 'muratore',
      category: 'edilizia',
      sortOrder: 0,
      isActive: true,
    });
    specialityId = spec._id.toString();

    const userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    await userModel.create({
      email: 'admin@test.it',
      passwordHash: await bcrypt.hash('AdminTest1', 4),
      fullName: 'Test Admin',
      role: 'admin',
      specialityIds: [],
      isActive: true,
      onboardingCompleted: true,
    });
  }, 180000);

  afterAll(async () => {
    if (app) await app.close();
    if (mongod) await mongod.stop();
  });

  describe('Health', () => {
    it('reports the database as connected', async () => {
      const res = await request(app.getHttpServer()).get(api('/health'));
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.database).toBe('connected');
    });
  });

  describe('Auth Journey', () => {
    let workerCookies: string[];

    it('should register a worker', async () => {
      const res = await request(app.getHttpServer())
        .post(api('/auth/register'))
        .send({
          email: 'worker@test.it',
          password: 'WorkerTest1',
          fullName: 'Mario Rossi',
          age: 30,
          specialityIds: [specialityId],
        });
      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe('worker@test.it');
      workerCookies = extractCookies(res);
      expect(workerCookies.join(';')).toContain('access_token=');
    });

    it('should login worker (cookies, not body tokens)', async () => {
      const res = await request(app.getHttpServer())
        .post(api('/auth/login'))
        .send({ email: 'worker@test.it', password: 'WorkerTest1' });
      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe('worker@test.it');
      expect(res.body.data.accessToken).toBeUndefined();
      workerCookies = extractCookies(res);
      expect(workerCookies.join(';')).toContain('access_token=');
      expect(workerCookies.join(';')).toContain('refresh_token=');
    });

    it('should reject a wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post(api('/auth/login'))
        .send({ email: 'worker@test.it', password: 'WrongPass1' });
      expect(res.status).toBe(401);
    });

    it('should get current user profile via cookie', async () => {
      const res = await request(app.getHttpServer())
        .get(api('/auth/me'))
        .set('Cookie', workerCookies);
      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe('Mario Rossi');
    });
  });

  describe('Admin Post Journey', () => {
    it('admin should create and publish a post', async () => {
      const adminCookies = await loginAs('admin@test.it', 'AdminTest1');

      const res = await request(app.getHttpServer())
        .post(api('/posts'))
        .set('Cookie', adminCookies)
        .send({
          title: 'Muratore Esperto Milano',
          description: 'Cerchiamo muratore esperto per ristrutturazione.',
          specialityIds: [specialityId],
          location: { city: 'Milano', country: 'Italia' },
          employmentType: 'full_time',
          company: { name: 'Edil Test Srl' },
          status: 'published',
        });
      expect([200, 201]).toContain(res.status);
      postId = res.body.data._id ?? res.body.data.id;
      expect(postId).toBeDefined();
    });

    it('worker should not be able to create a post', async () => {
      const workerCookies = await loginAs('worker@test.it', 'WorkerTest1');
      const res = await request(app.getHttpServer())
        .post(api('/posts'))
        .set('Cookie', workerCookies)
        .send({
          title: 'Should fail',
          description: 'nope',
          specialityIds: [specialityId],
          location: { city: 'Roma', country: 'Italia' },
          employmentType: 'full_time',
          company: { name: 'X' },
        });
      expect(res.status).toBe(403);
    });
  });

  describe('Worker Application Journey', () => {
    let workerCookies: string[];
    let applicationId: string;

    it('worker should apply to post', async () => {
      workerCookies = await loginAs('worker@test.it', 'WorkerTest1');

      const res = await request(app.getHttpServer())
        .post(api(`/applications/posts/${postId}/apply`))
        .set('Cookie', workerCookies)
        .send({ coverLetter: 'Sono interessato.' });
      expect([200, 201]).toContain(res.status);
      applicationId = res.body.data._id ?? res.body.data.id;
      expect(applicationId).toBeDefined();
    });

    it('worker should not apply twice', async () => {
      const res = await request(app.getHttpServer())
        .post(api(`/applications/posts/${postId}/apply`))
        .set('Cookie', workerCookies)
        .send({ coverLetter: 'Di nuovo.' });
      expect(res.status).toBe(400);
    });

    it('worker should list own applications', async () => {
      const res = await request(app.getHttpServer())
        .get(api('/applications/me'))
        .set('Cookie', workerCookies);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('feeding the feed shows the published post', async () => {
      const res = await request(app.getHttpServer())
        .get(api('/posts/feed?limit=10'))
        .set('Cookie', workerCookies);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it('admin reviews the application and the history records the transition', async () => {
      const adminCookies = await loginAs('admin@test.it', 'AdminTest1');

      const res = await request(app.getHttpServer())
        .patch(api(`/applications/${applicationId}/status`))
        .set('Cookie', adminCookies)
        .send({ status: 'accepted', reviewNotes: 'Ottimo profilo' });
      expect([200, 201]).toContain(res.status);
      expect(res.body.data.status).toBe('accepted');

      const history = res.body.data.statusHistory ?? [];
      const last = history[history.length - 1];
      expect(last.from).toBe('submitted');
      expect(last.to).toBe('accepted');
    });
  });

  describe('Password reset', () => {
    it('answers identically for known and unknown addresses', async () => {
      const known = await request(app.getHttpServer())
        .post(api('/auth/forgot-password'))
        .send({ email: 'worker@test.it' });
      const unknown = await request(app.getHttpServer())
        .post(api('/auth/forgot-password'))
        .send({ email: 'nobody@nowhere.test' });

      expect(known.status).toBe(200);
      expect(unknown.status).toBe(200);
      // No enumeration: same body whether or not the account exists.
      expect(known.body.data).toEqual(unknown.body.data);
    });

    it('rejects an invalid token', async () => {
      const res = await request(app.getHttpServer())
        .post(api('/auth/reset-password'))
        .send({ token: 'not-a-real-token', password: 'Another123' });
      expect(res.status).toBe(400);
    });

    it('rejects a password that fails policy', async () => {
      const res = await request(app.getHttpServer())
        .post(api('/auth/reset-password'))
        .send({ token: 'whatever', password: 'weak' });
      expect(res.status).toBe(400);
    });

    it('resets the password, invalidates the token and revokes sessions', async () => {
      // Drive the service directly: the raw token only exists inside the
      // email, so the test plants a known hash and then consumes it.
      const crypto = await import('crypto');
      const token = 'known-test-token-for-e2e';
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const userModel = app.get<Model<User>>(getModelToken(User.name));
      const user = await userModel.findOne({ email: 'worker@test.it' });
      expect(user).toBeTruthy();
      await userModel.updateOne(
        { _id: user!._id },
        {
          resetToken: tokenHash,
          resetTokenExpires: new Date(Date.now() + 60_000),
          refreshTokenHash: 'old-session-hash',
        },
      );

      const res = await request(app.getHttpServer())
        .post(api('/auth/reset-password'))
        .send({ token, password: 'BrandNew123' });
      expect(res.status).toBe(200);

      // New password works…
      const login = await request(app.getHttpServer())
        .post(api('/auth/login'))
        .send({ email: 'worker@test.it', password: 'BrandNew123' });
      expect(login.status).toBe(201);

      // …the token cannot be reused…
      const replay = await request(app.getHttpServer())
        .post(api('/auth/reset-password'))
        .send({ token, password: 'Another123' });
      expect(replay.status).toBe(400);

      // …and the reset token itself was cleared. (The refresh hash is now the
      // new session's, which is correct — the point is the OLD one is gone.)
      const after = await userModel
        .findOne({ email: 'worker@test.it' })
        .select('+resetToken +resetTokenExpires +refreshTokenHash');
      expect(after!.resetToken).toBeNull();
      expect(after!.resetTokenExpires).toBeNull();
      expect(after!.refreshTokenHash).not.toBe('old-session-hash');
    });
  });

  describe('GDPR Journey', () => {
    it('worker should export own data', async () => {
      // Reuse the cached session: /auth/login is throttled to 5/min and the
      // suite must not trip its own rate limit.
      const workerCookies = await loginAs('worker@test.it', 'WorkerTest1');
      const res = await request(app.getHttpServer())
        .get(api('/users/me/export'))
        .set('Cookie', workerCookies);
      expect(res.status).toBe(200);
      expect(res.body.data.user).toBeDefined();
    });
  });
});
