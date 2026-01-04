import React, { useEffect } from 'react';
import { Character } from '../types';
import { Trophy, ArrowUpRight, Crown, Medal } from 'lucide-react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';

// Fix TS errors with framer-motion props
const MotionDiv = motion.div as any;
const MotionSpan = motion.span as any;

interface LeaderboardProps {
  characters: Character[];
  onCharacterSelect?: (characterId: string) => void;
}

// Helper component for smooth number transitions
const AnimatedCounter = ({ value }: { value: number }) => {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current: number) => Math.round(current).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <MotionSpan>{display}</MotionSpan>;
};

const Leaderboard: React.FC<LeaderboardProps> = ({ characters, onCharacterSelect }) => {
  const sortedChars = [...characters].sort((a, b) => b.votes - a.votes);
  const totalVotes = characters.reduce((acc, curr) => acc + curr.votes, 0);
  const maxVotes = Math.max(...characters.map(c => c.votes));

  // Refined Animation Variants
  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: (index: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: index * 0.03, // Slight stagger for initial load
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }),
    exit: { opacity: 0, scale: 0.95 }
  };

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-slate-800/30">
        <div className="flex items-center gap-3">
            <h3 className="text-sm font-display font-bold text-slate-200 flex items-center gap-2">
            <Trophy className="text-amber-400" size={16} />
            <span className="tracking-wider text-amber-100">LEADERBOARD</span>
            </h3>
            {/* Pulsing Live Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 rounded-full border border-red-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-[9px] font-bold text-red-400 tracking-wider">LIVE</span>
            </div>
        </div>
        
        <span className="text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-700 px-2 py-1 rounded">
          TOTAL: {totalVotes.toLocaleString()}
        </span>
      </div>

      {/* List */}
      <div className="p-4 sm:p-6 space-y-3">
        {/* 'popLayout' ensures items animate out of the way for reordering */}
        <AnimatePresence mode="popLayout" initial={false}>
          {sortedChars.map((char, index) => {
             const relativePercentage = maxVotes > 0 ? (char.votes / maxVotes) * 100 : 0;
             const isWinner = index === 0;
             const isSilver = index === 1;
             const isBronze = index === 2;
             const isTop3 = isWinner || isSilver || isBronze;

             // Dynamic Styles based on Rank
             let containerStyle = "p-3 hover:bg-slate-800/40 border-transparent bg-transparent";
             let rankBadgeStyle = "w-6 h-6 text-[10px] text-slate-500 font-medium";
             let nameStyle = "text-xs text-slate-300 group-hover:text-indigo-300";
             let voteStyle = "text-xs text-slate-400 font-medium";
             let barColor = char.themeColor;

             if (isWinner) {
                 containerStyle = "p-4 bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.2)] mb-4 scale-[1.02] z-20";
                 rankBadgeStyle = "w-9 h-9 text-lg bg-gradient-to-br from-yellow-300 to-amber-600 text-amber-950 font-black shadow-lg shadow-amber-500/40 ring-2 ring-yellow-200";
                 nameStyle = "text-xl text-amber-200 font-display tracking-wide drop-shadow-sm font-bold";
                 voteStyle = "text-2xl text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] font-bold";
                 barColor = "from-amber-400 to-amber-600";
             } else if (isSilver) {
                 containerStyle = "p-3.5 bg-gradient-to-r from-slate-400/10 to-slate-900 border-slate-400/20 mb-2 z-10";
                 rankBadgeStyle = "w-7 h-7 text-xs bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-md shadow-slate-500/30 ring-1 ring-slate-300/40";
                 nameStyle = "text-sm text-slate-200 font-display font-semibold";
                 voteStyle = "text-sm text-slate-300 font-bold";
                 barColor = "from-slate-300 to-slate-500";
             } else if (isBronze) {
                 containerStyle = "p-3.5 bg-gradient-to-r from-orange-700/10 to-slate-900 border-orange-700/20 mb-2 z-10";
                 rankBadgeStyle = "w-7 h-7 text-xs bg-gradient-to-br from-orange-400 to-orange-700 text-white shadow-md shadow-orange-700/30 ring-1 ring-orange-400/40";
                 nameStyle = "text-sm text-orange-200 font-display font-semibold";
                 voteStyle = "text-sm text-orange-400 font-bold";
                 barColor = "from-orange-400 to-orange-700";
             }

             return (
              <MotionDiv 
                key={char.id}
                layout // Enables automatic layout animations
                custom={index}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                // Smooth spring physics for reordering (mass: 1.2 makes it feel substantial)
                transition={{ 
                    type: "spring", 
                    stiffness: 45, 
                    damping: 15, 
                    mass: 1.2 
                }}
                whileHover={{ scale: isWinner ? 1.03 : 1.01, x: 2 }}
                onClick={() => onCharacterSelect && onCharacterSelect(char.id)}
                className={`relative group cursor-pointer rounded-xl border transition-all duration-300 ${containerStyle}`}
              >
                {/* Background Shimmer Animation for Winner */}
                {isWinner && (
                  <div className="absolute inset-0 z-0 rounded-xl overflow-hidden pointer-events-none">
                       <div className="absolute inset-0 bg-amber-400/5" />
                       <MotionDiv 
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent skew-x-[-20deg]"
                      />
                  </div>
                )}

                <div className={`flex justify-between items-center z-10 relative ${isWinner ? 'mb-3' : 'mb-2'}`}>
                   <div className="flex items-center gap-3 md:gap-4">
                      {/* Rank Badge */}
                      <MotionDiv 
                        layout="position" // Animate position specifically
                        className={`flex items-center justify-center rounded-full font-mono flex-shrink-0 transition-colors ${rankBadgeStyle}`}
                      >
                        {index + 1}
                      </MotionDiv>

                      <div className="flex flex-col">
                          <span className={`transition-colors flex items-center gap-2 ${nameStyle}`}>
                              {char.name}
                              {/* 3D POP OUT CROWN FOR WINNER */}
                              {isWinner && (
                                  <div className="relative ml-1">
                                      <Crown 
                                        size={22} 
                                        className="text-yellow-400 fill-amber-300 drop-shadow-[0_2px_0_rgba(180,83,9,1)] -rotate-12 transform hover:scale-110 transition-transform" 
                                        strokeWidth={2.5}
                                      />
                                      <div className="absolute inset-0 bg-amber-400 blur-md opacity-40"></div>
                                  </div>
                              )}
                              {isSilver && <Medal size={14} className="text-slate-400 fill-slate-400/20" />}
                              {isBronze && <Medal size={14} className="text-orange-600 fill-orange-600/20" />}
                              {!isTop3 && <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400"/>}
                          </span>
                          
                          {/* Role Subtext - Only for Top 3 */}
                          {isTop3 && (
                              <span className={`text-[9px] uppercase tracking-widest font-bold opacity-70 ${
                                  isWinner ? 'text-amber-500' : isSilver ? 'text-slate-400' : 'text-orange-500'
                              }`}>
                                  {char.role}
                              </span>
                          )}
                      </div>
                   </div>

                   <div className="flex flex-col items-end">
                       {/* Animated Number Counter */}
                       <span className={`font-mono transition-transform ${voteStyle}`}>
                         <AnimatedCounter value={char.votes} />
                       </span>
                       {isWinner && <span className="text-[9px] text-amber-500/60 uppercase font-bold">Votes</span>}
                   </div>
                </div>

                {/* Progress Bar */}
                <div className={`w-full rounded-full overflow-hidden flex items-center bg-slate-800/50 ${isWinner ? 'h-3 border border-amber-900/30' : 'h-1.5'}`}>
                   <MotionDiv 
                     className={`h-full rounded-full bg-gradient-to-r ${barColor} relative overflow-hidden`}
                     initial={{ width: 0 }}
                     animate={{ width: `${relativePercentage}%` }}
                     transition={{ type: "spring", stiffness: 35, damping: 25 }}
                   >
                       {/* Shimmer Effect on Bar */}
                       <div className="absolute inset-0 bg-white/30 skew-x-[-20deg] animate-[shimmer_2s_infinite] translate-x-[-100%]" />
                   </MotionDiv>
                </div>
              </MotionDiv>
             );
          })}
        </AnimatePresence>
      </div>
      <style>{`
        @keyframes shimmer {
            100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;