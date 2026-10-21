import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkHistory, WorkHistorySchema } from './schemas/work-history.schema';
import { WorkHistoryController } from './work-history.controller';
import { WorkHistoryService } from './work-history.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WorkHistory.name, schema: WorkHistorySchema }]),
  ],
  controllers: [WorkHistoryController],
  providers: [WorkHistoryService],
  exports: [WorkHistoryService],
})
export class WorkHistoryModule {}