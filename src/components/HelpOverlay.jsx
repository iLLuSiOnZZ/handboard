/**
 * HelpOverlay.jsx
 * A dismissable gesture reference card.
 */

export default function HelpOverlay({ onClose }) {
  const gestures = [
    { gesture: '☝️', name: 'Index finger only', action: 'Freehand draw  (pen / selected shape)' },
    { gesture: '✌️', name: 'Peace sign',         action: 'Draw shape from toolbar  (rect / ellipse / arrow)' },
    { gesture: '🤏', name: 'Pinch',              action: 'Grab and move any element' },
    { gesture: '🖐️', name: 'Open palm',          action: 'Erase elements in radius' },
    { gesture: '✊', name: 'Fist / other',        action: 'Cursor idle — no action' },
    { gesture: '🖐️', name: '2nd hand open palm', action: 'PAUSE — freezes all drawing input so you can reposition your hand' },
  ];

  const shortcuts = [
    { key: 'Ctrl + Z',        desc: 'Undo last action' },
    { key: 'Ctrl + Shift + X',desc: 'Clear canvas' },
    { key: 'Ctrl + S',        desc: 'Export as PNG' },
    { key: '1 – 4',           desc: 'Switch tool (pen, rect, ellipse, arrow)' },
    { key: '?',               desc: 'Toggle this help panel' },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position      : 'fixed',
        inset         : 0,
        zIndex        : 50,
        background    : 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        display       : 'flex',
        alignItems    : 'center',
        justifyContent: 'center',
        animation     : 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background    : 'rgba(10,22,10,0.97)',
          border        : '1px solid rgba(100,180,70,0.25)',
          borderRadius  : 20,
          padding       : '28px 32px',
          maxWidth      : 520,
          width         : '90vw',
          boxShadow     : '0 20px 60px rgba(0,0,0,0.7)',
          animation     : 'fadeIn 0.25s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Caveat',cursive", fontSize: 28, color: '#7ec850', fontWeight: 700 }}>
            ✋ HandBoard Gestures
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#888', fontSize: 22, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Gestures table */}
        <div style={{ marginBottom: 22 }}>
          <Label>HAND GESTURES</Label>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {gestures.map(g => (
                <tr key={g.gesture} style={{ borderBottom: '1px solid rgba(100,180,70,0.08)' }}>
                  <td style={{ padding: '7px 4px', fontSize: 22, width: 36 }}>{g.gesture}</td>
                  <td style={{ padding: '7px 8px', fontSize: 12, color: '#aaa', fontFamily: "'DM Mono',monospace", width: 130 }}>{g.name}</td>
                  <td style={{ padding: '7px 4px', fontSize: 12, color: '#d4f5b0', fontFamily: "'DM Mono',monospace" }}>{g.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Keyboard shortcuts */}
        <div>
          <Label>KEYBOARD SHORTCUTS</Label>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {shortcuts.map(s => (
                <tr key={s.key} style={{ borderBottom: '1px solid rgba(100,180,70,0.06)' }}>
                  <td style={{ padding: '6px 4px', width: 160 }}>
                    <kbd style={{ background: 'rgba(126,200,80,0.1)', border: '1px solid rgba(126,200,80,0.25)', borderRadius: 5, padding: '2px 7px', fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#7ec850', whiteSpace: 'nowrap' }}>
                      {s.key}
                    </kbd>
                  </td>
                  <td style={{ padding: '6px 8px', fontSize: 12, color: '#bbb', fontFamily: "'DM Mono',monospace" }}>{s.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 18, fontSize: 11, color: '#555', fontFamily: "'DM Mono',monospace", textAlign: 'center' }}>
          Click anywhere outside this panel to close
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 9, letterSpacing: '0.1em', color: 'rgba(126,200,80,0.5)', fontFamily: "'DM Mono',monospace", marginBottom: 6 }}>
      {children}
    </div>
  );
}
