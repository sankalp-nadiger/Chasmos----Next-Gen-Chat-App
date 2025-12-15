import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle } from 'lucide-react';
import CosmosBackground from './CosmosBg';

const DeleteMessageModal = ({ 
  isOpen, 
  onClose, 
  onConfirmDelete, 
  effectiveTheme 
}) => {
  const handleDelete = () => {
    onConfirmDelete(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* CosmosBg for day mode */}
          {effectiveTheme.mode !== 'dark' && (
            <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0">
              <CosmosBackground/>
            </div>
          )}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`${effectiveTheme.primary} rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border ${effectiveTheme.border} relative z-10 ${effectiveTheme.mode !== 'dark' ? 'bg-white/90' : ''}`}
          >
            {/* Header */}
            <div className={`${effectiveTheme.secondary} p-5 border-b ${effectiveTheme.border}`}>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${effectiveTheme.text}`}>
                    Delete Message
                  </h2>
                  <p className={`text-sm ${effectiveTheme.textSecondary}`}>
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className={`flex items-start space-x-3 p-4 rounded-lg ${effectiveTheme.mode === 'dark' ? 'bg-red-900/20' : 'bg-red-50'} border border-red-200 dark:border-red-900/50`}>
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`text-sm font-medium ${effectiveTheme.text} mb-1`}>
                    Delete for everyone
                  </p>
                  <p className={`text-xs ${effectiveTheme.textSecondary}`}>
                    This message will be permanently deleted for everyone in this conversation. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-4 border-t ${effectiveTheme.border} flex justify-end space-x-3`}>
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg border ${effectiveTheme.border} ${effectiveTheme.text} hover:${effectiveTheme.hover} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteMessageModal;
