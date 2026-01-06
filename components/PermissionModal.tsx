import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Lock, Camera, CheckCircle2, Loader2, ShieldCheck, X } from 'lucide-react';

// Fix TS errors with framer-motion props
const MotionDiv = motion.div as any;

interface PermissionModalProps {
  onSuccess: (locationData: any) => void;
  onClose: () => void;
}

type VerificationStep = 'idle' | 'locating' | 'camera' | 'finishing';

const PermissionModal: React.FC<PermissionModalProps> = ({ onSuccess, onClose }) => {
  const [step, setStep] = useState<VerificationStep>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startVerification = async () => {
    setStep('locating');
    setErrorMsg(null);

    // 1. Request Precise Location
    try {
        if (!navigator.geolocation) throw new Error("Geolocation not supported");

        const locationData: any = await new Promise((resolve, reject) => {
             navigator.geolocation.getCurrentPosition(
                 (position) => {
                     resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                     });
                 },
                 (err) => {
                     // Error handling specific to browsers
                     let msg = "Akses lokasi ditolak.";
                     if (err.code === 1) msg = "Izin lokasi diblokir. Mohon aktifkan di pengaturan browser.";
                     else if (err.code === 2) msg = "Sinyal GPS lemah/tidak tersedia.";
                     else if (err.code === 3) msg = "Waktu permintaan habis.";
                     reject(msg);
                 },
                 { 
                     enableHighAccuracy: true, // REQUIRE PRECISE LOCATION
                     timeout: 15000, 
                     maximumAge: 0 
                 }
             );
        });

        // 2. Request Camera (Check only, then stop)
        setStep('camera');
        // Small artificial delay so user sees the "Camera" step visual
        await new Promise(r => setTimeout(r, 600)); 

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // Stop immediately, we just wanted to trigger the permission prompt/check
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            console.warn("Camera permission denied (optional but preferred)");
            // We allow proceeding even if camera fails, or you can block it here:
            // throw "Camera access required for verification.";
        }

        // 3. Finish
        setStep('finishing');
        await new Promise(r => setTimeout(r, 800)); // Success animation time
        onSuccess(locationData);

    } catch (err: any) {
        setStep('idle');
        setErrorMsg(typeof err === 'string' ? err : err.message || "Gagal verifikasi.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
      {/* Dimmed Background */}
      <MotionDiv 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
          onClick={step === 'idle' ? onClose : undefined}
      />
      
      {/* Modal Box */}
      <MotionDiv 
          initial={{ scale: 0.9, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-8 relative z-50 shadow-2xl text-center overflow-hidden"
      >
        {step === 'idle' && (
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white p-2">
                <X size={20} />
            </button>
        )}

        {/* --- DYNAMIC ICON --- */}
        <div className="relative w-20 h-20 mx-auto mb-6">
            {step === 'idle' && (
                 <div className="w-full h-full rounded-full bg-indigo-500/10 flex items-center justify-center ring-1 ring-indigo-500/30">
                    <ShieldCheck className="text-indigo-400" size={40} />
                 </div>
            )}
            {step === 'locating' && (
                <div className="w-full h-full rounded-full bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/30 relative">
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-500/50 animate-ping opacity-75"></div>
                    <MapPin className="text-emerald-400 relative z-10" size={36} />
                </div>
            )}
            {step === 'camera' && (
                <div className="w-full h-full rounded-full bg-rose-500/10 flex items-center justify-center ring-1 ring-rose-500/30">
                     <div className="absolute inset-0 rounded-full border-t-2 border-rose-500 animate-spin"></div>
                     <Camera className="text-rose-400" size={36} />
                </div>
            )}
            {step === 'finishing' && (
                <MotionDiv 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="w-full h-full rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                >
                    <CheckCircle2 className="text-white" size={48} />
                </MotionDiv>
            )}
        </div>
        
        {/* --- DYNAMIC TEXT --- */}
        <h3 className="text-2xl font-display font-bold text-white mb-2">
            {step === 'idle' && "Verifikasi Keamanan"}
            {step === 'locating' && "Mencari Koordinat..."}
            {step === 'camera' && "Pengecekan Perangkat..."}
            {step === 'finishing' && "Terverifikasi!"}
        </h3>
        
        <p className="text-sm text-slate-400 leading-relaxed mb-8 px-2 min-h-[40px]">
            {step === 'idle' && (errorMsg ? <span className="text-red-400 font-bold">{errorMsg}</span> : "Untuk menjaga voting tetap adil, sistem akan memverifikasi lokasi presisi dan perangkat Anda.")}
            {step === 'locating' && "Mohon izinkan akses lokasi presisi saat diminta browser."}
            {step === 'camera' && "Memastikan keaslian perangkat Anda."}
            {step === 'finishing' && "Data aman. Mengalihkan ke voting..."}
        </p>

        {/* --- ACTIONS --- */}
        {step === 'idle' && (
            <div className="space-y-3">
                <button 
                    onClick={startVerification} 
                    className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/30 active:scale-95 flex items-center justify-center gap-3"
                >
                    <Lock size={20} /> 
                    Mulai Verifikasi
                </button>

                <button 
                    onClick={onClose} 
                    className="w-full py-3 rounded-xl bg-transparent text-slate-500 font-medium hover:text-slate-300 transition-colors text-sm"
                >
                    Batalkan
                </button>
            </div>
        )}

        {step !== 'idle' && step !== 'finishing' && (
             <div className="w-full py-4 flex items-center justify-center gap-3 text-slate-500 text-sm animate-pulse">
                 <Loader2 className="animate-spin" size={18} />
                 <span>Sedang memproses...</span>
             </div>
        )}

      </MotionDiv>
    </div>
  );
};

export default PermissionModal;