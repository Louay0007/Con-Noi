import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
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
import { HealthController } from './common/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Joi is applied through `validate` because @nestjs/config v12 expects
      // Standard Schema for `validationSchema`, which Joi does not implement.
      validate: validateEnv,
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
      useFactory: (config: ConfigService) => ({
        throttlers: [{
          name: 'default',
          ttl: config.get<number>('THROTTLE_TTL_MS', 60000),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        }],
      }),
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
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}