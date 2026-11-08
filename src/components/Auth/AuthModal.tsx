import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { storageService, LUXURY_AVATARS } from '../../services/storageService';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Phone, 
  User, 
  Sparkles, 
  ArrowRight,
  Radio
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(LUXURY_AVATARS[0]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isSignUp) {
        if (!name.trim() || !email.trim() || !phone.trim()) {
          throw new Error('Please fill in all required fields.');
        }
        const user = storageService.signUp(name, email, phone, selectedAvatar);
        onSuccess(user);
      } else {
        if (!email.trim()) {
          throw new Error('Please enter your email.');
        }
        const user = storageService.loginWithEmail(email);
        onSuccess(user);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    }
  };

  const handleQuickDemoLogin = (userEmail: string) => {
    const user = storageService.loginWithEmail(userEmail);
    onSuccess(user);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
      <div className="relative w-full max-w-md rounded-3xl bg-neutral-950 border border-amber-500/40 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(212,175,55,0.2)] overflow-hidden">
        {/* Gold Luxury Accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-200 to-amber-600"></div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-[0_0_25px_rgba(212,175,55,0.6)]">
            <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
              <Radio className="w-7 h-7 text-amber-400" />
            </div>
          </div>
          <h1 className="text-xl font-extrabold font-luxury text-amber-100 tracking-wider">
            AFZAAL LOCATION SHARE
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Privacy-first real-time location network
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1 bg-neutral-900 rounded-xl mb-5 border border-neutral-800">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              !isSignUp ? 'bg-amber-500 text-black shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              isSignUp ? 'bg-amber-500 text-black shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Afzaal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Phone Number (For Friend Search)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="tel"
                    required
                    placeholder="+1 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Choose Avatar
                </label>
                <div className="flex gap-2 justify-center py-1">
                  {LUXURY_AVATARS.slice(0, 4).map((av, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-10 h-10 rounded-full overflow-hidden border-2 transition ${
                        selectedAvatar === av ? 'border-amber-400 scale-105' : 'border-neutral-800 opacity-60'
                      }`}
                    >
                      <img src={av} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="email"
                required
                placeholder="name@luxury.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.4)] transition active:scale-98 flex items-center justify-center gap-2 mt-4"
          >
            <span>{isSignUp ? 'Create Secured Account' : 'Sign In Securely'}</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </form>

        {/* Instant Demo Accounts */}
        <div className="mt-6 pt-5 border-t border-neutral-900">
          <div className="text-[11px] text-neutral-500 text-center mb-2.5 font-medium">
            One-Tap Demo Login
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('m39966944@gmail.com')}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left transition"
            >
              <div className="text-xs font-bold text-amber-300">Afzaal Tariq</div>
              <div className="text-[10px] text-neutral-400">Founder & Admin</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('sophia.v@luxshare.io')}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left transition"
            >
              <div className="text-xs font-bold text-amber-100">Sophia Vance</div>
              <div className="text-[10px] text-neutral-400">Friend (Sharing Live)</div>
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          <span>Zero-tracking policy • Encrypted authentication</span>
        </div>
      </div>
    </div>
  );
};
