import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageProvider } from './storage.provider';
import { DiskStorageProvider } from './disk-storage.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: StorageProvider,
      useClass: DiskStorageProvider,
    },
  ],
  exports: [StorageProvider],
})
export class UploadModule {}