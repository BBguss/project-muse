import React, { forwardRef, useState, useRef } from 'react';
import { motion, PanInfo, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Character } from '../types';
import { Crown, Medal, Sword, Shield, Star, Ghost, Flame, Zap } from 'lucide-react';

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

  // --- 3D TILT INTERACTION STATE (For Winner Only) ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Reduced rotation range for more stability, focused on depth
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  // Parallax Values for Image (Moves opposite to tilt)
  const imageX = useTransform(x, [-100, 100], [-15, 15]);
  const imageY = useTransform(y, [-100, 100], [-15, 15]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!isGold || !isActive) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      x.set(event.clientX - centerX);
      y.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
  };

  // Optimization: If card is too far in stack, don't render it at all
  if (Math.abs(offset) > 2) return null;

  // --- VARIANTS ---
  const variants = {
    active: { 
      x: 0, 
      scale: 1, 
      zIndex: 20, 
      opacity: 1, 
      rotate: 0 
    },
    left: { x: "-95%", scale: 0.9, zIndex: 10, opacity: 0, rotate: -10 },
    right: { x: "95%", scale: 0.9, zIndex: 10, opacity: 0, rotate: 10 },
    farLeft: { x: "-100%", scale: 0.8, zIndex: 0, opacity: 0 },
    farRight: { x: "100%", scale: 0.8, zIndex: 0, opacity: 0 },
    stackLeft: { x: -40, scale: 0.9, zIndex: 5, opacity: 0.6, rotate: -4 },
    stackRight: { x: 40, scale: 0.9, zIndex: 5, opacity: 0.6, rotate: 4 }
  };

  let currentState = 'active';
  if (offset === 0) currentState = 'active';
  else if (offset === -1) currentState = 'stackLeft';
  else if (offset === 1) currentState = 'stackRight';
  else if (offset < -1) currentState = 'farLeft';
  else if (offset > 1) currentState = 'farRight';

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (!isActive || isVotingEnded) return; 
    const swipeThreshold = 50; 
    const { offset: { x }, velocity: { x: velocityX } } = info;
    if (x > swipeThreshold || velocityX > 500) onSwipeRight();
    else if (x < -swipeThreshold || velocityX < -500) onSwipeLeft();
  };

  // --- RANK LOGIC ---
  const isGold = rank === 1;
  const isSilver = rank === 2;
  const isBronze = rank === 3;
  const isTop3 = isGold || isSilver || isBronze;
  const FamilyIconComponent = IconMap[character.familyIcon || 'crown'] || Crown;

  // Fallback Image
  const safeName = character.name || '?';
  const firstChar = String(Array.from(safeName)[0] || '?'); 
  const fallbackUrl = `https://placehold.co/600x800/1e293b/cbd5e1?text=${encodeURIComponent(firstChar.toUpperCase())}`;

  // --- RENDER EFFECT LAYERS ---
  const renderActiveEffectLayer = () => {
      if (!isActive || isTop3) return null; // Don't show on top of rank badges

      switch (character.activeEffect) {
          case 'fire':
              return (
                  <>
                      <div className="absolute -inset-[3px] rounded-[2rem] bg-gradient-to-t from-orange-600 to-red-600 blur-sm z-[-1]" />
                      <div className="absolute -inset-[6px] rounded-[2.2rem] z-[-2] overflow-hidden opacity-80">
                          <div className="absolute inset-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_60deg,#f59e0b_120deg,#ef4444_180deg,transparent_240deg,transparent_360deg)] animate-[spin_3s_linear_infinite]" />
                      </div>
                  </>
              );
          case 'lightning':
              return (
                  <>
                      <div className="absolute -inset-[2px] rounded-[2rem] border-2 border-cyan-300 z-[-1] shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                      <div className="absolute -inset-[10px] rounded-[2.2rem] z-[-2] opacity-60 mix-blend-screen">
                          <div className="absolute inset-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_180deg,transparent_0deg,#06b6d4_70deg,white_80deg,#06b6d4_90deg,transparent_180deg)] animate-[spin_0.5s_linear_infinite]" />
                      </div>
                  </>
              );
          case 'shadow':
              return (
                  <>
                      <div className="absolute -inset-[2px] rounded-[2rem] bg-black z-[-1] shadow-[0_0_20px_rgba(0,0,0,1)]" />
                      <div className="absolute -inset-[8px] rounded-[2.2rem] z-[-2] overflow-hidden opacity-60">
                          <div className="absolute inset-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,#581c87_120deg,black_180deg,transparent_240deg)] animate-[spin_6s_linear_infinite_reverse]" />
                      </div>
                  </>
              );
          default:
              return <div className="absolute -inset-[1px] rounded-[2rem] border border-indigo-500/30 z-[-1] shadow-[0_0_25px_rgba(99,102,241,0.2)]" />;
      }
  };

  const getCardBorderClass = () => {
    if (isGold) return 'border-amber-300 shadow-[0_0_50px_rgba(251,191,36,0.6)]';
    if (isSilver) return 'border-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.3)]';
    if (isBronze) return 'border-orange-700 shadow-[0_0_15px_rgba(194,65,12,0.3)]';
    if (isActive && character.activeEffect && character.activeEffect !== 'none') return 'border-transparent'; 
    return 'border-slate-800 shadow-xl';
  };

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={currentState}
      variants={variants}
      style={{ 
        rotateX: isGold && isActive ? rotateX : 0, 
        rotateY: isGold && isActive ? rotateY : 0,
        transformStyle: "preserve-3d", 
        perspective: 1200 // Increased perspective for deeper look
      }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="absolute w-[72%] max-w-[280px] aspect-[9/14] cursor-pointer origin-bottom touch-none select-none"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      
      drag={isActive && !isVotingEnded ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.05} 
      dragMomentum={false} 
      onDragEnd={handleDragEnd}
      whileTap={isActive && !isVotingEnded ? { scale: 0.98, cursor: "grabbing" } : {}}
    >
      
      {renderActiveEffectLayer()}

      {/* --- GOD RAYS (Back) --- */}
      <AnimatePresence>
          {isGold && isActive && (
              <div className="absolute -inset-[150%] z-[-20] flex items-center justify-center pointer-events-none opacity-60 mix-blend-screen" style={{ transform: 'translateZ(-50px)' }}>
                   <div className="w-full h-full bg-[conic-gradient(from_0deg_at_50%_50%,rgba(251,191,36,0.4)_0deg,transparent_20deg,rgba(251,191,36,0.1)_40deg,transparent_60deg,rgba(251,191,36,0.4)_80deg,transparent_100deg,rgba(251,191,36,0.1)_120deg,transparent_140deg,rgba(251,191,36,0.4)_160deg,transparent_180deg,rgba(251,191,36,0.1)_200deg,transparent_220deg,rgba(251,191,36,0.4)_240deg,transparent_260deg,rgba(251,191,36,0.1)_280deg,transparent_300deg,rgba(251,191,36,0.4)_320deg,transparent_340deg,rgba(251,191,36,0.4)_360deg)] rounded-full blur-2xl animate-[spin_20s_linear_infinite]" />
              </div>
          )}
      </AnimatePresence>

      {/* --- 3D POP-OUT BADGES (Front) --- */}
      {isTop3 && (
        <div className="absolute top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none" style={{ transform: 'translateZ(60px)' }}>
                {isGold ? (
                    <div className="relative -mt-12 flex flex-col items-center">
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-28 bg-amber-400/50 blur-[40px] rounded-full z-0 animate-pulse" />
                        <motion.div 
                            animate={{ y: [-8, 0, -8], scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="relative z-50 drop-shadow-[0_10px_10px_rgba(0,0,0,0.6)]"
                        >
                            <Crown size={90} className="text-amber-900 absolute top-[3px] left-0 z-0 opacity-80" strokeWidth={4} />
                            <Crown size={90} className="text-yellow-300 fill-amber-400 z-10 relative drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]" strokeWidth={2} />
                        </motion.div>
                        <div className="bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-700 px-10 py-2 pb-3 rounded-b-3xl shadow-[0_10px_20px_rgba(0,0,0,0.6)] border-x-[3px] border-b-[3px] border-yellow-200 -mt-6 pt-8 z-40 relative">
                            <span className="text-[14px] font-black text-amber-950 uppercase tracking-[0.25em] drop-shadow-sm">CHAMPION</span>
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
      
      {/* MAIN CARD CONTAINER - Has to be 3D compatible */}
      <div 
        className={`w-full h-full rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-slate-900 border-2 relative group transition-all duration-300 ${getCardBorderClass()}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        
        {/* Particle Effects for Winner */}
        {isGold && isVotingEnded && (
           <div className="absolute inset-0 pointer-events-none z-[10] overflow-hidden" style={{ transform: 'translateZ(20px)' }}>
               {[...Array(8)].map((_, i) => (
                   <div key={i} className="absolute bottom-0 w-1 h-1 bg-amber-300 rounded-full animate-[rise_4s_infinite_ease-in]" 
                        style={{ 
                            left: `${Math.random() * 100}%`, 
                            animationDelay: `${Math.random() * 2}s`,
                            opacity: Math.random()
                        }} 
                   />
               ))}
           </div>
        )}

        {/* Film Grain */}
        <div className="absolute inset-0 z-[5] opacity-[0.08] pointer-events-none mix-blend-overlay"
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
        </div>

        {/* Holographic Sheen */}
        {isActive && (
            <div className="absolute inset-0 z-[15] pointer-events-none overflow-hidden rounded-[1.4rem] sm:rounded-[1.9rem]">
                <div className="absolute -inset-[100%] w-[300%] h-[300%] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] animate-[sheen_6s_infinite_linear]" />
            </div>
        )}

        {/* FAMILY BADGE */}
        {!isTop3 && (
            <div className={`absolute top-0 left-0 right-0 pt-5 pb-2 flex justify-center z-20 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg">
                <FamilyIconComponent size={10} className="text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
                <span className="text-[8px] tracking-[0.2em] font-bold text-amber-100 uppercase font-display">
                {character.familyName || 'Unknown Family'}
                </span>
                <FamilyIconComponent size={10} className="text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
            </div>
            </div>
        )}

        {/* --- IMAGE SECTION WITH 3D POP-OUT EFFECT --- */}
        <div 
            className="absolute inset-0 bg-slate-800"
            style={{ 
                // CRITICAL: This separates the image plane from the card background
                transformStyle: 'preserve-3d' 
            }}
        >
           <motion.img 
             src={imgState.error ? fallbackUrl : character.imageUrl} 
             alt={character.name} 
             // Apply Parallax and Z-Scale ONLY for winner
             style={isGold && isActive ? { 
                 x: imageX, 
                 y: imageY,
                 scale: 1.15, // Zoom in slightly
                 transform: "translateZ(30px)" // Push forward in 3D space
             } : {}}
             className={`w-full h-full object-cover transition-opacity duration-500 ${imgState.loading ? 'opacity-0' : 'opacity-100'}`}
             draggable={false}
             loading={isActive ? "eager" : "lazy"}
             onLoad={() => setImgState(prev => ({ ...prev, loading: false }))}
             onError={() => setImgState({ loading: false, error: true })}
           />
           
           {/* Winner Specific: Bottom Mask to blend image into glass panel, simulating "statue" or "bust" look */}
           {isGold && isActive && (
               <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent z-[2]" style={{ transform: 'translateZ(31px)' }} />
           )}

           {/* Standard Vignette */}
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-[1]" style={{ transform: 'translateZ(1px)' }}/>
           
           {!isActive && <div className="absolute inset-0 bg-slate-950/60 z-20 backdrop-grayscale-[0.5]" />}
        </div>

        {/* --- TEXT CONTENT --- */}
        <div 
            className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end text-center z-20 pointer-events-none" 
            style={{ transform: 'translateZ(50px)' }} // Text floats even higher than image
        >
           <motion.div animate={{ opacity: isActive ? 1 : 0.5 }} transition={{ duration: 0.2 }}>
             
             {/* WINNER TEXT LAYOUT - GLASS PANEL FOR LEGIBILITY */}
             {isGold && isVotingEnded ? (
                <div className="relative mb-2 w-full flex justify-center">
                    {/* Glass Container */}
                    <div className="bg-slate-900/80 backdrop-blur-lg border border-amber-500/40 rounded-2xl p-4 shadow-xl shadow-black/50 overflow-hidden relative group w-full max-w-[92%]">
                        {/* Interactive Shine on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] translate-x-[-150%] group-hover:animate-[sheen_1s_ease-in-out]" />
                        
                        <div className="flex flex-col items-center">
                            <span className="mb-2 text-amber-200 font-display font-bold uppercase tracking-[0.2em] text-[9px] border-b border-amber-500/50 pb-1">
                                {character.role}
                            </span>
                            
                            {/* Adjusted Size and Added Text Balance */}
                            <h2 className="text-lg sm:text-xl font-display font-black text-amber-100 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] mb-3 leading-tight px-1 text-balance max-w-full">
                                {character.name}
                            </h2>
                            
                            <div className="bg-black/40 rounded-lg px-5 py-1.5 border border-amber-500/20 flex flex-col items-center">
                                <span className="text-xl font-mono font-bold text-white tracking-tighter">
                                    {character.votes.toLocaleString()}
                                </span>
                                <span className="text-[7px] text-amber-400/80 font-bold uppercase tracking-widest">
                                    Total Votes
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
             ) : (
               /* NORMAL / OTHER RANK TEXT LAYOUT */
               <>
                 <div className="flex justify-center mb-1.5">
                     <span className={`inline-block px-2 py-0.5 text-[8px] sm:text-[9px] font-bold tracking-widest uppercase rounded border backdrop-blur-md shadow-lg ${
                         isSilver ? 'bg-slate-500/20 border-slate-400 text-slate-200' :
                         isBronze ? 'bg-orange-500/20 border-orange-500 text-orange-300' :
                         'text-white/90 bg-white/10 border-white/20'
                     }`}>
                       {character.role}
                     </span>
                 </div>

                 <h2 className="text-xl sm:text-2xl font-display font-bold text-white leading-tight drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] mb-1.5 sm:mb-2 tracking-wide text-balance">
                   {character.name}
                 </h2>
                 
                 {isTop3 && isVotingEnded && (
                     <div className="mb-2 text-slate-300 font-mono font-bold text-sm bg-black/40 inline-block px-3 py-1 rounded-full mx-auto border border-white/10 backdrop-blur-sm">
                         {character.votes} Votes
                     </div>
                 )}

                 {isActive && !isTop3 && (
                   <p className="text-[10px] sm:text-[11px] text-slate-200 line-clamp-2 leading-relaxed opacity-90 font-light drop-shadow-md text-balance mx-auto max-w-[90%]">
                     {character.description}
                   </p>
                 )}
               </>
             )}
           </motion.div>
        </div>

      </div>
      
      <style>{`
        @keyframes sheen {
            0% { transform: translateX(-100%) skewX(-25deg); }
            100% { transform: translateX(200%) skewX(-25deg); } 
        }
        @keyframes rise {
            0% { transform: translateY(0) scale(1); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(-150px) scale(0); opacity: 0; }
        }
      `}</style>
    </motion.div>
  );
});

export default SwipeCard;