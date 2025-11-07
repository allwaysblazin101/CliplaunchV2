'use client';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

type VideoItem = {
  filename: string;
  size: number;
  title?: string | null;
  description?: string | null;
  streamUrl: string;
  thumbUrl?: string | null;
};

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function Watch() {
  const { query } = useRouter();
  const slug = Array.isArray(query.slug) ? query.slug[0] : query.slug;
  const [meta, setMeta] = useState<VideoItem | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const r = await fetch(`${API}/videos`, { credentials: 'include' });
        const j = await r.json();
        const found: VideoItem | undefined = (j.videos || []).find((v: VideoItem) => v.filename === slug);
        setMeta(found || null);
      } catch {
        setMeta(null);
      }
    })();
  }, [slug]);

  if (!slug) return null;

  const enc = encodeURIComponent(slug);
  const src = `${API}/videos/stream/${enc}`;
  const poster = meta?.thumbUrl ? (meta.thumbUrl.startsWith('http') ? meta.thumbUrl : `${API}${meta.thumbUrl}`) : undefined;

  return (
    <div style={{ padding:'16px', maxWidth:1000, margin:'0 auto', background:'#fff', color:'#000' }}>
      <a href="/" style={{ color:'#4b6bff', textDecoration:'none' }}>← Back</a>
      <h1>{meta?.title || 'Watch'}</h1>

      <div style={{
        width:'100%', aspectRatio:'16 / 9', background:'#000', borderRadius:12, overflow:'hidden'
      }}>
        <video
          src={src}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          // @ts-ignore
          webkit-playsinline="true"
          // @ts-ignore
          x5-playsinline="true"
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          disableRemotePlayback
          style={{ width:'100%', height:'100%', objectFit:'contain', background:'#000' }}
        />
      </div>

      <div style={{ marginTop:10, wordBreak:'break-all', color:'#555' }}>
        {meta?.description || slug}
      </div>
    </div>
  );
}
