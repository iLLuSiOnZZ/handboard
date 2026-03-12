/**
 * Toolbar.jsx
 * Floating left-side panel for tool, colour, stroke-width selection
 * and action buttons (undo, clear, export).
 */

import { useState } from 'react';

// ── Palette & tool definitions ────────────────────────────────────────────────

const COLORS = [
  { value: '#f0ede4', label: 'Chalk White' },
  { value: '#ffd43b', label: 'Yellow' },
  { value: '#ff8fab', label: 'Pink' },
  { value: '#74c0fc', label: 'Sky Blue' },
  { value: '#69db7c', label: 'Mint' },
  { value: '#ffa94d', label: 'Orange' },
  { value: '#da77f2', label: 'Lavender' },
  { value: '#ff6b6b', label: 'Coral' },
];

const TOOLS = [
  { id: 'pen',     icon: '✏️', label: 'Pen  (☝️ index finger)' },
  { id: 'rect',    icon: '⬜', label: 'Rectangle  (✌️ peace sign)' },
  { id: 'ellipse', icon: '⭕', label: 'Ellipse  (✌️ peace sign)' },
  { id: 'arrow',   icon: '➡️', label: 'Arrow  (✌️ peace sign)' },
];

const WIDTHS = [
  { value: 2,  display: 2  },
  { value: 4,  display: 4  },
  { value: 8,  display: 8  },
  { value: 14, display: 11 }, // cap visual height so it doesn't overflow
];

// ── Toolbar component ─────────────────────────────────────────────────────────

export default function Toolbar({
  tool, setTool,
  color, setColor,
  strokeWidth, setStrokeWidth,
  onUndo, onClear, onExport,
  onToggleHelp,
}) {
  const [hovered, setHovered] = useState(null);

  return (
    <aside
      style={{
        position      : 'absolute',
        top           : '50%',
        left          : 16,
        transform     : 'translateY(-50%)',
        zIndex        : 20,
        display       : 'flex',
        flexDirection : 'column',
        alignItems    : 'center',
        gap           : 5,
        background    : 'rgba(8,18,8,0.92)',
        border        : '1px solid rgba(100,180,70,0.18)',
        borderRadius  : 18,
        padding       : '14px 9px',
        backdropFilter: 'blur(14px)',
        boxShadow     : '0 8px 36px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
        userSelect    : 'none',
        width         : 52,
        animation     : 'fadeIn 0.5s ease',
      }}
    >
      {/* Branding */}
      <div style={{ fontFamily: "'Caveat',cursive", fontSize: 22, color: '#7ec850', lineHeight: 1, paddingBottom: 8, borderBottom: '1px solid rgba(100,180,70,0.12)', marginBottom: 2, width: '100%', textAlign: 'center' }}>
        ✋
      </div>

      {/* Tools */}
      <SectionLabel>TOOL</SectionLabel>
      {TOOLS.map(t => (
        <ToolBtn
          key={t.id}
          active={tool === t.id}
          title={t.label}
          onClick={() => setTool(t.id)}
        >
          {t.icon}
        </ToolBtn>
      ))}

      <Divider />

      {/* Colours */}
      <SectionLabel>COLOR</SectionLabel>
      {COLORS.map(c => (
        <button
          key={c.value}
          title={c.label}
          onClick={() => setColor(c.value)}
          style={{
            background  : c.value,
            border      : color === c.value ? '2.5px solid #fff' : '2px solid transparent',
            borderRadius: 7,
            width       : 26,
            height      : 26,
            cursor      : 'pointer',
            boxShadow   : color === c.value ? `0 0 10px ${c.value}88` : 'none',
            transition  : 'all 0.13s',
            flexShrink  : 0,
          }}
        />
      ))}

      <Divider />

      {/* Stroke width */}
      <SectionLabel>SIZE</SectionLabel>
      {WIDTHS.map(w => (
        <button
          key={w.value}
          title={`${w.value}px`}
          onClick={() => setStrokeWidth(w.value)}
          style={{
            background    : 'transparent',
            border        : 'none',
            cursor        : 'pointer',
            display       : 'flex',
            alignItems    : 'center',
            justifyContent: 'center',
            width         : 36,
            height        : 24,
            borderRadius  : 6,
            outline       : strokeWidth === w.value ? '1.5px solid #7ec850' : '1px solid transparent',
            outlineOffset : 2,
          }}
        >
          <div
            style={{
              background  : color,
              height      : Math.min(w.display, 12),
              width       : 22,
              borderRadius: 99,
              boxShadow   : `0 0 5px ${color}66`,
              opacity     : 0.9,
            }}
          />
        </button>
      ))}

      <Divider />

      {/* Actions */}
      <SectionLabel>ACTION</SectionLabel>
      <ActionBtn title="Undo  (Ctrl+Z)" onClick={onUndo}>↩</ActionBtn>
      <ActionBtn title="Clear all  (Delete)" onClick={onClear}>🗑</ActionBtn>
      <ActionBtn title="Export PNG  (Ctrl+S)" onClick={onExport}>💾</ActionBtn>
      <ActionBtn title="Help / gestures  (?)" onClick={onToggleHelp}>?</ActionBtn>
    </aside>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 8, letterSpacing: '0.09em', color: 'rgba(126,200,80,0.45)', fontFamily: "'DM Mono',monospace", marginBottom: 1, marginTop: 1 }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ width: '80%', height: 1, background: 'rgba(100,180,70,0.10)', margin: '3px 0' }} />;
}

function ToolBtn({ active, children, title, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        background  : active ? 'rgba(126,200,80,0.14)' : 'transparent',
        border      : active ? '1px solid rgba(126,200,80,0.45)' : '1px solid transparent',
        borderRadius: 10,
        width       : 38,
        height      : 38,
        fontSize    : 18,
        cursor      : 'pointer',
        display     : 'flex',
        alignItems  : 'center',
        justifyContent: 'center',
        transition  : 'all 0.13s',
        flexShrink  : 0,
      }}
    >
      {children}
    </button>
  );
}

function ActionBtn({ children, onClick, title }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background  : hover ? 'rgba(126,200,80,0.08)' : 'transparent',
        border      : `1px solid ${hover ? 'rgba(126,200,80,0.35)' : 'rgba(100,180,70,0.12)'}`,
        borderRadius: 10,
        width       : 38,
        height      : 34,
        fontSize    : 15,
        cursor      : 'pointer',
        color       : hover ? '#d4f5b0' : '#888',
        transition  : 'all 0.13s',
        fontFamily  : 'inherit',
        flexShrink  : 0,
      }}
    >
      {children}
    </button>
  );
}
