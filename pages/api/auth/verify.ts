import type { NextApiRequest, NextApiResponse } from 'next';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const r = await fetch(`${API}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(req.body || {}),
  });
  const j = await r.json();
  res.status(r.status).json(j);
}
