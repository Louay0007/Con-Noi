import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Speciality, SpecialitySchema } from './schemas/speciality.schema';
import { SpecialitiesController } from './specialities.controller';
import { SpecialitiesService } from './specialities.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Speciality.name, schema: SpecialitySchema }]),
  ],
  controllers: [SpecialitiesController],
  providers: [SpecialitiesService],
  exports: [SpecialitiesService],
})
export class SpecialitiesModule {}