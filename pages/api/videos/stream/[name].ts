import type { NextApiRequest, NextApiResponse } from 'next';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const name = req.query.name as string;
  const headers: Record<string,string> = {};
  if (req.headers.range) headers['range'] = String(req.headers.range);
  const r = await fetch(`${API}/videos/stream/${encodeURIComponent(name)}`, { headers });
  res.status(r.status);
  r.headers.forEach((v, k) => res.setHeader(k, v));
  const buf = Buffer.from(await r.arrayBuffer());
  res.send(buf);
}
