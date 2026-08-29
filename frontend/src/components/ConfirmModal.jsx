import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, Info, CheckCircle2, X } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  itemName = '',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning' | 'info' | 'success'
  requireTextMatch = '', // e.g. "DELETE ALL"
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  const [matchInput, setMatchInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMatchInput('');
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onCancel?.();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isMatchValid = !requireTextMatch || matchInput.trim() === requireTextMatch;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 size={30} style={{ color: '#ef4444' }} />;
      case 'warning':
        return <AlertTriangle size={30} style={{ color: '#f59e0b' }} />;
      case 'success':
        return <CheckCircle2 size={30} style={{ color: '#10b981' }} />;
      default:
        return <Info size={30} style={{ color: 'var(--primary)' }} />;
    }
  };

  return createPortal(
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Icon Button */}
        <button
          type="button"
          className="confirm-modal-close-btn"
          onClick={onCancel}
          title="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Top Icon Circle */}
        <div className={`confirm-modal-icon-wrap ${type}`}>
          {getIcon()}
        </div>

        {/* Title */}
        <h3 className="confirm-modal-title">
          {title}
        </h3>

        {/* Item Highlight Tag */}
        {itemName && (
          <div className={`confirm-modal-item-badge ${type}`}>
            {itemName}
          </div>
        )}

        {/* Message Description */}
        <p className="confirm-modal-message">
          {message}
        </p>

        {/* Input Match Requirement (e.g. Delete All) */}
        {requireTextMatch && (
          <div style={{ width: '100%', marginBottom: '1.5rem', textAlign: 'left' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.45rem'
              }}
            >
              Please type <span style={{ fontWeight: 800, color: '#ef4444' }}>{requireTextMatch}</span> to confirm:
            </label>
            <input
              type="text"
              className="form-input"
              value={matchInput}
              onChange={(e) => setMatchInput(e.target.value)}
              placeholder={`Type "${requireTextMatch}" here`}
              style={{ width: '100%', margin: 0 }}
              autoFocus
            />
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
          <button
            type="button"
            className="confirm-modal-btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`confirm-modal-btn-confirm ${type}`}
            onClick={() => {
              if (isMatchValid) onConfirm?.();
            }}
            disabled={isLoading || !isMatchValid}
            style={{
              opacity: isMatchValid && !isLoading ? 1 : 0.5,
              cursor: isMatchValid && !isLoading ? 'pointer' : 'not-allowed'
            }}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
