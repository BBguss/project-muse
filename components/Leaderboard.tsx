import React from 'react';
import { Character } from '../types';
import { Trophy, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardProps {
  characters: Character[];
  onCharacterSelect?: (characterId: string) => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ characters, onCharacterSelect }) => {
  const sortedChars = [...characters].sort((a, b) => b.votes - a.votes);
  const totalVotes = characters.reduce((acc, curr) => acc + curr.votes, 0);
  const maxVotes = Math.max(...characters.map(c => c.votes));

  // Animation variants for staggered list items
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (index: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: index * 0.05, 
        type: "spring" as const,
        stiffness: 50,
        damping: 15
      }
    }),
    exit: { opacity: 0, x: -20 }
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
          TOTAL: {totalVotes}
        </span>
      </div>

      {/* List - No internal scroll, let page scroll */}
      <div className="p-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {sortedChars.map((char, index) => {
             const relativePercentage = maxVotes > 0 ? (char.votes / maxVotes) * 100 : 0;
             
             return (
              <motion.div 
                key={char.id}
                layout
                custom={index}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover={{ scale: 1.02, x: 4 }}
                onClick={() => onCharacterSelect && onCharacterSelect(char.id)}
                className="relative group cursor-pointer"
              >
                <div className="flex justify-between items-center mb-1.5 text-xs z-10 relative">
                   <div className="flex items-center gap-3">
                      <span className={`font-mono font-bold w-5 h-5 flex items-center justify-center rounded-full text-[10px] transition-colors ${
                          index === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 
                          index === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30' :
                          index === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/30' :
                          'text-slate-600'
                        }`}>
                        {index + 1}
                      </span>
                      <div className="flex flex-col">
                          <span className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                              {char.name}
                              <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400"/>
                          </span>
                      </div>
                   </div>
                   <div className="flex flex-col items-end">
                       <span className="text-indigo-300 font-bold group-hover:scale-110 transition-transform">{char.votes}</span>
                   </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                   <motion.div 
                     className={`h-full rounded-full bg-gradient-to-r ${char.themeColor} relative overflow-hidden`}
                     initial={{ width: 0 }}
                     animate={{ width: `${relativePercentage}%` }}
                     transition={{ type: "spring", stiffness: 40, damping: 20 }}
                   >
                       {/* Shimmer Effect on Bar */}
                       <div className="absolute inset-0 bg-white/20 skew-x-[-20deg] animate-[shimmer_2s_infinite] translate-x-[-100%]" />
                   </motion.div>
                </div>
              </motion.div>
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