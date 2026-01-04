import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, ArrowUp, Lock, ChevronRight, Trophy, MousePointerClick, CheckCircle2 } from 'lucide-react';

// Fix TS errors with framer-motion props
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface TutorialOverlayProps {
  currentStep: number;
  onNext: () => void;
  onComplete: () => void;
  hasTimer: boolean;
  characterName?: string;
}

// Replicates the header structure from App.tsx exactly
const GhostHeader: React.FC<{ hasTimer: boolean }> = ({ hasTimer }) => (
    <header className="w-full flex flex-col gap-4 relative shrink-0 opacity-0 pointer-events-none">
        {/* Main Header Bar - Matches App.tsx p-3 rounded-2xl border */}
        <div className="w-full flex justify-between items-center p-3 rounded-2xl border border-white/5 min-h-[66px]">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl" />
                 <div><div className="h-5 w-20"/></div>
             </div>
             <div className="flex items-center gap-2">
                 <div className="p-2 w-9 h-9" />
                 <div className="w-24 h-8" />
             </div>
        </div>
        
        {/* Timer Placeholder - Matches App.tsx p-3 rounded-xl */}
        {hasTimer && <div className="w-full rounded-xl p-3 min-h-[50px]" />}
    </header>
);

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ currentStep, onNext, onComplete, hasTimer, characterName }) => {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Robust check for iOS
    const userAgent = window.navigator.userAgent || window.navigator.vendor || (window as any).opera;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream);
  }, []);

  const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.1 } },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className="fixed inset-0 z-[999] font-sans flex justify-center items-start pointer-events-none">
      
      {/* 
          GLOBAL DIMMER:
          - Step 0 (Swipe): NO global dimmer.
          - Step 1 (Permission): Full dimmer (handled in step).
          - Step 2 (Vote): Full dimmer (handled in step).
          - Step 3 (Share): Full dimmer.
      */}

      {/* 
         MAIN GHOST LAYOUT CONTAINER 
         Matches App.tsx structure generally, but individual steps manage their own positioning
      */}
      <div className="relative w-full max-w-md h-full">

        {/* --- STEP 0: SWIPE CARD --- */}
        <AnimatePresence>
            {currentStep === 0 && (
                <MotionDiv 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center py-6 px-4 gap-6 pointer-events-none"
                >
                    <GhostHeader hasTimer={hasTimer} />

                    {/* Target: Card Area */}
                    <div className="w-full relative h-[480px] sm:h-[500px] flex items-center justify-center mt-2 pointer-events-none">
                         <div className="relative w-[72%] max-w-[280px] aspect-[9/14]">
                            {/* THE DIMMER SHADOW */}
                            <div className="absolute inset-0 rounded-[2rem] shadow-[0_0_0_100vmax_rgba(2,6,23,0.85)] pointer-events-none" />
                            <div className="absolute inset-0 border-2 border-indigo-400/50 rounded-[2rem] animate-pulse z-50 shadow-[0_0_30px_rgba(99,102,241,0.3)]" />
                            
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60]">
                                <MotionDiv
                                    animate={{ x: [0, 60, -60, 0], rotate: [0, 15, -15, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <Hand size={56} className="text-white drop-shadow-md fill-white/20" />
                                </MotionDiv>
                            </div>
                         </div>
                    </div>

                    <MotionDiv 
                        variants={textVariants} initial="hidden" animate="visible"
                        className="pointer-events-auto mt-[-40px] z-[1000] text-center"
                    >
                        <h3 className="text-xl font-bold text-white mb-1">Geser Kartu</h3>
                        <p className="text-slate-300 text-sm">Temukan karakter favoritmu</p>
                    </MotionDiv>
                </MotionDiv>
            )}
        </AnimatePresence>

        {/* --- STEP 1: PERMISSIONS (Top Aligned Modal) --- */}
        <AnimatePresence>
            {currentStep === 1 && (
                <MotionDiv 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1001] pointer-events-auto overflow-y-auto overflow-x-hidden bg-slate-950/85 backdrop-blur-[2px]"
                >
                    {/* Fixed Arrow - Adjusted positions */}
                    <MotionDiv 
                        animate={isIOS ? { y: [0, 10, 0] } : { y: [0, -15, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className={`fixed z-[1003] ${
                            isIOS 
                            ? 'bottom-[80px] left-6 rotate-[225deg]' // iOS bottom bar
                            : 'top-[10px] left-4 rotate-[-45deg]' // Android top bar
                        }`}
                    >
                        <ArrowUp size={60} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]" />
                    </MotionDiv>

                    {/* Content Container - Changed to 'justify-start pt-32' to lift it up */}
                    <div className="min-h-full w-full flex flex-col items-center justify-start pt-32 p-6 relative z-[1002]">
                        <div className="bg-slate-900 border border-emerald-500/50 p-6 rounded-3xl shadow-2xl w-full max-w-sm text-center relative">
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 p-3 rounded-full border border-emerald-500/50 shadow-lg">
                                <Lock size={24} className="text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mt-4 mb-2">Buka Akses</h3>
                            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                                Ketuk ikon <strong>{isIOS ? 'AA' : 'Gembok'}</strong> di address bar. <br/>
                                Pilih <strong>Permissions</strong> <ChevronRight size={10} className="inline"/> <strong>Location</strong>: <strong>Allow</strong>.
                            </p>
                            <button onClick={onNext} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                                <CheckCircle2 size={18}/> Saya Mengerti
                            </button>
                        </div>
                    </div>
                </MotionDiv>
            )}
        </AnimatePresence>

        {/* --- STEP 2: VOTE BUTTON (Fake Button Overlay) --- */}
        <AnimatePresence>
            {currentStep === 2 && (
                <MotionDiv 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    // Added overflow-y-auto and bg-dimmer here directly for full scroll context
                    className="fixed inset-0 z-[1001] pointer-events-auto overflow-y-auto overflow-x-hidden bg-slate-950/85 backdrop-blur-[2px]"
                >
                    {/* Inner wrapper matches App.tsx structure but with EXTRA PADDING BOTTOM (pb-32) to lift button */}
                    <div className="w-full max-w-md mx-auto flex flex-col items-center py-6 px-4 gap-6 min-h-full pb-32">
                        
                        <GhostHeader hasTimer={hasTimer} />
                        
                        {/* Same spacer as App.tsx */}
                        <section className="w-full relative h-[480px] sm:h-[500px] mt-2 shrink-0 pointer-events-none" />
                        
                        {/* Spacer for Indicators */}
                        <div className="h-[30px] shrink-0 w-full" />

                        {/* FAKE BUTTON CONTAINER */}
                        <div className="w-full px-2 relative z-[1005]">
                             <MotionButton 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                onClick={onNext}
                                className="relative w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 overflow-hidden border bg-slate-900 border-indigo-500/50 text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] animate-pulse"
                             >
                                <span>VOTE FOR {characterName ? characterName.split(' ')[0].toUpperCase() : 'CHARACTER'}</span>
                             </MotionButton>

                             {/* Pointer Animation */}
                             <div className="absolute right-4 bottom-[-20px] z-[1010] pointer-events-none">
                                 <MotionDiv animate={{ x: [0, -10, 0], y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                                     <MousePointerClick size={48} className="text-white fill-amber-500 rotate-[-12deg] drop-shadow-lg" />
                                 </MotionDiv>
                             </div>

                             {/* Tooltip */}
                             <MotionDiv 
                                variants={textVariants} initial="hidden" animate="visible"
                                className="absolute -top-[125px] left-1/2 -translate-x-1/2 w-64 bg-slate-800/95 border border-amber-500/30 p-4 rounded-xl text-center backdrop-blur-md shadow-xl z-[1010]"
                             >
                                <h3 className="text-lg font-bold text-white mb-1">Berikan Suara</h3>
                                <p className="text-xs text-slate-300">Klik tombol ini untuk mendukung karakter.</p>
                             </MotionDiv>
                        </div>

                    </div>
                </MotionDiv>
            )}
        </AnimatePresence>

        {/* --- STEP 3: SHARE & LEADERBOARD (Full Overlay) --- */}
        <AnimatePresence>
            {currentStep === 3 && (
                <MotionDiv 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1001] pointer-events-auto overflow-y-auto overflow-x-hidden bg-slate-950/85 backdrop-blur-[2px]"
                >
                    <div className="min-h-full w-full flex flex-col items-center py-6 px-4 relative">
                        
                        {/* Ghost Header for Share Target Position */}
                        <div className="w-full max-w-md flex flex-col gap-4 relative shrink-0 opacity-100 pointer-events-none">
                            <div className="w-full flex justify-between items-center p-3 rounded-2xl border border-white/5 min-h-[66px]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10" />
                                    <div><div className="h-5 w-20"/></div>
                                </div>
                                {/* TARGET: Share Button */}
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        {/* Visual Highlight */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-indigo-400 animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.5)] z-[1005]" />
                                        
                                        <div className="absolute top-10 right-[-10px] w-40 flex flex-col items-end z-[1005]">
                                            <ArrowUp size={32} className="text-indigo-400 rotate-[-12deg] mr-4" />
                                            <div className="bg-slate-900 border border-indigo-500/30 p-3 rounded-xl text-right">
                                                <p className="text-xs font-bold text-white mb-1">Bagikan Profile</p>
                                                <p className="text-[10px] text-slate-400">Ajak temanmu voting!</p>
                                            </div>
                                        </div>
                                        <div className="p-2 w-9 h-9" />
                                    </div>
                                    <div className="w-24 h-8" />
                                </div>
                            </div>
                        </div>

                        {/* Centered "Ready" Modal */}
                        <div className="flex-1 flex items-center justify-center py-10">
                             <MotionDiv initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl text-center max-w-xs w-full relative z-[1005]">
                                <Trophy size={48} className="text-yellow-400 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-white mb-2">Siap?</h2>
                                <p className="text-slate-400 text-sm mb-6">Mulai dukung karakter favoritmu sekarang.</p>
                                <button onClick={onComplete} className="w-full py-3 bg-white text-slate-950 rounded-xl font-black text-lg hover:bg-slate-200 transition-all active:scale-95">
                                    Mulai Voting
                                </button>
                             </MotionDiv>
                        </div>

                        {/* Leaderboard Hint */}
                        <div className="w-full flex justify-center pb-6">
                             <div className="flex flex-col items-center animate-bounce">
                                 <p className="text-xs font-bold text-amber-300 bg-slate-900 px-3 py-1 rounded-full border border-amber-500/30 mb-2">
                                     Scroll untuk Peringkat
                                 </p>
                                 <ArrowUp size={32} className="text-amber-400 rotate-180" />
                             </div>
                        </div>
                    </div>
                </MotionDiv>
            )}
        </AnimatePresence>

        {/* Skip Button */}
        {currentStep > 0 && (
            <button 
                onClick={onComplete}
                className="fixed top-4 right-4 z-[2000] pointer-events-auto bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-white/60 hover:text-white text-[10px] font-bold uppercase tracking-widest border border-white/10"
            >
                SKIP
            </button>
        )}

      </div>
    </div>
  );
};

export default TutorialOverlay;