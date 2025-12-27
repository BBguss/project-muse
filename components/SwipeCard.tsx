import React, { forwardRef } from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { Character } from '../types';
import { Crown, Medal } from 'lucide-react';

interface SwipeCardProps {
  character: Character;
  isActive: boolean;
  offset: number;
  onClick: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isVotingEnded?: boolean;
  rank?: number; // 1, 2, 3, etc.
}

const SwipeCard = forwardRef<HTMLDivElement, SwipeCardProps>(({ 
  character, 
  isActive, 
  offset, 
  onClick, 
  onSwipeLeft, 
  onSwipeRight, 
  isVotingEnded,
  rank
}, ref) => {
  
  if (Math.abs(offset) > 2) return null;

  const variants = {
    active: { 
      x: 0, 
      scale: 1, 
      zIndex: 20, 
      opacity: 1,
      rotateY: 0,
      filter: "brightness(1)",
    },
    left: { 
      x: "-85%", 
      scale: 0.85, 
      zIndex: 10, 
      opacity: 0.6,
      rotateY: 15,
      filter: "brightness(0.5) blur(1px)",
    },
    right: { 
      x: "85%", 
      scale: 0.85, 
      zIndex: 10, 
      opacity: 0.6,
      rotateY: -15, 
      filter: "brightness(0.5) blur(1px)",
    },
    farLeft: {
      x: "-150%", 
      scale: 0.7, 
      zIndex: 0, 
      opacity: 0, 
      rotateY: 25, 
      filter: "brightness(0) blur(4px)", 
    },
    farRight: { 
      x: "150%", 
      scale: 0.7, 
      zIndex: 0, 
      opacity: 0, 
      rotateY: -25, 
      filter: "brightness(0) blur(4px)", 
    }
  };

  let currentState = 'active';
  if (offset === -1) currentState = 'left';
  else if (offset === 1) currentState = 'right';
  else if (offset < -1) currentState = 'farLeft';
  else if (offset > 1) currentState = 'farRight';

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (!isActive || isVotingEnded) return; 
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      onSwipeRight();
    } else if (info.offset.x < -swipeThreshold) {
      onSwipeLeft();
    }
  };

  // --- RANK STYLING ---
  const isGold = rank === 1;
  const isSilver = rank === 2;
  const isBronze = rank === 3;
  const isTop3 = isGold || isSilver || isBronze;

  // Defines border and glow based on rank
  const getRankStyles = () => {
      if (isGold) return 'border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.6)] ring-2 ring-amber-200';
      if (isSilver) return 'border-slate-300 shadow-[0_0_30px_rgba(203,213,225,0.4)]';
      if (isBronze) return 'border-orange-700 shadow-[0_0_30px_rgba(194,65,12,0.4)]';
      return isActive ? 'border-white/20' : 'border-slate-800';
  };

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={currentState}
      variants={variants}
      transition={{ type: "spring", stiffness: 120, damping: 25, mass: 1 }}
      className="absolute w-[72%] max-w-[280px] aspect-[9/14] cursor-pointer origin-bottom touch-none"
      onClick={onClick}
      style={{ perspective: 1000 }}
      drag={isActive && !isVotingEnded ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.25}
      onDragEnd={handleDragEnd}
      whileTap={isActive && !isVotingEnded ? { scale: 0.98, cursor: "grabbing" } : {}}
    >
      
      {/* GOD RAYS FOR WINNER (Behind Card) */}
      <AnimatePresence>
          {isGold && isActive && (
              <motion.div 
                 initial={{ opacity: 0, scale: 0.5 }}
                 animate={{ opacity: 1, scale: 1.6, rotate: 360 }}
                 transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.5 } }}
                 className="absolute -inset-24 z-[-10] flex items-center justify-center pointer-events-none"
              >
                   <div className="w-full h-full bg-[conic-gradient(from_0deg_at_50%_50%,rgba(251,191,36,0.25)_0deg,transparent_20deg,rgba(251,191,36,0.25)_40deg,transparent_60deg,rgba(251,191,36,0.25)_80deg,transparent_100deg,rgba(251,191,36,0.25)_120deg,transparent_140deg,rgba(251,191,36,0.25)_160deg,transparent_180deg,rgba(251,191,36,0.25)_200deg,transparent_220deg,rgba(251,191,36,0.25)_240deg,transparent_260deg,rgba(251,191,36,0.25)_280deg,transparent_300deg,rgba(251,191,36,0.25)_320deg,transparent_340deg,rgba(251,191,36,0.25)_360deg)] rounded-full blur-2xl" />
              </motion.div>
          )}
      </AnimatePresence>

      {/* Active Glow Effect (Standard) */}
      <AnimatePresence>
        {isActive && !isTop3 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className={`absolute -inset-6 bg-gradient-to-t ${character.themeColor} blur-2xl rounded-[3rem] -z-10`} 
          />
        )}
      </AnimatePresence>
      
      {/* MAIN CARD CONTAINER */}
      <div className={`w-full h-full rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl bg-slate-900 border-2 transition-all duration-500 relative group ${getRankStyles()}`}>
        
        {/* TOP 3 BADGE OVERLAYS */}
        <AnimatePresence>
            {isTop3 && (
                <div className="absolute top-0 left-0 right-0 z-30 flex justify-center pt-2">
                     {isGold && (
                         <motion.div initial={{ y: -50 }} animate={{ y: -6 }} className="relative">
                             <div className="absolute inset-0 bg-amber-400 blur-lg opacity-60 animate-pulse"></div>
                             <div className="relative bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 px-8 py-2.5 rounded-b-2xl shadow-xl border-b-[3px] border-amber-100 flex flex-col items-center">
                                 <Crown className="text-white fill-white drop-shadow-md animate-[bounce_2s_infinite]" size={28} />
                                 <span className="text-[11px] font-black text-amber-950 uppercase tracking-[0.2em] mt-1 drop-shadow-sm">CHAMPION</span>
                             </div>
                         </motion.div>
                     )}
                     {isSilver && (
                         <motion.div initial={{ y: -50 }} animate={{ y: -6 }} className="relative">
                             <div className="relative bg-gradient-to-b from-slate-200 to-slate-400 px-5 py-1.5 rounded-b-xl shadow-lg border-b-2 border-white flex flex-col items-center">
                                 <Medal className="text-slate-600 fill-slate-100" size={20} />
                                 <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest mt-0.5">2ND PLACE</span>
                             </div>
                         </motion.div>
                     )}
                     {isBronze && (
                         <motion.div initial={{ y: -50 }} animate={{ y: -6 }} className="relative">
                             <div className="relative bg-gradient-to-b from-orange-300 to-orange-600 px-5 py-1.5 rounded-b-xl shadow-lg border-b-2 border-orange-200 flex flex-col items-center">
                                 <Medal className="text-orange-900 fill-orange-200" size={20} />
                                 <span className="text-[9px] font-black text-orange-900 uppercase tracking-widest mt-0.5">3RD PLACE</span>
                             </div>
                         </motion.div>
                     )}
                </div>
            )}
        </AnimatePresence>

        {/* CROWN BADGE (Original - only show if not top 3 or inactive) */}
        {!isTop3 && (
            <motion.div 
            animate={{ opacity: isActive ? 1 : 0 }} 
            className="absolute top-0 left-0 right-0 pt-5 pb-2 flex justify-center z-10"
            >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Crown size={10} className="text-amber-400" />
                <span className="text-[8px] tracking-[0.2em] font-bold text-amber-100 uppercase font-display">
                Ouxyrin Family
                </span>
                <Crown size={10} className="text-amber-400" />
            </div>
            </motion.div>
        )}

        {/* Image & Overlays */}
        <div className="absolute inset-0">
           <img 
             src={character.imageUrl} 
             alt={character.name} 
             className="w-full h-full object-cover" 
             draggable={false}
           />
           {/* Dark Gradient Overlay */}
           <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent ${isGold && isVotingEnded ? 'to-amber-950/90' : 'to-slate-950/95'}`} />
           
           {/* Winner Gold Tint */}
           {isGold && <div className="absolute inset-0 bg-amber-500/10 mix-blend-overlay" />}
           
           <div className={`absolute inset-0 bg-gradient-to-t ${character.themeColor} opacity-20 mix-blend-overlay`} />
        </div>

        {/* Text Content */}
        <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end text-center select-none">
           <motion.div animate={{ opacity: isActive ? 1 : 0 }} transition={{ duration: 0.3 }}>
             
             {/* --- SPECIAL DISPLAY FOR CHAMPION --- */}
             {isGold && isVotingEnded ? (
                <div className="flex flex-col items-center pb-2">
                    {/* Role / Marga */}
                    <motion.div 
                      animate={{ scale: [1, 1.05, 1] }} 
                      transition={{ repeat: Infinity, duration: 2.5 }}
                      className="mb-1"
                    >
                      <span className="text-amber-200 font-display font-bold uppercase tracking-[0.3em] text-[10px] border-b border-amber-500/50 pb-1 drop-shadow-sm">
                         {character.role}
                      </span>
                    </motion.div>

                    {/* Name - HUGE and GOLDEN */}
                    <h2 className="text-3xl sm:text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] mb-6 leading-[0.9]">
                      {character.name}
                    </h2>

                    {/* Votes - Highlighted Box */}
                    <div className="bg-black/60 backdrop-blur-xl border border-amber-400/50 rounded-2xl px-8 py-3 flex flex-col items-center shadow-[0_0_20px_rgba(251,191,36,0.2)] relative overflow-hidden">
                       <div className="absolute inset-0 bg-amber-500/10 animate-pulse"></div>
                       <span className="relative text-3xl font-mono font-bold text-white tracking-tighter drop-shadow-md">
                         {character.votes.toLocaleString()}
                       </span>
                       <span className="relative text-[9px] text-amber-300 font-bold uppercase tracking-widest mt-1">
                         Total Votes
                       </span>
                    </div>
                </div>
             ) : (
             /* --- STANDARD DISPLAY --- */
               <>
                 <div className="flex justify-center mb-1.5">
                     <span className={`inline-block px-2 py-0.5 text-[8px] sm:text-[9px] font-bold tracking-widest uppercase rounded border backdrop-blur-sm ${
                         isSilver ? 'bg-slate-500/20 border-slate-400 text-slate-200' :
                         isBronze ? 'bg-orange-500/20 border-orange-500 text-orange-300' :
                         'text-white/70 bg-white/10 border-white/10'
                     }`}>
                       {character.role}
                     </span>
                 </div>

                 <h2 className="text-xl sm:text-2xl font-display font-bold text-white leading-tight drop-shadow-md mb-1.5 sm:mb-2">
                   {character.name}
                 </h2>
                 
                 {/* Votes for non-winners */}
                 {isTop3 && isVotingEnded && (
                     <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="mb-2 text-slate-300 font-mono font-bold text-sm bg-black/40 inline-block px-3 py-1 rounded-full mx-auto border border-white/10"
                     >
                         {character.votes} Votes
                     </motion.div>
                 )}

                 {isActive && !isTop3 && (
                   <p className="text-[10px] sm:text-[11px] text-slate-300 line-clamp-2 leading-relaxed opacity-90 font-light">
                     {character.description}
                   </p>
                 )}
               </>
             )}
           </motion.div>
        </div>

        {/* Dimmer for inactive cards (Less dim for winners) */}
        {!isActive && (
          <div className={`absolute inset-0 backdrop-blur-[1px] transition-all duration-500 ${isTop3 ? 'bg-slate-950/40' : 'bg-slate-950/70'}`} />
        )}

      </div>
    </motion.div>
  );
});

export default SwipeCard;