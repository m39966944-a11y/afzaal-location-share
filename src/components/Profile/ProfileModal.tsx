import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { storageService, LUXURY_AVATARS } from '../../services/storageService';
import { 
  User, 
  Phone, 
  Mail, 
  Shield, 
  LogOut, 
  Check, 
  X, 
  Camera, 
  Sparkles,
  Users
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onLogout: () => void;
  onUserSwitched: (newUser: UserProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onUserSwitched
}) => {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [bio, setBio] = useState(user.bio || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarUrl);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const allUsers = storageService.getUsers();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      avatarUrl: selectedAvatar
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const handleQuickSwitch = (uId: string) => {
    const switched = storageService.switchUser(uId);
    if (switched) {
      onUserSwitched(switched);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-neutral-950 border border-amber-500/40 p-6 shadow-2xl overflow-hidden">
        {/* Top gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-600"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <User className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-luxury text-amber-200">User Profile</h2>
              <p className="text-xs text-neutral-400">Manage account credentials & identity</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Avatar Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400/90 block mb-2">
              Profile Avatar
            </label>
            <div className="flex items-center gap-3 mb-3">
              <img 
                src={selectedAvatar} 
                className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.4)]" 
                alt="Selected"
              />
              <div className="text-xs text-neutral-300">
                <div className="font-semibold text-amber-100">Gold Tier Identity</div>
                <div className="text-neutral-500 text-[11px]">Select a curated luxury avatar below</div>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {LUXURY_AVATARS.map((avUrl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedAvatar(avUrl)}
                  className={`relative shrink-0 w-11 h-11 rounded-full overflow-hidden border-2 transition ${
                    selectedAvatar === avUrl ? 'border-amber-400 scale-105 ring-2 ring-amber-400/60' : 'border-neutral-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={avUrl} className="w-full h-full object-cover" />
                  {selectedAvatar === avUrl && (
                    <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white font-bold" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* Email (Read only for auth security) */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Registered Email (Primary Auth)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Phone Number (Used for Friend Discovery)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Status / Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Traveling in SF • Available for location sharing"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Role & Security Info */}
          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-neutral-300">Account Role</span>
            </div>
            <span className="font-bold text-amber-300 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {user.role}
            </span>
          </div>

          {/* Multi-Account Quick Switcher (For testing multi-device location sharing immediately) */}
          <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-neutral-300">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Multi-Account Switcher (Instant Demo)</span>
            </div>
            <p className="text-[11px] text-neutral-500 mb-2.5">
              Switch profiles instantly to simulate another friend on the map or test phone search:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickSwitch(u.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] border transition ${
                    u.id === user.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <img src={u.avatarUrl} className="w-3.5 h-3.5 rounded-full object-cover" />
                  {u.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-neutral-800 text-neutral-400 text-xs hover:bg-neutral-900 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow transition flex items-center gap-1.5"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 text-black" />
                    Saved
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
