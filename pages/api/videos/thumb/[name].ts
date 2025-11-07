import type { NextApiRequest, NextApiResponse } from 'next';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const name = req.query.name as string;
  const r = await fetch(`${API}/videos/thumb/${encodeURIComponent(name)}`);
  if (!r.ok) return res.status(r.status).end();
  r.headers.forEach((v, k) => res.setHeader(k, v));
  const buf = Buffer.from(await r.arrayBuffer());
  res.status(200).send(buf);
}
