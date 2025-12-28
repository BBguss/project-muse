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
  // Removed 'filter: blur/brightness' which destroys FPS on low-end devices.
  // Using simple opacity and scale instead.
  const variants = {
    active: { 
      x: 0, 
      scale: 1, 
      zIndex: 20, 
      opacity: 1,
      rotate: 0, // Changed from rotateY to 2D rotate for better performance
    },
    left: { 
      x: "-95%", // Push further off screen
      scale: 0.9, 
      zIndex: 10, 
      opacity: 0, // Hide immediately when swiped to reduce draw calls
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
    // Background stack state (the cards behind the active one)
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
      if (isGold) return 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]'; // Reduced shadow radius
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
      // Force GPU layer promotion
      style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
      
      drag={isActive && !isVotingEnded ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      // Lower elastic makes it feel more "attached" to finger, lighter math
      dragElastic={0.05} 
      dragMomentum={false} // Disable momentum physics for instant stop
      onDragEnd={handleDragEnd}
      whileTap={isActive && !isVotingEnded ? { scale: 0.98, cursor: "grabbing" } : {}}
    >
      
      {/* GOD RAYS FOR WINNER (Simplified) */}
      <AnimatePresence>
          {isGold && isActive && (
              <div className="absolute -inset-20 z-[-10] flex items-center justify-center pointer-events-none opacity-40">
                   {/* CSS Animation is lighter than JS Framer Motion for infinite loops */}
                   <div className="w-full h-full bg-[conic-gradient(from_0deg_at_50%_50%,rgba(251,191,36,0.2)_0deg,transparent_20deg,rgba(251,191,36,0.2)_40deg,transparent_60deg,rgba(251,191,36,0.2)_80deg,transparent_100deg,rgba(251,191,36,0.2)_120deg,transparent_140deg,rgba(251,191,36,0.2)_160deg,transparent_180deg,rgba(251,191,36,0.2)_200deg,transparent_220deg,rgba(251,191,36,0.2)_240deg,transparent_260deg,rgba(251,191,36,0.2)_280deg,transparent_300deg,rgba(251,191,36,0.2)_320deg,transparent_340deg,rgba(251,191,36,0.2)_360deg)] rounded-full blur-xl animate-[spin_10s_linear_infinite]" />
              </div>
          )}
      </AnimatePresence>

      {/* Static Glow Effect instead of Animated Gaussian Blur */}
      {isActive && !isTop3 && (
         <div className={`absolute -inset-1 bg-gradient-to-t ${character.themeColor} opacity-30 rounded-[3rem] -z-10`} />
      )}
      
      {/* MAIN CARD CONTAINER */}
      <div className={`w-full h-full rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-slate-900 border-2 relative group ${getRankStyles()}`}>
        
        {/* TOP 3 BADGE OVERLAYS */}
        {isTop3 && (
            <div className="absolute top-0 left-0 right-0 z-30 flex justify-center pt-2 pointer-events-none">
                    {isGold && (
                        <div className="bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 px-8 py-2.5 rounded-b-2xl shadow-lg border-b-[3px] border-amber-100 flex flex-col items-center">
                            <Crown className="text-white fill-white drop-shadow-md" size={28} />
                            <span className="text-[11px] font-black text-amber-950 uppercase tracking-[0.2em] mt-1">CHAMPION</span>
                        </div>
                    )}
                    {isSilver && (
                        <div className="bg-gradient-to-b from-slate-200 to-slate-400 px-5 py-1.5 rounded-b-xl shadow-md border-b-2 border-white flex flex-col items-center">
                            <Medal className="text-slate-600 fill-slate-100" size={20} />
                            <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest mt-0.5">2ND PLACE</span>
                        </div>
                    )}
                    {isBronze && (
                        <div className="bg-gradient-to-b from-orange-300 to-orange-600 px-5 py-1.5 rounded-b-xl shadow-md border-b-2 border-orange-200 flex flex-col items-center">
                            <Medal className="text-orange-900 fill-orange-200" size={20} />
                            <span className="text-[9px] font-black text-orange-900 uppercase tracking-widest mt-0.5">3RD PLACE</span>
                        </div>
                    )}
            </div>
        )}

        {/* FAMILY BADGE */}
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
           
           {/* Optimized Overlays: Use simple colors/gradients, avoid mix-blend-mode if possible on low end, but multiply is usually ok */}
           <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent ${isGold && isVotingEnded ? 'to-amber-950/90' : 'to-slate-950/95'} z-10`} />
           
           {/* Pre-composed overlay for inactive state instead of blur filter */}
           {!isActive && <div className="absolute inset-0 bg-slate-950/60 z-20" />}
        </div>

        {/* Text Content */}
        <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end text-center z-20 pointer-events-none">
           <motion.div animate={{ opacity: isActive ? 1 : 0.5 }} transition={{ duration: 0.2 }}>
             
             {isGold && isVotingEnded ? (
                <div className="flex flex-col items-center pb-2">
                    <span className="mb-1 text-amber-200 font-display font-bold uppercase tracking-[0.3em] text-[10px] border-b border-amber-500/50 pb-1">
                        {character.role}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 drop-shadow-sm mb-6 leading-[0.9]">
                      {character.name}
                    </h2>
                    <div className="bg-black/60 backdrop-blur-sm border border-amber-400/50 rounded-2xl px-8 py-3 flex flex-col items-center relative overflow-hidden">
                       <span className="relative text-3xl font-mono font-bold text-white tracking-tighter">
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