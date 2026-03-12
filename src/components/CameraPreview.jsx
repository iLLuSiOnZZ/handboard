/**
 * CameraPreview.jsx
 * Small mirrored webcam feed in the bottom-right corner.
 * Uses a canvas to mirror the video horizontally so it feels natural.
 */

import { useEffect, useRef, useState } from 'react';

export default function CameraPreview({ videoRef }) {
  const previewRef = useRef(null);
  const rafRef     = useRef(null);
  const [minimised, setMinimised] = useState(false);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    function loop() {
      const video = videoRef.current;
      if (preview && video && video.readyState >= 2) {
        const ctx = preview.getContext('2d');
        const W = preview.width;
        const H = preview.height;
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -W, 0, W, H);
        ctx.restore();

        // Subtle hand-landmark overlay: green dot grid (cosmetic, low cost)
        ctx.fillStyle = 'rgba(126,200,80,0.45)';
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      style={{
        position      : 'absolute',
        bottom        : 18,
        right         : 18,
        zIndex        : 20,
        display       : 'flex',
        flexDirection : 'column',
        alignItems    : 'flex-end',
        gap           : 6,
        animation     : 'fadeIn 0.6s ease 0.3s both',
      }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setMinimised(m => !m)}
        style={{
          background    : 'rgba(8,18,8,0.85)',
          border        : '1px solid rgba(100,180,70,0.2)',
          borderRadius  : 8,
          color         : '#7ec850',
          padding       : '3px 10px',
          fontSize      : 10,
          fontFamily    : "'DM Mono',monospace",
          cursor        : 'pointer',
          letterSpacing : '0.06em',
          backdropFilter: 'blur(8px)',
        }}
      >
        {minimised ? '▲ cam' : '▼ hide'}
      </button>

      {/* Video canvas */}
      {!minimised && (
        <div
          style={{
            borderRadius: 12,
            overflow    : 'hidden',
            border      : '1px solid rgba(100,180,70,0.22)',
            boxShadow   : '0 4px 24px rgba(0,0,0,0.6)',
            background  : '#000',
            animation   : 'fadeIn 0.25s ease',
          }}
        >
          <canvas
            ref={previewRef}
            width={200}
            height={150}
            style={{ display: 'block' }}
          />
          {/* Label bar */}
          <div
            style={{
              background : 'rgba(8,18,8,0.8)',
              padding    : '3px 8px',
              fontSize   : 9,
              color      : 'rgba(126,200,80,0.6)',
              fontFamily : "'DM Mono',monospace",
              letterSpacing: '0.06em',
              textAlign  : 'center',
            }}
          >
            CAMERA FEED
          </div>
        </div>
      )}
    </div>
  );
}
