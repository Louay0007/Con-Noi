import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Application, ApplicationSchema } from './schemas/application.schema';
import { Post, PostSchema } from '../posts/schemas/post.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Speciality, SpecialitySchema } from '../specialities/schemas/speciality.schema';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { MatchingModule } from '../matching/matching.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
      // Used to capture readable speciality names in the apply snapshot.
      { name: Speciality.name, schema: SpecialitySchema },
    ]),
    MatchingModule,
    NotificationsModule,
    AuditModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
