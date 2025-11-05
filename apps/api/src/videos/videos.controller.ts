import { Controller, Get, Post, UploadedFile, UseInterceptors, Param, Res, HttpException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

const UPLOAD_DIR = '/tmp';
const THUMB_DIR  = '/tmp/thumbs';
function ensureDir(p: string) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function extMime(name: string) {
  const e = name.toLowerCase();
  if (e.endsWith('.mp4')) return 'video/mp4';
  if (e.endsWith('.mov')) return 'video/quicktime';
  return 'application/octet-stream';
}

@Controller('videos')
export class VideosController {
  @Get()
  list() {
    ensureDir(UPLOAD_DIR);
    const files = fs.readdirSync(UPLOAD_DIR)
      .filter(f => /\.(mp4|mov)$/i.test(f))
      .sort((a,b)=> fs.statSync(path.join(UPLOAD_DIR,b)).mtimeMs - fs.statSync(path.join(UPLOAD_DIR,a)).mtimeMs);
    return { files };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new HttpException('No file', 400);
    ensureDir(UPLOAD_DIR);
    const dest = path.join(UPLOAD_DIR, file.originalname);
    fs.writeFileSync(dest, file.buffer);
    return { ok: true, saved: dest, size: fs.statSync(dest).size };
  }

  @Get(':name')
  stream(@Param('name') name: string, @Res() res: Response) {
    const decoded = decodeURIComponent(name);
    const full = path.join(UPLOAD_DIR, decoded);
    if (!fs.existsSync(full)) throw new HttpException('Not found', 404);
    res.setHeader('Content-Type', extMime(decoded));
    res.sendFile(full);
  }

  @Get('thumb/:name')
  async thumb(@Param('name') name: string, @Res() res: Response) {
    const decoded = decodeURIComponent(name);
    const src = path.join(UPLOAD_DIR, decoded);
    if (!fs.existsSync(src)) throw new HttpException('Not found', 404);

    ensureDir(THUMB_DIR);
    const out = path.join(THUMB_DIR, decoded + '.jpg');

    const needBuild = !fs.existsSync(out) ||
      fs.statSync(out).mtimeMs < fs.statSync(src).mtimeMs;

    if (needBuild) {
      await new Promise<void>((resolve, reject) => {
        const ff = spawn('ffmpeg', [
          '-y',
          '-ss','00:00:01.000', // first second
          '-i', src,
          '-vframes','1',
          // center-crop to 16:9 then scale to 1280x720
          '-vf',"crop='min(iw,ih*16/9)':'min(ih,iw*9/16)',scale=1280:720",
          out
        ]);
        ff.on('close', code => code === 0 ? resolve() : reject(new Error('ffmpeg exit '+code)));
      });
    }

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(out);
  }
}
