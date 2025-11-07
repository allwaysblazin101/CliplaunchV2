import { Controller, Get, Param, Res, Post, Body, UseGuards, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideosService } from './videos.service';
import { JwtCookieGuard } from './auth.guard';
import * as fs from 'fs';

@Controller('videos')
export class VideosController {
  constructor(private videos: VideosService) {}

  @Get()
  async list() { return this.videos.list(); }

  @Post('upload')
  @UseGuards(JwtCookieGuard)
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    if (!file) return { success: false, error: 'no file' };
    await this.videos.save(file, body?.title, body?.description);
    return { success: true };
  }

  @Get('stream/:file')
  async stream(@Param('file') file: string, @Req() req: Request, @Res() res: Response) {
    const p = this.videos.getPathOrThrow(decodeURIComponent(file));
    const stat = fs.statSync(p);
    const range = req.headers.range;
    const mime = this.videos.mimeFor(p);

    res.setHeader('Accept-Ranges', 'bytes');

    if (range) {
      const [s, e] = range.replace(/bytes=/, '').split('-');
      const start = Math.max(parseInt(s || '0', 10), 0);
      const end = Math.min(parseInt(e || `${stat.size - 1}`, 10), stat.size - 1);
      const size = end - start + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      res.setHeader('Content-Length', String(size));
      res.setHeader('Content-Type', mime);
      fs.createReadStream(p, { start, end }).pipe(res);
      return;
    }

    res.setHeader('Content-Length', String(stat.size));
    res.setHeader('Content-Type', mime);
    fs.createReadStream(p).pipe(res);
  }

  @Get('thumb/:file.jpg')
  async thumb(@Param('file') file: string, @Res() res: Response) {
    try {
      const tp = await this.videos.ensureThumb(decodeURIComponent(file));
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(tp).pipe(res);
    } catch {
      res.status(204).end();
    }
  }
}
