import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
export const config = { api: { bodyParser: false } };
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const form = formidable();
  const { files } = await new Promise<any>((resolve, reject) =>
    form.parse(req, (err, _f, files) => (err ? reject(err) : resolve({ files }))));
  const f: any = (files as any).file;
  if (!f) return res.status(400).json({ ok:false, error:'missing file' });

  const stream = fs.createReadStream(f.filepath);
  const FormData = (await import('form-data')).default;
  const fd = new FormData();
  fd.append('file', stream, f.originalFilename);

  const r = await fetch(`${API}/videos/upload`, { method: 'POST', body: fd as any });
  const j = await r.json();
  res.status(r.ok ? 200 : 500).json(j);
}
