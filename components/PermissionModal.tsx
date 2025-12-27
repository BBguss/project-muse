import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Camera, ShieldCheck, Lock } from 'lucide-react';

interface PermissionModalProps {
  onRetry: () => void;
  onClose: () => void;
  missingPermissions: ('location' | 'camera')[];
}

const PermissionModal: React.FC<PermissionModalProps> = ({ onRetry, onClose, missingPermissions }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Dimmed Background - Clicking outside closes it, but user can't proceed without accepting */}
      <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
          onClick={onClose}
      />
      
      {/* Modal Box */}
      <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-slate-900 border border-indigo-500/30 rounded-2xl w-full max-w-sm p-8 relative z-50 shadow-2xl text-center"
      >
        <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 mx-auto ring-1 ring-indigo-500/40 animate-pulse">
          <ShieldCheck className="text-indigo-400" size={40} />
        </div>
        
        <h3 className="text-xl font-display font-bold text-white mb-3">Verifikasi Anti-Bot</h3>
        
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Sistem kami mendeteksi aktivitas voting yang tinggi. Untuk memastikan Anda adalah manusia (bukan bot), mohon aktifkan verifikasi perangkat.
        </p>

        <div className="bg-slate-950/50 rounded-xl p-4 mb-8 border border-slate-800">
            <div className="flex items-center justify-between mb-3 last:mb-0">
                <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                    <MapPin size={16} className={missingPermissions.includes('location') ? 'text-red-400' : 'text-emerald-400'} />
                    <span>Geo-Tagging</span>
                </div>
                {missingPermissions.includes('location') ? (
                    <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">Wajib</span>
                ) : (
                    <span className="text-[10px] text-emerald-500">Aktif</span>
                )}
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                    <Camera size={16} className={missingPermissions.includes('camera') ? 'text-red-400' : 'text-emerald-400'} />
                    <span>Biometric Check</span>
                </div>
                {missingPermissions.includes('camera') ? (
                    <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">Wajib</span>
                ) : (
                    <span className="text-[10px] text-emerald-500">Aktif</span>
                )}
            </div>
        </div>

        <button onClick={onRetry} className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 group relative overflow-hidden">
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <Lock size={16} /> Verifikasi & Vote
        </button>
        
        <button onClick={onClose} className="mt-4 text-xs text-slate-600 hover:text-slate-400 transition-colors">
            Batal
        </button>
      </motion.div>
    </div>
  );
};

export default PermissionModal;