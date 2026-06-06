import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  constructor(private config: ConfigService) {}

  async getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
    const endpoint = this.config.get('DO_SPACES_ENDPOINT', 'http://minio:9000');
    const bucket = this.config.get('DO_SPACES_BUCKET', 'agromarket-files');
    // In production, this would use AWS SDK to generate a presigned URL
    return `${endpoint}/${bucket}/${key}?presigned=true`;
  }

  getPublicUrl(key: string): string {
    const endpoint = this.config.get('DO_SPACES_ENDPOINT', 'http://minio:9000');
    const bucket = this.config.get('DO_SPACES_BUCKET', 'agromarket-files');
    return `${endpoint}/${bucket}/${key}`;
  }
}
