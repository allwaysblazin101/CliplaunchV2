import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import axios from 'axios';

type PinIndex = Record<string, { videoCid?: string; thumbCid?: string }>;

function sh(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    execFile(cmd, args, (err) => (err ? reject(err) : resolve()));
  });
}

@Injectable()
export class VideosService {
  private tmpDir = '/tmp';
  private thumbsDir = path.join(this.tmpDir, 'thumbs');
  private pinIndexFile = path.join(this.tmpDir, 'pinata-index.json');
  private pinIndex: PinIndex = {};
  private pinataJwt = process.env.PINATA_JWT || '';
  private gatewayBase = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';

  constructor() {
    if (!fs.existsSync(this.thumbsDir)) fs.mkdirSync(this.thumbsDir, { recursive: true });
    if (fs.existsSync(this.pinIndexFile)) {
      try { this.pinIndex = JSON.parse(fs.readFileSync(this.pinIndexFile, 'utf8')); } catch {}
    }
  }

  private saveIndex() {
    try { fs.writeFileSync(this.pinIndexFile, JSON.stringify(this.pinIndex, null, 2)); } catch {}
  }

  private async ensureThumb(filename: string) {
    const src = path.join(this.tmpDir, filename);
    const out = path.join(this.thumbsDir, `${filename}.jpg`);
    if (fs.existsSync(out)) return out;

    // Rotate iPhone portrait to landscape frame before cropping to 320x180
    await sh('ffmpeg', [
      '-y',
      '-i', src,
      '-vf',
      "transpose=1,setsar=1,scale='if(gt(a,16/9),-2,320)':'if(gt(a,16/9),180,-2)',crop=320:180",
      '-frames:v','1',
      out,
    ]);
    return out;
  }

  private async pinFile(filePath: string): Promise<string | undefined> {
    if (!this.pinataJwt) return undefined;
    const stat = fs.statSync(filePath);
    const name = path.basename(filePath);
    const form = new (require('form-data'))();
    form.append('file', fs.createReadStream(filePath), { filename: name, knownLength: stat.size });

    const { data } = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      form,
      { headers: { Authorization: `Bearer ${this.pinataJwt}`, ...form.getHeaders() }, maxBodyLength: Infinity }
    );
    return data?.IpfsHash as string | undefined;
  }

  async list() {
    // list local MOV/MP4 files
    const files = (fs.readdirSync(this.tmpDir)
      .filter(f => /\.(mov|mp4|m4v)$/i.test(f))
      .map(f => {
        const full = path.join(this.tmpDir, f);
        const size = fs.statSync(full).size;
        const pins = this.pinIndex[f] || {};
        const streamUrl = pins.videoCid ? `${this.gatewayBase}/${pins.videoCid}` : `/videos/stream/${encodeURIComponent(f)}`;
        const thumbFile = `${f}.jpg`;
        const thumbUrl = pins.thumbCid ? `${this.gatewayBase}/${pins.thumbCid}` : `/videos/thumb/${encodeURIComponent(thumbFile)}`;
        return { filename: f, size, streamUrl, thumbUrl };
      }));
    return { videos: files };
  }

  async saveUploadedFile(file: Express.Multer.File) {
    const dest = path.join(this.tmpDir, file.originalname);
    fs.writeFileSync(dest, file.buffer);

    await this.ensureThumb(file.originalname);

    // Try to pin both. If JWT not set, we skip silently.
    try {
      const [videoCid, thumbCid] = await Promise.all([
        this.pinFile(dest),
        this.pinFile(path.join(this.thumbsDir, `${file.originalname}.jpg`)),
      ]);
      if (!this.pinIndex[file.originalname]) this.pinIndex[file.originalname] = {};
      if (videoCid) this.pinIndex[file.originalname].videoCid = videoCid;
      if (thumbCid) this.pinIndex[file.originalname].thumbCid = thumbCid;
      this.saveIndex();
    } catch {
      // ignore pin errors, serve locally
    }

    const pins = this.pinIndex[file.originalname] || {};
    return {
      ok: true,
      video: {
        filename: file.originalname,
        path: dest,
        size: file.size,
        streamUrl: pins.videoCid ? `${this.gatewayBase}/${pins.videoCid}` : `/videos/stream/${encodeURIComponent(file.originalname)}`,
        thumbUrl: pins.thumbCid ? `${this.gatewayBase}/${pins.thumbCid}` : `/videos/thumb/${encodeURIComponent(file.originalname)}.jpg`,
      }
    };
  }
}
