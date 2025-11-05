import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class VideosService {
  private baseDir = '/tmp';
  private thumbsDir = '/tmp/thumbs';

  constructor(private prisma: PrismaService) {}

  async saveRecord(filename: string, fullPath: string, size: number) {
    return this.prisma.video.create({ data: { filename, path: fullPath, size } });
  }

  async list() {
    return this.prisma.video.findMany({ orderBy: { createdAt: 'desc' } });
  }

  filePath(name: string) { return path.join(this.baseDir, name); }
  thumbPath(name: string) { return path.join(this.thumbsDir, name + '.jpg'); }
  exists(p: string) { return fs.existsSync(p); }
}
