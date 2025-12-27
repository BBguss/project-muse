import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

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
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2 ring-1 ring-emerald-500/40">
            <CheckCircle2 className="text-emerald-400" size={32} />
          </div>
          
          <div>
            <h3 className="text-xl font-display font-bold text-white mb-2">Konfirmasi Pilihan</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Anda memilih <span className="text-white font-bold underline decoration-indigo-500">{characterName}</span>.
            </p>
            <p className="text-xs text-slate-500 mt-3 font-medium">
              Data Anda telah diverifikasi aman. Lanjutkan?
            </p>
          </div>

          <div className="flex w-full gap-3 mt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors text-sm border border-slate-700"
            >
              Kembali
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20 text-sm border border-emerald-500/50"
            >
              Vote Sekarang
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VoteConfirmationModal;