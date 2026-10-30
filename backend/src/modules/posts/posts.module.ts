import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './schemas/post.schema';
import { Speciality, SpecialitySchema } from '../specialities/schemas/speciality.schema';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { MatchingModule } from '../matching/matching.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      // Needed to resolve specialityNames for every post payload.
      { name: Speciality.name, schema: SpecialitySchema },
    ]),
    MatchingModule,
    UsersModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
