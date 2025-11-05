import { Controller, Get, Post, UploadedFile, UseInterceptors, Res, Param, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideosService } from './videos.service';
import * as fs from 'fs';
import * as path from 'path';
import { Response, Request } from 'express';

function mimeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.mov') return 'video/quicktime';
  if (ext === '.webm') return 'video/webm';
  if (ext === '.mkv') return 'video/x-matroska';
  return 'application/octet-stream';
}

@Controller('videos')
export class VideosController {
  constructor(private readonly videos: VideosService) {}

  @Get()
  async list() {
    return this.videos.list();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) return { ok: false, error: 'no file' };
    return this.videos.saveUploadedFile(file);
  }

  @Get('thumb/:name')
  async thumb(@Param('name') name: string, @Res() res: Response) {
    const safe = path.basename(name);
    const f = path.join('/tmp/thumbs', safe);
    if (!fs.existsSync(f)) return res.status(404).end();
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.contentType('image/jpeg');
    fs.createReadStream(f).pipe(res);
  }

  @Get('stream/:name')
  async stream(@Param('name') name: string, @Req() req: Request, @Res() res: Response) {
    const safe = path.basename(name);
    const filePath = path.join('/tmp', safe);
    if (!fs.existsSync(filePath)) return res.status(404).end();

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const contentType = mimeFor(safe);

    const range = req.headers.range;
    res.setHeader('Accept-Ranges', 'bytes');

    if (range) {
      // Parse "bytes=start-end"
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!m) return res.status(416).end();
      const start = m[1] ? parseInt(m[1], 10) : 0;
      const end = m[2] ? parseInt(m[2], 10) : fileSize - 1;
      if (start >= fileSize || end >= fileSize || start > end) return res.status(416).end();

      const chunkSize = end - start + 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunkSize.toString());
      res.setHeader('Content-Type', contentType);

      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      // Full file (some browsers still OK)
      res.status(200);
      res.setHeader('Content-Length', fileSize.toString());
      res.setHeader('Content-Type', contentType);
      fs.createReadStream(filePath).pipe(res);
    }
  }
}
