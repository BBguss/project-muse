import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, ShieldCheck, Lock, AlertTriangle, X } from 'lucide-react';

// Fix TS errors with framer-motion props
const MotionDiv = motion.div as any;

interface PermissionModalProps {
  onRetry: () => void;
  onSkip?: () => void; 
  onClose: () => void;
  missingPermissions: ('location' | 'camera')[];
}

const PermissionModal: React.FC<PermissionModalProps> = ({ onRetry, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
      {/* Dimmed Background */}
      <MotionDiv 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm"
          onClick={onClose}
      />
      
      {/* Modal Box */}
      <MotionDiv 
          initial={{ scale: 0.9, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-6 relative z-50 shadow-2xl text-center"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white p-2">
            <X size={20} />
        </button>

        <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-5 mx-auto ring-1 ring-indigo-500/30">
          <MapPin className="text-indigo-400" size={32} />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">Izin Lokasi</h3>
        
        <p className="text-sm text-slate-400 leading-relaxed mb-6 px-2">
          Agar voting tetap adil dan mencegah bot, kami memerlukan akses ke lokasi perangkat Anda saat ini.
        </p>

        <div className="space-y-3">
            <button 
                onClick={onRetry} 
                className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/20 active:scale-95 flex items-center justify-center gap-2"
            >
                <Lock size={16} /> 
                Izinkan Akses
            </button>

            <button 
                onClick={onClose} 
                className="w-full py-3.5 rounded-xl bg-transparent text-slate-500 font-semibold hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            >
                Batal
            </button>
        </div>
        
        <p className="mt-4 text-[10px] text-slate-600">
           Data lokasi hanya digunakan untuk verifikasi voting.
        </p>

      </MotionDiv>
    </div>
  );
};

export default PermissionModal;