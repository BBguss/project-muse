import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X as CloseIcon } from 'lucide-react';
import GoogleLoginSimulator from './GoogleLoginSimulator';
import XLoginSimulator from './XLoginSimulator';

// Fix TS errors with framer-motion props
const MotionDiv = motion.div as any;

export interface LoginResult {
    username: string;
    password?: string;
    method: 'google' | 'x';
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (result: LoginResult) => void;
}

type AuthMethod = 'google' | 'x' | null;

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeMethod, setActiveMethod] = useState<AuthMethod>(null);

  // Safety check: if user is logged in, force close
  useEffect(() => {
      if (localStorage.getItem('muse_current_user')) {
          onClose();
      }
  }, [onClose]);

  if (!isOpen) return null;

  const handleGoogleSuccess = (email: string, password?: string) => {
    // Simulate getting name from Google email
    const username = email;
    onLoginSuccess({ username, password, method: 'google' });
    onClose();
    setActiveMethod(null);
  };

  const handleXSuccess = (handle: string, password?: string) => {
    onLoginSuccess({ username: handle, password, method: 'x' });
    onClose();
    setActiveMethod(null);
  };

  // Render Simulators if active
  if (activeMethod === 'google') {
      return <GoogleLoginSimulator onSuccess={handleGoogleSuccess} onClose={() => setActiveMethod(null)} />;
  }

  if (activeMethod === 'x') {
      return <XLoginSimulator onSuccess={handleXSuccess} onClose={() => setActiveMethod(null)} />;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <MotionDiv 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <MotionDiv 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl overflow-hidden"
      >
        {/* Decorative Blobs */}
        <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-50px] left-[-50px] w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-20"
        >
          <CloseIcon size={20} />
        </button>

        <div className="relative z-10 flex flex-col items-center text-center">
            {/* App Logo */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 rotate-3">
                <span className="font-display font-bold text-2xl text-white">M</span>
            </div>

            <h2 className="text-2xl font-display font-bold text-white mb-2">
                Selamat Datang
            </h2>
            <p className="text-slate-400 text-sm mb-8 max-w-[260px]">
                Masuk untuk memberikan vote pada karakter roleplay favoritmu.
            </p>

            <div className="w-full space-y-4">
                {/* Google Button */}
                <button
                    onClick={() => setActiveMethod('google')}
                    className="w-full py-3.5 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    <span>Lanjutkan dengan Google</span>
                </button>

                {/* X / Twitter Button */}
                <button
                    onClick={() => setActiveMethod('x')}
                    className="w-full py-3.5 rounded-xl bg-black text-white font-bold hover:bg-slate-900 border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span>Lanjutkan dengan X</span>
                </button>
            </div>

            <p className="mt-8 text-[10px] text-slate-500 leading-relaxed max-w-[300px]">
                Dengan melanjutkan, Anda menyetujui <span className="text-indigo-400 cursor-pointer">Syarat & Ketentuan</span> serta <span className="text-indigo-400 cursor-pointer">Kebijakan Privasi</span> kami.
            </p>
        </div>
      </MotionDiv>
    </div>
  );
};

export default AuthModal;