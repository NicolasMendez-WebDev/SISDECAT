import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', type = 'warning', onConfirm, onCancel
}) => {
  if (!isOpen) return null;

  const icons = {
    danger: <AlertTriangle className="text-red-500" size={24} />,
    warning: <AlertTriangle className="text-amber-500" size={24} />,
    info: <Info className="text-blue-500" size={24} />,
    success: <CheckCircle2 className="text-emerald-500" size={24} />
  };

  const colors = {
    danger: 'bg-red-500 hover:bg-red-600 focus:ring-red-500/20',
    warning: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500/20',
    info: 'bg-institutional-blue hover:bg-blue-700 focus:ring-blue-500/20',
    success: 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500/20'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden modal-content"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full shrink-0 ${type === 'danger' ? 'bg-red-50' : type === 'warning' ? 'bg-amber-50' : type === 'info' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                {icons[type]}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{message}</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => { onConfirm(); onCancel(); }}
              className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors shadow-sm focus:ring-4 outline-none ${colors[type]}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
