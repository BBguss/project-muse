import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, ArrowUp, Share2, Lock, ChevronRight, Trophy, MousePointerClick } from 'lucide-react';

interface TutorialOverlayProps {
  currentStep: number;
  onNext: () => void;
  onComplete: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ currentStep, onNext, onComplete }) => {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    setIsIOS(/iPhone|iPad|iPod/.test(userAgent));
  }, []);

  // Variant animations for the instructions
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.2 } },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="fixed inset-0 z-[999] pointer-events-none font-sans">
      
      {/* STEP 0: SWIPE (User must interact with the real card behind) */}
      <AnimatePresence>
        {currentStep === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center"
          >
             {/* SPOTLIGHT CUTOUT FOR CARD */}
             {/* We use a large box-shadow on a central div to create a 'hole' */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[420px] rounded-[2rem] shadow-[0_0_0_9999px_rgba(2,6,23,0.85)] pointer-events-none" />

             {/* INTERACTION ZONE (Invisible but allows clicks through to app) */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[420px] z-50 pointer-events-none border-2 border-white/20 rounded-[2rem] animate-pulse" />

             {/* INSTRUCTIONS */}
             <motion.div 
               variants={textVariants} initial="hidden" animate="visible" exit="exit"
               className="relative z-[1000] flex flex-col items-center mt-[450px] md:mt-0 md:translate-y-[240px] px-6 text-center"
             >
                <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2 uppercase tracking-widest text-sm">
                    <Hand className="animate-bounce" /> Langkah 1
                </div>
                <h3 className="text-2xl font-display font-bold text-white mb-2">Geser Kartu</h3>
                <p className="text-slate-300 text-sm max-w-xs">
                  Cobalah <span className="text-white font-bold">Swipe</span> kartu di tengah layar ke Kiri atau Kanan untuk melanjutkan.
                </p>
                
                {/* Hand Gesture Animation */}
                <div className="absolute -top-[200px] md:-top-[200px] left-1/2 -translate-x-1/2 pointer-events-none">
                     <motion.div
                        animate={{ x: [0, 80, -80, 0], rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                     >
                         <Hand size={64} className="text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]" />
                     </motion.div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEP 1: PERMISSIONS (Blocking overlay) */}
      <AnimatePresence>
        {currentStep === 1 && (
          <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm pointer-events-auto"
          >
             <div className={`absolute ${isIOS ? 'bottom-0 left-0 w-full p-6 pb-12 bg-gradient-to-t from-black via-black/90 to-transparent' : 'top-0 left-0 p-4'}`}>
                
                {/* Arrow */}
                <motion.div 
                    animate={isIOS ? { y: [0, 10, 0] } : { y: [0, -10, 0], x: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={`absolute ${isIOS ? 'bottom-[140px] left-8' : 'top-4 left-4'} z-10`}
                >
                    <ArrowUp size={48} className={`text-emerald-400 drop-shadow-lg ${isIOS ? 'rotate-[225deg]' : 'rotate-[-45deg]'}`} />
                </motion.div>

                <motion.div variants={textVariants} initial="hidden" animate="visible" className={`relative z-10 bg-slate-900 border border-emerald-500/50 p-6 rounded-2xl shadow-2xl max-w-sm ${!isIOS && 'mt-16 ml-4'}`}>
                    <div className="flex items-center gap-3 mb-3 text-emerald-400 font-bold uppercase tracking-wider text-xs">
                        <Lock size={16} /> Langkah 2
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Aktifkan Izin</h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-6">
                        Jika voting terkunci, ketuk ikon <strong>Gembok</strong> (Chrome) atau <strong>AA</strong> (Safari) pada address bar untuk mengizinkan <span className="text-white">Lokasi & Kamera</span>.
                    </p>
                    <button onClick={onNext} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg transition-all">
                        Saya Mengerti
                    </button>
                </motion.div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEP 2: VOTE BUTTON (Blocking overlay with hole at bottom) */}
      <AnimatePresence>
        {currentStep === 2 && (
          <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] pointer-events-auto flex flex-col items-center justify-end pb-32"
          >
             {/* Spotlight on Vote Button area */}
             <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-16 rounded-2xl shadow-[0_0_0_9999px_rgba(2,6,23,0.85)] pointer-events-none" />
             <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-16 border-2 border-indigo-500 rounded-2xl animate-pulse pointer-events-none" />

             <motion.div variants={textVariants} initial="hidden" animate="visible" className="relative z-10 bg-slate-900 border border-indigo-500/50 p-6 rounded-2xl shadow-2xl max-w-xs text-center mx-4 mb-8">
                 <div className="flex items-center justify-center gap-2 mb-2 text-indigo-400 font-bold uppercase tracking-wider text-xs">
                     <MousePointerClick size={16} /> Langkah 3
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">Vote Karakter</h3>
                 <p className="text-sm text-slate-300 mb-6">
                     Tekan tombol ini untuk memberikan suara pada karakter yang sedang tampil.
                 </p>
                 <button onClick={onNext} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg transition-all">
                     Lanjut
                 </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEP 3: SHARE & LEADERBOARD (Blocking overlay) */}
      <AnimatePresence>
        {currentStep === 3 && (
          <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm pointer-events-auto"
          >
             {/* Share Pointer (Top Right) */}
             <div className="absolute top-16 right-4 flex flex-col items-end">
                <ArrowUp size={40} className="text-indigo-400 rotate-[45deg] mb-2 mr-2 animate-bounce" />
                <div className="bg-slate-900 p-3 rounded-xl border border-white/10 max-w-[200px] text-right">
                    <div className="flex items-center justify-end gap-2 text-indigo-400 font-bold text-xs mb-1">
                        Share <Share2 size={12}/>
                    </div>
                    <p className="text-[10px] text-slate-300">Bagikan karakter favorit ke temanmu.</p>
                </div>
             </div>

             {/* Leaderboard Pointer (Bottom) */}
             <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center px-6">
                <div className="bg-slate-900 p-4 rounded-xl border border-amber-500/30 w-full max-w-md text-center mb-2">
                    <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-sm mb-1">
                        <Trophy size={14}/> Leaderboard
                    </div>
                    <p className="text-xs text-slate-300">Cek peringkat global di bawah kartu.</p>
                </div>
                <ArrowUp size={40} className="text-amber-400 rotate-[180deg] animate-bounce" />
             </div>

             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <motion.button 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    onClick={onComplete} 
                    className="pointer-events-auto px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-slate-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center gap-2"
                 >
                    Mulai Sekarang <ChevronRight size={20} />
                 </motion.button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SKIP BUTTON (Always visible except step 0) */}
      {currentStep > 0 && (
          <button 
              onClick={onComplete}
              className="fixed top-4 right-4 pointer-events-auto bg-black/30 backdrop-blur-md px-4 py-2 rounded-full text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-widest z-[1001] border border-white/10 hover:border-white/30 transition-all"
          >
              Skip Tutorial
          </button>
      )}
    </div>
  );
};

export default TutorialOverlay;