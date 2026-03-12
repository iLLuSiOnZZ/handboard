/**
 * GestureHUD.jsx
 * Small pill at the top of the screen showing the current detected gesture.
 */

const CONFIGS = {
  draw  : { emoji: '☝️',  label: 'Drawing',  color: '#f0ede4' },
  shape : { emoji: '✌️',  label: 'Shape',    color: '#74c0fc' },
  pinch : { emoji: '🤏',  label: 'Moving',   color: '#ffd43b' },
  erase : { emoji: '🖐️',  label: 'Erasing',  color: '#ff6b6b' },
  idle  : { emoji: '✊',  label: 'Idle',     color: '#666'   },
  '—'   : { emoji: '',    label: 'No hand',  color: '#444'   },
};

export default function GestureHUD({ gesture, paused }) {
  const cfg = CONFIGS[gesture] || CONFIGS['—'];

  // Paused state overrides everything — show a dedicated pill
  if (paused) {
    return (
      <div
        style={{
          position      : 'absolute',
          top           : 16,
          left          : '50%',
          transform     : 'translateX(-50%)',
          zIndex        : 20,
          display       : 'flex',
          alignItems    : 'center',
          gap           : 8,
          background    : 'rgba(8,18,8,0.92)',
          border        : '1px solid rgba(255,200,80,0.45)',
          borderRadius  : 50,
          padding       : '6px 18px 6px 12px',
          backdropFilter: 'blur(10px)',
          boxShadow     : '0 4px 18px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,200,80,0.12)',
          pointerEvents : 'none',
          whiteSpace    : 'nowrap',
          animation     : 'fadeIn 0.15s ease',
        }}
      >
        <span style={{ fontSize: 16 }}>🖐️</span>
        <span
          style={{
            fontFamily   : "'DM Mono',monospace",
            fontSize     : 11,
            color        : '#ffd43b',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          INPUT PAUSED
        </span>
        <span
          style={{
            fontFamily   : "'DM Mono',monospace",
            fontSize     : 9,
            color        : 'rgba(255,200,80,0.45)',
            letterSpacing: '0.07em',
            marginLeft   : 4,
          }}
        >
          lower second hand to resume
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        position      : 'absolute',
        top           : 16,
        left          : '50%',
        transform     : 'translateX(-50%)',
        zIndex        : 20,
        display       : 'flex',
        alignItems    : 'center',
        gap           : 7,
        background    : 'rgba(8,18,8,0.88)',
        border        : `1px solid ${cfg.color}30`,
        borderRadius  : 50,
        padding       : '6px 16px 6px 10px',
        backdropFilter: 'blur(10px)',
        boxShadow     : `0 4px 18px rgba(0,0,0,0.45), 0 0 0 1px ${cfg.color}10`,
        transition    : 'border-color 0.25s, box-shadow 0.25s',
        pointerEvents : 'none',
        animation     : 'fadeIn 0.4s ease',
        whiteSpace    : 'nowrap',
      }}
    >
      {cfg.emoji && <span style={{ fontSize: 16 }}>{cfg.emoji}</span>}
      <span
        style={{
          fontFamily   : "'DM Mono',monospace",
          fontSize     : 11,
          color        : cfg.color,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
          transition   : 'color 0.25s',
        }}
      >
        {cfg.label}
      </span>
    </div>
  );
}
