import React from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { Character } from '../types';
import { Crown } from 'lucide-react';

interface SwipeCardProps {
  character: Character;
  isActive: boolean;
  offset: number;
  onClick: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ 
  character, 
  isActive, 
  offset, 
  onClick, 
  onSwipeLeft, 
  onSwipeRight, 
}) => {
  
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
      scale: 0.8, 
      zIndex: 10, 
      opacity: 0.5,
      rotateY: 25,
      filter: "brightness(0.4) blur(1px)",
    },
    right: { 
      x: "85%", 
      scale: 0.8, 
      zIndex: 10, 
      opacity: 0.5,
      rotateY: -25,
      filter: "brightness(0.4) blur(1px)",
    },
    farLeft: {
      x: "-150%", 
      scale: 0.6, 
      zIndex: 0, 
      opacity: 0, 
      rotateY: 45, 
      filter: "brightness(0) blur(4px)", 
    },
    farRight: { 
      x: "150%", 
      scale: 0.6, 
      zIndex: 0, 
      opacity: 0, 
      rotateY: -45, 
      filter: "brightness(0) blur(4px)", 
    }
  };

  let currentState = 'active';
  if (offset === -1) currentState = 'left';
  else if (offset === 1) currentState = 'right';
  else if (offset < -1) currentState = 'farLeft';
  else if (offset > 1) currentState = 'farRight';

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (!isActive) return;
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      onSwipeRight();
    } else if (info.offset.x < -swipeThreshold) {
      onSwipeLeft();
    }
  };

  return (
    <motion.div
      initial={false}
      animate={currentState}
      variants={variants}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="absolute w-[72%] max-w-[280px] aspect-[9/14] cursor-pointer origin-bottom touch-none"
      onClick={onClick}
      style={{ perspective: 1000 }}
      drag={isActive ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      whileTap={isActive ? { scale: 0.98, cursor: "grabbing" } : {}}
    >
      {/* Active Glow Effect */}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className={`absolute -inset-6 bg-gradient-to-t ${character.themeColor} blur-2xl rounded-[3rem] -z-10`} 
          />
        )}
      </AnimatePresence>
      
      {/* Main Card */}
      <div className={`w-full h-full rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl bg-slate-900 border transition-all duration-300 relative group ${isActive ? 'border-white/20' : 'border-slate-800'}`}>
        
        {/* Badge - Top of Card */}
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

        {/* Image & Overlays */}
        <div className="absolute inset-0">
           <img 
             src={character.imageUrl} 
             alt={character.name} 
             className="w-full h-full object-cover" 
             draggable={false}
           />
           {/* Dark Gradient Overlay */}
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/95" />
           <div className={`absolute inset-0 bg-gradient-to-t ${character.themeColor} opacity-20 mix-blend-overlay`} />
        </div>

        {/* Text Content */}
        <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end text-center select-none">
           <motion.div animate={{ opacity: isActive ? 1 : 0 }} transition={{ duration: 0.2 }}>
             <span className="inline-block px-2 py-0.5 mb-1.5 text-[8px] sm:text-[9px] font-bold tracking-widest uppercase text-white/70 bg-white/10 rounded border border-white/10 backdrop-blur-sm">
               {character.role}
             </span>
             <h2 className="text-xl sm:text-2xl font-display font-bold text-white leading-tight drop-shadow-md mb-1.5 sm:mb-2">
               {character.name}
             </h2>
             {isActive && (
               <p className="text-[10px] sm:text-[11px] text-slate-300 line-clamp-2 leading-relaxed opacity-90 font-light">
                 {character.description}
               </p>
             )}
           </motion.div>
        </div>

        {/* Dimmer for inactive cards */}
        {!isActive && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] transition-all" />
        )}

      </div>
    </motion.div>
  );
};

export default SwipeCard;