import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

@Injectable()
export class VideosService {
  videoDir = path.join(process.cwd(), 'videos');
  thumbDir = path.join(process.cwd(), 'thumbs');

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.videoDir)) fs.mkdirSync(this.videoDir, { recursive: true });
    if (!fs.existsSync(this.thumbDir)) fs.mkdirSync(this.thumbDir, { recursive: true });
  }

  mimeFor(p: string) {
    const ext = path.extname(p).toLowerCase();
    if (ext === '.mp4' || ext === '.m4v') return 'video/mp4';
    if (ext === '.mov') return 'video/quicktime';
    return 'application/octet-stream';
  }

  async list() {
    const rows = await this.prisma.video.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return {
      videos: rows.map(v => ({
        filename: v.filename,
        size: v.size,
        title: v.title ?? null,
        description: v.description ?? null,
        streamUrl: `/videos/stream/${encodeURIComponent(v.filename)}`,
        thumbUrl: `/videos/thumb/${encodeURIComponent(v.filename)}.jpg`,
      })),
    };
  }

  async save(file: Express.Multer.File, title?: string, description?: string) {
    // ensure dir
    if (!fs.existsSync(this.videoDir)) fs.mkdirSync(this.videoDir, { recursive: true });

    const filename = file.originalname;
    const dest = path.join(this.videoDir, filename);
    await fs.promises.writeFile(dest, file.buffer);

    // fire-and-forget thumb
    this.ensureThumb(filename).catch(() => {});

    return this.prisma.video.create({
      data: { filename, size: file.size, title: title || null, description: description || null },
    });
  }

  getPathOrThrow(filename: string) {
    const p = path.join(this.videoDir, filename);
    if (!fs.existsSync(p)) throw new NotFoundException('File not found');
    return p;
  }

  async ensureThumb(filename: string) {
    const src = this.getPathOrThrow(filename);
    const out = path.join(this.thumbDir, filename + '.jpg');
    if (fs.existsSync(out)) return out;

    await new Promise<void>((resolve, reject) => {
      const ff = spawn('ffmpeg', ['-y', '-ss', '00:00:01.0', '-i', src, '-frames:v', '1', '-vf', 'scale=640:-1', out]);
      ff.on('exit', code => (code === 0 ? resolve() : reject(new Error('ffmpeg failed'))));
      ff.on('error', reject);
    });
    return out;
  }
}
