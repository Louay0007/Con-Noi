import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SpecialitiesModule } from './modules/specialities/specialities.module';
import { FilesModule } from './modules/files/files.module';
import { MatchingModule } from './modules/matching/matching.module';
import { PostsModule } from './modules/posts/posts.module';
import { LikesModule } from './modules/likes/likes.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { WorkHistoryModule } from './modules/work-history/work-history.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(4000),
        FRONTEND_URL: Joi.string().default('http://localhost:3000'),
        MONGO_URI: Joi.string().required(),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_ACCESS_TTL: Joi.string().default('15m'),
        JWT_REFRESH_TTL: Joi.string().default('7d'),
        STORAGE_DRIVER: Joi.string().valid('disk', 's3').default('disk'),
        STORAGE_DIR: Joi.string().default('./uploads'),
        MAX_FILE_SIZE_MB: Joi.number().default(10),
        THROTTLE_TTL_MS: Joi.number().default(60000),
        THROTTLE_LIMIT: Joi.number().default(100),
        SEED_ADMIN_EMAIL: Joi.string().email().default('admin@platform.it'),
        SEED_ADMIN_PASSWORD: Joi.string().default('ChangeMe!2026'),
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 5000,
      }),
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [{
        ttl: config.get<number>('THROTTLE_TTL_MS', 60000),
        limit: config.get<number>('THROTTLE_LIMIT', 100),
      }],
    }),
    AuthModule,
    UsersModule,
    SpecialitiesModule,
    FilesModule,
    MatchingModule,
    PostsModule,
    LikesModule,
    ApplicationsModule,
    WorkHistoryModule,
    MessagesModule,
    NotificationsModule,
    AdminModule,
    AuditModule,
    TasksModule,
  ],
})
export class AppModule {}