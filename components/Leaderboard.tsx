import React from 'react';
import { Character } from '../types';
import { Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardProps {
  characters: Character[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ characters }) => {
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
        <h3 className="text-sm font-display font-bold text-slate-200 flex items-center gap-2">
          <Trophy className="text-amber-400" size={16} />
          <span className="tracking-wider text-amber-100">LEADERBOARD</span>
        </h3>
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
                className="relative group"
              >
                <div className="flex justify-between items-center mb-1.5 text-xs z-10 relative">
                   <div className="flex items-center gap-3">
                      <span className={`font-mono font-bold w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${
                          index === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
                          index === 1 ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30' :
                          index === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/30' :
                          'text-slate-600'
                        }`}>
                        {index + 1}
                      </span>
                      <span className="font-semibold text-slate-200">{char.name}</span>
                   </div>
                   <span className="text-indigo-300 font-bold">{char.votes}</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                   <motion.div 
                     className={`h-full rounded-full bg-gradient-to-r ${char.themeColor}`}
                     initial={{ width: 0 }}
                     animate={{ width: `${relativePercentage}%` }}
                     transition={{ type: "spring", stiffness: 40, damping: 20 }}
                   />
                </div>
              </motion.div>
             );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Leaderboard;