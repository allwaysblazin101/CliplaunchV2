import type { NextApiRequest, NextApiResponse } from 'next';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const r = await fetch(`${API}/videos`);
  const j = await r.json();
  const videos = (j.videos || j.files || []).map((v: any) => ({
    filename: v.filename ?? v,
    size: v.size ?? 0,
    streamUrl: `/api/videos/stream/${encodeURIComponent(v.filename ?? v)}`,
    thumbUrl: `/api/videos/thumb/${encodeURIComponent((v.filename ?? v))}.jpg`,
  }));
  res.status(200).json({ videos });
}
