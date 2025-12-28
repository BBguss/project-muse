import React, { forwardRef, useState, useMemo } from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { Character } from '../types';
import { Crown, Medal, Sword, Shield, Star, Ghost, Flame, Zap, Image as ImageIcon, AlertCircle } from 'lucide-react';

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

// Icon Mapping
const IconMap: Record<string, any> = {
  crown: Crown,
  sword: Sword,
  shield: Shield,
  star: Star,
  ghost: Ghost,
  flame: Flame,
  zap: Zap
};

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
  
  // Image Loading State
  const [imgState, setImgState] = useState<{ loading: boolean; error: boolean }>({ 
    loading: true, 
    error: false 
  });

  // Optimization: If card is too far in stack, don't render it at all
  if (Math.abs(offset) > 2) return null;

  // --- PERFORMANCE OPTIMIZED VARIANTS ---
  const variants = {
    active: { 
      x: 0, 
      scale: 1, 
      zIndex: 20, 
      opacity: 1,
      rotate: 0, 
    },
    left: { 
      x: "-95%", 
      scale: 0.9, 
      zIndex: 10, 
      opacity: 0, 
      rotate: -10,
    },
    right: { 
      x: "95%", 
      scale: 0.9, 
      zIndex: 10, 
      opacity: 0,
      rotate: 10, 
    },
    farLeft: {
      x: "-100%", 
      scale: 0.8, 
      zIndex: 0, 
      opacity: 0,
    },
    farRight: { 
      x: "100%", 
      scale: 0.8, 
      zIndex: 0, 
      opacity: 0,
    },
    stackLeft: {
        x: -40,
        scale: 0.9,
        zIndex: 5,
        opacity: 0.6,
        rotate: -4
    },
    stackRight: {
        x: 40,
        scale: 0.9,
        zIndex: 5,
        opacity: 0.6,
        rotate: 4
    }
  };

  let currentState = 'active';
  if (offset === 0) currentState = 'active';
  else if (offset === -1) currentState = 'stackLeft'; // Previous card waiting
  else if (offset === 1) currentState = 'stackRight'; // Next card waiting
  else if (offset < -1) currentState = 'farLeft';
  else if (offset > 1) currentState = 'farRight';

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (!isActive || isVotingEnded) return; 
    
    // Low threshold for quick flicks
    const swipeThreshold = 50; 
    const { offset: { x }, velocity: { x: velocityX } } = info;
    
    // Combine distance and velocity for a natural feel
    if (x > swipeThreshold || velocityX > 500) {
      onSwipeRight();
    } else if (x < -swipeThreshold || velocityX < -500) {
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
      if (isGold) return 'border-amber-300 shadow-[0_0_50px_rgba(251,191,36,0.5)] ring-2 ring-amber-400/50'; // More intense gold
      if (isSilver) return 'border-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.3)]';
      if (isBronze) return 'border-orange-700 shadow-[0_0_15px_rgba(194,65,12,0.3)]';
      return isActive ? 'border-white/20' : 'border-slate-800';
  };

  // Resolve Family Icon
  const FamilyIconComponent = IconMap[character.familyIcon || 'crown'] || Crown;

  // Fallback Image URL
  const fallbackUrl = `https://placehold.co/600x800/1e293b/cbd5e1?text=${encodeURIComponent(character.name.charAt(0).toUpperCase())}`;

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={currentState}
      variants={variants}
      // "stiff" spring is better for UI elements, "damping" reduces oscillation
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="absolute w-[72%] max-w-[280px] aspect-[9/14] cursor-pointer origin-bottom touch-none select-none"
      onClick={onClick}
      style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
      
      drag={isActive && !isVotingEnded ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.05} 
      dragMomentum={false} 
      onDragEnd={handleDragEnd}
      whileTap={isActive && !isVotingEnded ? { scale: 0.98, cursor: "grabbing" } : {}}
    >
      
      {/* --- 1. SPOTLIGHT GOD RAYS FOR WINNER --- */}
      <AnimatePresence>
          {isGold && isActive && (
              <div className="absolute -inset-[150%] z-[-20] flex items-center justify-center pointer-events-none opacity-60 mix-blend-screen">
                   <div className="w-full h-full bg-[conic-gradient(from_0deg_at_50%_50%,rgba(251,191,36,0.4)_0deg,transparent_20deg,rgba(251,191,36,0.1)_40deg,transparent_60deg,rgba(251,191,36,0.4)_80deg,transparent_100deg,rgba(251,191,36,0.1)_120deg,transparent_140deg,rgba(251,191,36,0.4)_160deg,transparent_180deg,rgba(251,191,36,0.1)_200deg,transparent_220deg,rgba(251,191,36,0.4)_240deg,transparent_260deg,rgba(251,191,36,0.1)_280deg,transparent_300deg,rgba(251,191,36,0.4)_320deg,transparent_340deg,rgba(251,191,36,0.4)_360deg)] rounded-full blur-2xl animate-[spin_20s_linear_infinite]" />
              </div>
          )}
      </AnimatePresence>

      {/* Static Glow Effect */}
      {isActive && !isTop3 && (
         <div className={`absolute -inset-1 bg-gradient-to-t ${character.themeColor} opacity-30 rounded-[3rem] -z-10`} />
      )}

      {/* --- 2. 3D POP-OUT BADGES (MOVED OUTSIDE OVERFLOW-HIDDEN) --- */}
      {/* This is positioned RELATIVE to the wrapper, so it sits ON TOP of the card border and extends out */}
      {isTop3 && (
        <div className="absolute top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none">
                {isGold ? (
                    <div className="relative -mt-12 flex flex-col items-center">
                        {/* Glow Behind Crown */}
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-28 bg-amber-400/50 blur-[40px] rounded-full z-0 animate-pulse" />
                        
                        {/* The 3D Crown Pop-out */}
                        <motion.div 
                            animate={{ y: [-8, 0, -8], scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="relative z-50 drop-shadow-[0_10px_10px_rgba(0,0,0,0.6)]"
                        >
                            {/* Dark Outline Layer */}
                            <Crown 
                                size={90} 
                                className="text-amber-900 absolute top-[3px] left-0 z-0 opacity-80" 
                                strokeWidth={4}
                            />
                             {/* Main Gold Layer */}
                            <Crown 
                                size={90} 
                                className="text-yellow-300 fill-amber-400 z-10 relative drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]" 
                                strokeWidth={2}
                            />
                            {/* Shine effect */}
                            <div className="absolute top-4 right-4 w-6 h-6 bg-white rounded-full blur-[4px] opacity-70 z-20 animate-pulse"></div>
                            <div className="absolute top-4 left-4 w-3 h-3 bg-white rounded-full blur-[2px] opacity-50 z-20"></div>
                        </motion.div>
                        
                        {/* The Ribbon/Placard Overlapping Card Top */}
                        <div className="bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-700 px-10 py-2 pb-3 rounded-b-3xl shadow-[0_10px_20px_rgba(0,0,0,0.6)] border-x-[3px] border-b-[3px] border-yellow-200 -mt-6 pt-8 z-40 relative">
                            <span className="text-[14px] font-black text-amber-950 uppercase tracking-[0.25em] drop-shadow-sm">
                                CHAMPION
                            </span>
                            {/* Shiny Glint on Ribbon */}
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-white opacity-60"></div>
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-amber-900/20 rounded-full blur-[1px]"></div>
                        </div>
                    </div>
                ) : isSilver ? (
                    <div className="relative -mt-6 z-40 bg-gradient-to-b from-slate-100 to-slate-400 px-6 py-2 pt-4 rounded-b-2xl shadow-[0_5px_15px_rgba(0,0,0,0.4)] border-b-2 border-white flex flex-col items-center">
                        <Medal className="text-slate-600 fill-slate-200 drop-shadow-sm mb-1" size={32} />
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">2ND PLACE</span>
                    </div>
                ) : (
                    <div className="relative -mt-6 z-40 bg-gradient-to-b from-orange-200 to-orange-500 px-6 py-2 pt-4 rounded-b-2xl shadow-[0_5px_15px_rgba(0,0,0,0.4)] border-b-2 border-orange-200 flex flex-col items-center">
                        <Medal className="text-orange-900 fill-orange-200 drop-shadow-sm mb-1" size={32} />
                        <span className="text-[10px] font-black text-orange-900 uppercase tracking-widest">3RD PLACE</span>
                    </div>
                )}
        </div>
      )}
      
      {/* MAIN CARD CONTAINER */}
      <div className={`w-full h-full rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-slate-900 border-2 relative group ${getRankStyles()}`}>
        
        {/* FAMILY BADGE (Hidden for Top 3 to avoid clutter) */}
        {!isTop3 && (
            <div 
            className={`absolute top-0 left-0 right-0 pt-5 pb-2 flex justify-center z-10 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}
            >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-amber-500/30">
                <FamilyIconComponent size={10} className="text-amber-400" />
                <span className="text-[8px] tracking-[0.2em] font-bold text-amber-100 uppercase font-display">
                {character.familyName || 'Unknown Family'}
                </span>
                <FamilyIconComponent size={10} className="text-amber-400" />
            </div>
            </div>
        )}

        {/* --- IMAGE SECTION --- */}
        <div className="absolute inset-0 bg-slate-800">
           <img 
             src={imgState.error ? fallbackUrl : character.imageUrl} 
             alt={character.name} 
             className={`w-full h-full object-cover transition-opacity duration-500 ${imgState.loading ? 'opacity-0' : 'opacity-100'}`}
             draggable={false}
             loading={isActive ? "eager" : "lazy"}
             onLoad={() => setImgState(prev => ({ ...prev, loading: false }))}
             onError={() => setImgState({ loading: false, error: true })}
           />
           
           {/* Winner gets a golden tint at bottom */}
           <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent ${isGold && isVotingEnded ? 'to-amber-950/95' : 'to-slate-950/95'} z-10`} />
           
           {!isActive && <div className="absolute inset-0 bg-slate-950/60 z-20" />}
        </div>

        {/* Text Content */}
        <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end text-center z-20 pointer-events-none">
           <motion.div animate={{ opacity: isActive ? 1 : 0.5 }} transition={{ duration: 0.2 }}>
             
             {isGold && isVotingEnded ? (
                <div className="flex flex-col items-center pb-2">
                    <span className="mb-1 text-amber-200 font-display font-bold uppercase tracking-[0.3em] text-[10px] border-b border-amber-500/50 pb-1 shadow-black drop-shadow-md">
                        {character.role}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-yellow-200 to-amber-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mb-6 leading-[0.9]">
                      {character.name}
                    </h2>
                    <div className="bg-black/60 backdrop-blur-md border border-amber-400/50 rounded-2xl px-8 py-3 flex flex-col items-center relative overflow-hidden shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                       <span className="relative text-3xl font-mono font-bold text-white tracking-tighter drop-shadow-md">
                         {character.votes.toLocaleString()}
                       </span>
                       <span className="relative text-[9px] text-amber-300 font-bold uppercase tracking-widest mt-1">
                         Total Votes
                       </span>
                    </div>
                </div>
             ) : (
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
                 
                 {isTop3 && isVotingEnded && (
                     <div className="mb-2 text-slate-300 font-mono font-bold text-sm bg-black/40 inline-block px-3 py-1 rounded-full mx-auto border border-white/10">
                         {character.votes} Votes
                     </div>
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

      </div>
    </motion.div>
  );
});

export default SwipeCard;