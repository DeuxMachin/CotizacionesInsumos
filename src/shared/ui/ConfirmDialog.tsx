import React from 'react';
import { FiX, FiAlertTriangle, FiInfo, FiCheckCircle } from 'react-icons/fi';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  loading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: FiAlertTriangle,
          iconColor: 'text-red-500',
          iconBg: 'bg-red-100 dark:bg-red-900/20',
          confirmBg: 'bg-red-500 hover:bg-red-600',
          confirmText: 'text-white'
        };
      case 'warning':
        return {
          icon: FiAlertTriangle,
          iconColor: 'text-orange-500',
          iconBg: 'bg-orange-100 dark:bg-orange-900/20',
          confirmBg: 'bg-orange-500 hover:bg-orange-600',
          confirmText: 'text-white'
        };
      case 'info':
        return {
          icon: FiInfo,
          iconColor: 'text-blue-500',
          iconBg: 'bg-blue-100 dark:bg-blue-900/20',
          confirmBg: 'bg-blue-500 hover:bg-blue-600',
          confirmText: 'text-white'
        };
      case 'success':
        return {
          icon: FiCheckCircle,
          iconColor: 'text-green-500',
          iconBg: 'bg-green-100 dark:bg-green-900/20',
          confirmBg: 'bg-green-500 hover:bg-green-600',
          confirmText: 'text-white'
        };
    }
  };

  const styles = getTypeStyles();
  const Icon = styles.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md rounded-lg shadow-xl animate-slideUp"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${styles.iconBg}`}>
              <Icon className={`w-5 h-5 ${styles.iconColor}`} />
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            disabled={loading}
          >
            <FiX className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              color: 'var(--text-primary)',
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${styles.confirmBg} ${styles.confirmText}`}
            style={{ 
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
