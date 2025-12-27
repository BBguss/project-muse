import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Camera, ShieldAlert } from 'lucide-react';

interface PermissionModalProps {
  onRetry: () => void;
  missingPermissions: ('location' | 'camera')[];
}

const PermissionModal: React.FC<PermissionModalProps> = ({ onRetry, missingPermissions }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with heavy blur to block content - Cannot be clicked to close */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl cursor-not-allowed"
      />
      
      {/* Modal Content */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-sm p-8 relative z-50 shadow-2xl text-center"
      >
        {/* CLOSE BUTTON REMOVED - User MUST accept permissions to proceed */}

        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 mx-auto ring-1 ring-red-500/40 animate-pulse">
          <ShieldAlert className="text-red-400" size={40} />
        </div>
        
        <h3 className="text-xl font-display font-bold text-white mb-3">Akses Wajib Diperlukan</h3>
        
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Aplikasi ini memerlukan akses penuh untuk validasi voting. Anda <strong>harus mengizinkan</strong> akses berikut untuk melanjutkan:
        </p>

        <div className="flex justify-center gap-4 mb-8">
            <div className={`flex flex-col items-center gap-2 ${missingPermissions.includes('location') ? 'text-red-400' : 'text-slate-600 opacity-30'}`}>
                <div className="p-3 bg-slate-800 rounded-lg border border-current">
                    <MapPin size={24} />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider">Lokasi</span>
            </div>
            <div className={`flex flex-col items-center gap-2 ${missingPermissions.includes('camera') ? 'text-red-400' : 'text-slate-600 opacity-30'}`}>
                <div className="p-3 bg-slate-800 rounded-lg border border-current">
                    <Camera size={24} />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider">Kamera</span>
            </div>
        </div>

        <button 
          onClick={onRetry}
          className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 group animate-pulse"
        >
          <ShieldAlert size={18} />
          Izinkan Akses
        </button>
        
        <p className="mt-4 text-[10px] text-slate-500 leading-normal border-t border-slate-800 pt-3">
           Jika browser memblokir secara permanen, klik ikon 🔒 di sebelah URL, reset izin, lalu <strong>Muat Ulang (Refresh)</strong> halaman.
        </p>
      </motion.div>
    </div>
  );
};

export default PermissionModal;