import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FileAsset, FileAssetSchema } from '../files/schemas/file-asset.schema';
import { Application, ApplicationSchema } from '../applications/schemas/application.schema';
import { Post, PostSchema } from '../posts/schemas/post.schema';
import { Speciality, SpecialitySchema } from '../specialities/schemas/speciality.schema';
import { Like, LikeSchema } from '../likes/schemas/like.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { WorkHistory, WorkHistorySchema } from '../work-history/schemas/work-history.schema';
import { Conversation, ConversationSchema } from '../messages/schemas/conversation.schema';
import { UploadModule } from '../upload/upload.module';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FileAsset.name, schema: FileAssetSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: Post.name, schema: PostSchema },
      { name: Speciality.name, schema: SpecialitySchema },
      { name: Like.name, schema: LikeSchema },
      { name: User.name, schema: UserSchema },
      { name: WorkHistory.name, schema: WorkHistorySchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
    UploadModule,
  ],
  providers: [TasksService],
})
export class TasksModule {}
