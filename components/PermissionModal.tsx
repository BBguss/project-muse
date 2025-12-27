import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Camera, ShieldAlert, RefreshCw } from 'lucide-react';

interface PermissionModalProps {
  onRetry: () => void;
  missingPermissions: ('location' | 'camera')[];
}

const PermissionModal: React.FC<PermissionModalProps> = ({ onRetry, missingPermissions }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl cursor-not-allowed"/>
      
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-sm p-8 relative z-50 shadow-2xl text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 mx-auto ring-1 ring-red-500/40 animate-pulse">
          <ShieldAlert className="text-red-400" size={40} />
        </div>
        
        <h3 className="text-xl font-display font-bold text-white mb-3">Akses Wajib Diperlukan</h3>
        
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Aplikasi ini memerlukan akses validasi. 
          <br/>
          Status: 
          {missingPermissions.includes('location') && <span className="text-red-400 font-bold ml-1">LOKASI DITOLAK</span>}
          {missingPermissions.includes('camera') && <span className="text-red-400 font-bold ml-1">KAMERA DITOLAK</span>}
        </p>

        <div className="flex justify-center gap-4 mb-8">
            <div className={`flex flex-col items-center gap-2 ${missingPermissions.includes('location') ? 'text-red-400' : 'text-emerald-500 opacity-50'}`}>
                <div className="p-3 bg-slate-800 rounded-lg border border-current"><MapPin size={24} /></div>
                <span className="text-[10px] uppercase font-bold tracking-wider">Lokasi</span>
            </div>
            <div className={`flex flex-col items-center gap-2 ${missingPermissions.includes('camera') ? 'text-red-400' : 'text-emerald-500 opacity-50'}`}>
                <div className="p-3 bg-slate-800 rounded-lg border border-current"><Camera size={24} /></div>
                <span className="text-[10px] uppercase font-bold tracking-wider">Kamera</span>
            </div>
        </div>

        <button onClick={onRetry} className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 group mb-3">
          <ShieldAlert size={18} /> Coba Lagi / Izinkan
        </button>

        <button onClick={() => window.location.reload()} className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-sm">
          <RefreshCw size={14} /> Refresh Halaman
        </button>
        
        <p className="mt-4 text-[10px] text-slate-500 leading-normal border-t border-slate-800 pt-3">
           Jika browser memblokir permanen (ikon 🔒 di URL bar), reset izin lalu klik Refresh.
        </p>
      </motion.div>
    </div>
  );
};

export default PermissionModal;