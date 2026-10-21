import { Readable } from 'stream';

export abstract class StorageProvider {
  abstract put(key: string, buffer: Buffer, mime: string): Promise<void>;
  abstract getStream(key: string): Promise<Readable>;
  abstract delete(key: string): Promise<void>;
  abstract exists(key: string): Promise<boolean>;
}