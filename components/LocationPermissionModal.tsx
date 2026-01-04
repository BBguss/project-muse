import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';

// Fix TS errors with framer-motion props
const MotionDiv = motion.div as any;

interface LocationPermissionModalProps {
  onRetry: () => void;
}

const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({ onRetry }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with heavy blur to block content */}
      <MotionDiv 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
      />
      
      {/* Modal Content */}
      <MotionDiv 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-8 relative z-50 shadow-2xl text-center"
      >
        <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 mx-auto ring-1 ring-indigo-500/40 animate-pulse">
          <Navigation className="text-indigo-400" size={40} />
        </div>
        
        <h3 className="text-2xl font-display font-bold text-white mb-3">Akses Lokasi Diperlukan</h3>
        
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Untuk menjaga integritas voting dan mencegah spam, kami memerlukan akses lokasi akurat Anda.
          <br/><br/>
          <span className="text-red-400 text-xs">Mohon aktifkan izin lokasi di browser Anda untuk melanjutkan.</span>
        </p>

        <button 
          onClick={onRetry}
          className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 group"
        >
          <MapPin size={18} className="group-hover:animate-bounce" />
          Aktifkan Lokasi
        </button>
        
        <p className="mt-4 text-[10px] text-slate-600">
           Jika tombol tidak merespon, silakan reset izin lokasi di pengaturan situs browser (ikon gembok di URL bar).
        </p>
      </MotionDiv>
    </div>
  );
};

export default LocationPermissionModal;