'use client';
import { useEffect, useState } from 'react';

type Video = { id?: string; filename: string; path: string; size: number; createdAt?: string; };

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      const res = await fetch(`${API}/videos`);
      const j = await res.json();
      // Support both shapes {files: string[]} and {videos: Video[]}
      const list: Video[] = j.videos ?? (j.files ?? []).map((f: string) => ({ filename: f, path: `/tmp/${f}`, size: 0 }));
      setVideos(list);
    } catch (e) {
      setVideos([]);
    }
  }

  async function upload() {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setMsg('Uploading...');
    try {
      const res = await fetch(`${API}/videos/upload`, { method: 'POST', body: fd });
      const j = await res.json();
      setMsg(res.ok ? 'Uploaded' : 'Upload failed');
      await load();
    } catch {
      setMsg('Upload failed');
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <main style={{ maxWidth: 960, margin: '40px auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 48, marginBottom: 8 }}>Cliplauch</h1>
      <a href={`${API}/health`}>API /health</a>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button onClick={upload}>Upload</button>
        <span>{msg}</span>
      </div>

      <h2 style={{ marginTop: 32 }}>Uploaded Videos</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 24
        }}
      >
        {videos.map((v) => {
          const name = v.filename;
          const src  = `${API}/videos/${encodeURIComponent(name)}`;
          const poster = `${API}/videos/thumb/${encodeURIComponent(name)}`;
          return (
            <div key={name}>
              <div style={{
                position: 'relative',
                width: '100%',
                background: '#000',
                borderRadius: 8,
                overflow: 'hidden',
                aspectRatio: '16 / 9'
              }}>
                <video
                  controls
                  preload="metadata"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                  poster={poster}
                >
                  <source src={src} type="video/mp4" />
                </video>
              </div>
              <div style={{ marginTop: 8, wordBreak: 'break-all' }}>{name}</div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
