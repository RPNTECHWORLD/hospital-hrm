import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastNotification = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose?.();
      }, toast.duration || 3500);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const { message, type = 'success' } = toast;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: '1.75rem',
        right: '1.75rem',
        zIndex: 999999,
        animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div className={`toast-notification-card ${isSuccess ? 'success' : isError ? 'error' : 'info'}`}>
        {isSuccess && <CheckCircle2 size={22} style={{ color: '#10b981', flexShrink: 0 }} />}
        {isError && <AlertCircle size={22} style={{ color: '#ef4444', flexShrink: 0 }} />}
        {!isSuccess && !isError && <Info size={22} style={{ color: 'var(--primary)', flexShrink: 0 }} />}

        <div style={{ flex: 1, fontSize: '0.92rem', fontWeight: 700, lineHeight: 1.4 }}>
          {message}
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.3rem',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '50%'
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>,
    document.body
  );
};

export default ToastNotification;
