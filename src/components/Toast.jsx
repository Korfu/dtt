import { T } from '../themes';
import { IconCheck, IconClose } from '../icons';

export function Toast({ toast }) {
  return (
    <div style={{
      position: 'absolute', bottom: 110, left: 20, right: 20,
      padding: '14px 18px', borderRadius: 14,
      background: T.ink, color: T.bg,
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 14, zIndex: 200,
      animation: 'toastIn 0.22s ease-out',
      boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
    }}>
      <style>{`@keyframes toastIn { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: toast.type === 'success' ? T.accent : 'rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {toast.type === 'success'
          ? <IconCheck size={12} stroke={T.accentInk}/>
          : <IconClose size={12} stroke={T.bg}/>}
      </div>
      <span>{toast.text}</span>
    </div>
  );
}
