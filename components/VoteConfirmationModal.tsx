import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface VoteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  characterName: string;
}

const VoteConfirmationModal: React.FC<VoteConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  characterName 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 relative z-50 shadow-2xl overflow-hidden"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-2 ring-1 ring-amber-500/40">
            <AlertTriangle className="text-amber-400" size={32} />
          </div>
          
          <div>
            <h3 className="text-xl font-display font-bold text-white mb-2">Konfirmasi Vote?</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Apakah kamu yakin ingin memilih <span className="text-indigo-400 font-bold">{characterName}</span>?
            </p>
            <p className="text-xs text-slate-500 mt-2 font-medium bg-slate-800/50 py-1 px-2 rounded inline-block border border-slate-700/50">
              ⚠️ Kamu hanya bisa melakukan voting 1 kali.
            </p>
          </div>

          <div className="flex w-full gap-3 mt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors text-sm border border-slate-700"
            >
              Batal
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20 text-sm border border-indigo-500/50"
            >
              Ya, Vote!
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VoteConfirmationModal;