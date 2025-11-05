import {
  Controller, Get, Post, Res, Param, UploadedFile, UseInterceptors, BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private svc: VideosService) {}

  @Get()
  async list() {
    const items = await this.svc.list();
    return { videos: items };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: '/tmp',
      filename: (_req, file, cb) => cb(null, file.originalname),
    }),
    limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB
  }))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file');
    const saved = await this.svc.saveRecord(file.filename, file.path, file.size);

    // fire-and-forget thumbnail (if ffmpeg is installed)
    try {
      const thumbPath = this.svc.thumbPath(file.filename);
      fs.mkdirSync(path.dirname(thumbPath), { recursive: true });
      spawn('ffmpeg', ['-y', '-i', file.path, '-ss', '00:00:00.5', '-frames:v', '1', thumbPath])
        .on('error', () => {});
    } catch {}

    return { ok: true, video: saved };
  }

  // stream the video
  @Get(':name')
  async stream(@Param('name') name: string, @Res() res: Response) {
    const full = this.svc.filePath(name);
    if (!this.svc.exists(full)) return res.status(404).end();
    res.setHeader('Content-Type', 'video/mp4');
    fs.createReadStream(full).pipe(res);
  }

  // thumbnail
  @Get('thumb/:name')
  async thumb(@Param('name') name: string, @Res() res: Response) {
    const p = this.svc.thumbPath(name);
    if (!this.svc.exists(p)) return res.status(404).end();
    res.setHeader('Content-Type', 'image/jpeg');
    fs.createReadStream(p).pipe(res);
  }
}
