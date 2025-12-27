import React, { useState, useEffect } from 'react';
import { Character } from '../types';
import { LayoutDashboard, Users, LogOut, Activity, X, FolderOpen, Smartphone, MapPin, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dataService } from '../services/dataService';

interface AdminDashboardProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ characters, setCharacters, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'voters'>('overview');
  const [voterLogs, setVoterLogs] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewingSurveillance, setViewingSurveillance] = useState<string | null>(null);
  const [surveillanceImages, setSurveillanceImages] = useState<{timestamp: string, url: string}[]>([]);

  // Load logs safely
  useEffect(() => {
    const logs: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('muse_vote_record_')) {
        const user = key.replace('muse_vote_record_', '');
        const value = localStorage.getItem(key) || '';
        try {
            const parsed = JSON.parse(value);
            if (typeof parsed === 'object') {
                logs.push({ ...parsed, user });
            }
        } catch (e) { /* ignore */ }
      }
    }
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setVoterLogs(logs);
  }, [activeTab]);

  useEffect(() => {
    let interval: any;
    if (viewingSurveillance) {
        const fetch = async () => setSurveillanceImages(await dataService.getSurveillanceImages(viewingSurveillance));
        fetch();
        interval = setInterval(fetch, 5000);
    }
    return () => clearInterval(interval);
  }, [viewingSurveillance]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <aside className={`fixed md:relative top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <span className="font-display font-bold text-xl tracking-wide">ADMIN</span>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400"><X size={20} /></button>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard size={18}/><span>Overview</span></button>
            <button onClick={() => setActiveTab('characters')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'characters' ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400 hover:bg-slate-800'}`}><Users size={18}/><span>Characters</span></button>
            <button onClick={() => setActiveTab('voters')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'voters' ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400 hover:bg-slate-800'}`}><Activity size={18}/><span>Logs</span></button>
          </nav>
          <div className="p-4"><button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 transition-colors"><LogOut size={16}/><span>Logout</span></button></div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8 relative pt-20 md:pt-8 no-scrollbar">
         {activeTab === 'overview' && <div className="text-white">Overview: Total Votes {characters.reduce((a,c)=>a+c.votes,0)}</div>}
         {activeTab === 'characters' && (
             <div className="space-y-4">{characters.map(c => <div key={c.id} className="bg-slate-900 p-4 rounded border border-slate-800 flex justify-between"><span>{c.name}</span><span>{c.votes} Votes</span></div>)}</div>
         )}
         {activeTab === 'voters' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[800px]">
                    <thead className="bg-slate-800/50 text-slate-400 font-medium"><tr><th className="p-4">User</th><th className="p-4">Surveillance</th><th className="p-4">Target</th><th className="p-4">Info</th></tr></thead>
                    <tbody className="divide-y divide-slate-800">
                        {voterLogs.map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30">
                                <td className="p-4 font-mono text-indigo-300">{log?.user}</td>
                                <td className="p-4"><button onClick={() => setViewingSurveillance(log.user)} className="flex items-center gap-2 text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700"><FolderOpen size={12}/> View</button></td>
                                <td className="p-4">{characters.find(c => c.id === log?.charId)?.name || log?.charId}</td>
                                <td className="p-4 text-xs text-slate-400 space-y-1">
                                    <div className="flex gap-1 items-center"><Smartphone size={10}/> {log?.deviceInfo?.platform}</div>
                                    {log?.location?.ipAddress && <div className="flex gap-1 items-center text-emerald-400"><Globe size={10}/> {log.location.ipAddress}</div>}
                                    {log?.location?.lat && <a href={`https://maps.google.com/?q=${log.location.lat},${log.location.lng}`} target="_blank" className="flex gap-1 items-center hover:underline text-indigo-400"><MapPin size={10}/> Maps</a>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 <AnimatePresence>
                     {viewingSurveillance && (
                         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur" onClick={() => setViewingSurveillance(null)}>
                             <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-slate-900 w-full max-w-4xl h-[80vh] rounded-2xl p-6 relative overflow-y-auto" onClick={e => e.stopPropagation()}>
                                 <h3 className="text-white font-bold mb-4">Surveillance: {viewingSurveillance}</h3>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                     {surveillanceImages.map((img, i) => (
                                         <div key={i} className="bg-black aspect-video relative"><img src={img.url} className="w-full h-full object-cover"/><span className="absolute bottom-0 bg-black/50 text-white text-[10px] w-full text-center">{img.timestamp}</span></div>
                                     ))}
                                 </div>
                             </motion.div>
                         </div>
                     )}
                 </AnimatePresence>
            </div>
         )}
      </main>
    </div>
  );
};
export default AdminDashboard;