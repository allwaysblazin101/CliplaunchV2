'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';

type VideoItem = {
  filename: string;
  size: number;
  title?: string | null;
  description?: string | null;
  streamUrl: string;
  thumbUrl?: string | null;
};

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function Home() {
  const { publicKey, signMessage } = useWallet();
  const [status, setStatus] = useState('');
  const [authed, setAuthed] = useState(false);
  const [feed, setFeed] = useState<VideoItem[]>([]);
  const [busy, setBusy] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const descRef = useRef<HTMLTextAreaElement | null>(null);

  async function loadFeed() {
    const r = await fetch(`${API}/videos`, { credentials: 'include' });
    const j = await r.json();
    setFeed(j.videos || []);
  }

  useEffect(() => { loadFeed().catch(() => {}); }, []);

  async function verifyWallet() {
    if (!publicKey || !signMessage) { setStatus('Connect a wallet'); return; }
    try {
      setBusy(true);
      setStatus('Requesting nonce...');
      const nr = await fetch(`${API}/auth/nonce`, { credentials: 'include' });
      const { nonce } = await nr.json();

      const message = `Cliplaunch:${publicKey.toBase58()}:${nonce}`;
      setStatus('Waiting for wallet signature...');
      const signature = await signMessage(new TextEncoder().encode(message));

      setStatus('Verifying...');
      const vr = await fetch(`${API}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          address: publicKey.toBase58(),
          message,
          signature: Array.from(signature),
        }),
      });
      if (vr.ok) {
        setAuthed(true);
        setStatus('✅ Wallet Verified');
      } else {
        const t = await vr.text();
        setAuthed(false);
        setStatus(`❌ Verify failed: ${t}`);
      }
    } catch {
      setAuthed(false);
      setStatus('❌ Verify failed');
    } finally {
      setBusy(false);
    }
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!authed) { setStatus('Verify wallet first'); return; }
    const f = fileRef.current?.files?.[0];
    if (!f) { setStatus('Pick a file'); return; }
    const form = new FormData();
    form.append('file', f);
    if (titleRef.current?.value) form.append('title', titleRef.current.value);
    if (descRef.current?.value) form.append('description', descRef.current.value);

    try {
      setBusy(true);
      setStatus('Uploading...');
      const r = await fetch(`${API}/videos/upload`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      if (!r.ok) {
        const t = await r.text();
        setStatus(`❌ Upload failed: ${t}`);
        return;
      }
      setStatus('✅ Uploaded');
      if (fileRef.current) fileRef.current.value = '';
      if (titleRef.current) titleRef.current.value = '';
      if (descRef.current) descRef.current.value = '';
      await loadFeed();
    } catch {
      setStatus('❌ Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding:'24px', maxWidth:900, margin:'0 auto', background:'#fff', color:'#000' }}>
      <h1>Cliplaunch</h1>

      <button onClick={verifyWallet} disabled={busy} style={{ padding:'8px 12px', borderRadius:8 }}>
        Verify Wallet
      </button>
      <p>{status}</p>

      {authed && (
        <form onSubmit={upload} style={{ margin:'16px 0', padding:'12px', border:'1px solid #ddd', borderRadius:12 }}>
          <h3>Upload Video</h3>
          <div style={{ display:'grid', gap:8 }}>
            <input ref={titleRef} placeholder="Title (optional)" />
            <textarea ref={descRef} placeholder="Description (optional)" rows={3} />
            <input ref={fileRef} type="file" accept="video/*,.mov,.mp4,.m4v" />
            <button type="submit" disabled={busy} style={{ padding:'8px 12px', borderRadius:8 }}>
              Upload
            </button>
          </div>
        </form>
      )}

      <h2>Uploaded Videos</h2>
      <div style={{ display:'grid', gap:16 }}>
        {feed.map((v) => {
          const poster = v.thumbUrl || '';
          const watchHref = `/watch/${encodeURIComponent(v.filename)}`;
          const imgSrc = poster ? (poster.startsWith('http') ? poster : `${API}${poster}`) : '';
          return (
            <div key={v.filename} style={{ border:'1px solid #e5e5e5', borderRadius:12, padding:12 }}>
              <Link href={watchHref} style={{ display:'block', textDecoration:'none' }}>
                <div style={{
                  width:'100%', aspectRatio:'16 / 9', background:'#000', borderRadius:8,
                  overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center'
                }}>
                  {imgSrc
                    ? <img src={imgSrc} alt={v.title || v.filename} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ color:'#999' }}>No thumbnail</div>
                  }
                </div>
              </Link>

              <div style={{ marginTop:8, fontWeight:600, wordBreak:'break-all' }}>
                {v.title || v.filename}
              </div>
              {v.description && <div style={{ marginTop:4, color:'#666', whiteSpace:'pre-wrap' }}>{v.description}</div>}

              {/* Optional: keep text link too */}
              <div style={{ marginTop:6 }}>
                <Link href={watchHref} style={{ color:'#4b6bff' }}>
                  Watch →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
