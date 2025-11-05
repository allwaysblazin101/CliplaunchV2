import { Controller, Get, Post, UploadedFile, UseInterceptors, Res, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private readonly videos: VideosService) {}

  @Get()
  async list() { return this.videos.list(); }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) return { ok: false, error: 'no file' };
    return this.videos.saveUploadedFile(file);
  }

  @Get('thumb/:name')
  thumb(@Param('name') name: string, @Res() res: Response) {
    const f = path.join('/tmp/thumbs', path.basename(name));
    if (!fs.existsSync(f)) return res.status(404).end();
    res.setHeader('Cache-Control','public, max-age=31536000, immutable');
    res.contentType('image/jpeg');
    fs.createReadStream(f).pipe(res);
  }

  @Get('stream/:name')
  stream(@Param('name') name: string, @Res() res: Response) {
    const f = path.join('/tmp', path.basename(name));
    if (!fs.existsSync(f)) return res.status(404).end();
    // serve as generic mp4/quicktime
    res.contentType(/\.(mp4|m4v)$/i.test(f) ? 'video/mp4' : 'video/quicktime');
    fs.createReadStream(f).pipe(res);
  }
}
