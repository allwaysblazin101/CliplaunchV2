'use client';
import { useEffect, useState } from 'react';

type Video = {
  id: string;
  filename: string;
  createdAt: string;
  size: number;
  streamUrl: string;
  thumbUrl: string;
};

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState('');

  async function load() {
    const res = await fetch(`${API}/videos`);
    const data = await res.json();
    setVideos(data.videos || []);
  }

  async function upload() {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setMsg('Uploading…');
    try {
      await fetch(`${API}/videos/upload`, { method: 'POST', body: fd });
      setMsg('Uploaded');
      setFile(null);
      await load();
    } catch {
      setMsg('Upload failed');
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <main style={{ maxWidth: 960, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 48, marginBottom: 8 }}>Cliplauch</h1>
      <a href={`${API}/health`}>API /health</a>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button onClick={upload}>Upload</button>
        <span>{msg}</span>
      </div>

      <h2 style={{ marginTop: 32 }}>Uploaded Videos</h2>

      <div style={{
        display: 'grid',
        gap: 24,
        gridTemplateColumns: '1fr',
      }}>
        {videos.map(v => (
          <div key={v.id}>
            <div style={{
              position: 'relative', width: '100%',
              aspectRatio: '16 / 9',
              background: '#000', overflow: 'hidden',
              borderRadius: 8,
            }}>
              <video
                controls
                preload="metadata"
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                poster={`${API}${v.thumbUrl}`}
              >
                <source src={`${API}${v.streamUrl}`} type="video/mp4" />
              </video>
            </div>
            <div style={{ marginTop: 8, wordBreak: 'break-all' }}>{v.filename}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
