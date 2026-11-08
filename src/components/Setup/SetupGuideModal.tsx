import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { 
  Flame, 
  Download, 
  Copy, 
  Check, 
  Smartphone, 
  Laptop, 
  Apple, 
  ShieldCheck, 
  Key, 
  X,
  ExternalLink
} from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'firebase' | 'pwa';
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'firebase'
}) => {
  const [tab, setTab] = useState<'firebase' | 'pwa'>(defaultTab);
  const [copiedRules, setCopiedRules] = useState(false);
  const [customConfig, setCustomConfig] = useState(storageService.getCustomFirebaseConfig() || '');
  const [savedConfigMsg, setSavedConfigMsg] = useState(false);

  if (!isOpen) return null;

  const FIRESTORE_RULES_CONTENT = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Default deny catch-all
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // Public Profiles
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isOwner(userId) && 
        request.resource.data.keys().hasAll(['name', 'phone', 'email']) &&
        request.resource.data.name is string && request.resource.data.name.size() <= 60;
      allow update: if isOwner(userId) && 
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['name', 'bio', 'avatarUrl', 'phone', 'isOnline']);
      allow delete: if isOwner(userId);
    }

    // Friendships: Only participants can read and manage
    match /friendships/{friendshipId} {
      allow read: if isSignedIn() && (
        resource.data.requesterId == request.auth.uid ||
        resource.data.recipientId == request.auth.uid
      );
      allow create: if isSignedIn() && request.resource.data.requesterId == request.auth.uid;
      allow update: if isSignedIn() && (
        resource.data.recipientId == request.auth.uid ||
        resource.data.requesterId == request.auth.uid
      );
      allow delete: if isSignedIn() && (
        resource.data.requesterId == request.auth.uid ||
        resource.data.recipientId == request.auth.uid
      );
    }

    // Live Location Sessions: Strict privacy!
    // Only the broadcaster or approved friends can read the live location stream!
    match /sessions/{sessionId} {
      allow read: if isSignedIn() && (
        resource.data.userId == request.auth.uid ||
        resource.data.allowedFriendIds.hasAny([request.auth.uid])
      );
      allow create: if isSignedIn() && 
        request.resource.data.userId == request.auth.uid &&
        request.resource.data.lastLocation != null;
      allow update: if isSignedIn() && 
        resource.data.userId == request.auth.uid &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['lastLocation', 'isActive', 'expiresAt']);
      allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }
  }
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES_CONTENT);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveCustomFirebaseConfig(customConfig);
    setSavedConfigMsg(true);
    setTimeout(() => setSavedConfigMsg(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-neutral-950 border border-amber-500/40 p-6 shadow-2xl overflow-hidden">
        {/* Top gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-200 to-amber-600"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              {tab === 'firebase' ? <Flame className="w-5 h-5 text-amber-400" /> : <Smartphone className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <h2 className="text-lg font-bold font-luxury text-amber-100">Setup & Deployment Guide</h2>
              <p className="text-xs text-neutral-400">Configure Cloud Firestore & Mobile PWA Installation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 p-1 bg-neutral-900 rounded-xl my-4 border border-neutral-800">
          <button
            onClick={() => setTab('firebase')}
            className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
              tab === 'firebase' ? 'bg-amber-500 text-black shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            Firebase Backend Guide
          </button>
          <button
            onClick={() => setTab('pwa')}
            className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
              tab === 'pwa' ? 'bg-amber-500 text-black shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            PWA Mobile Install Guide
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[65vh] overflow-y-auto space-y-4 pr-1 text-xs">
          {tab === 'firebase' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                <h3 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  1. Connect Firebase Project (5 Minutes)
                </h3>
                <ol className="list-decimal list-inside text-neutral-300 space-y-1.5 leading-relaxed pl-1">
                  <li>Visit <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-amber-400 underline inline-flex items-center gap-0.5">console.firebase.google.com <ExternalLink className="w-3 h-3" /></a> and create a project.</li>
                  <li>Enable <strong>Authentication</strong> (Email/Password provider enabled).</li>
                  <li>Create a <strong>Cloud Firestore</strong> database in Production mode.</li>
                  <li>Go to Project Settings &rarr; General &rarr; Your Apps &rarr; Web App &rarr; Copy the <code className="bg-neutral-950 px-1 py-0.5 rounded text-amber-300 font-mono text-[11px]">firebaseConfig</code> object.</li>
                </ol>
              </div>

              {/* Paste Config Input */}
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <h4 className="font-bold text-amber-200 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Custom Firebase Credentials (Optional)
                </h4>
                <p className="text-neutral-400 text-[11px] mb-2.5">
                  The app currently runs with real-time local storage + multi-tab synchronization. You can also paste your live Firebase config JSON here:
                </p>
                <form onSubmit={handleSaveConfig} className="space-y-2">
                  <textarea
                    rows={4}
                    placeholder='{"apiKey": "AIzaSy...", "authDomain": "...", "projectId": "..."}'
                    value={customConfig}
                    onChange={(e) => setCustomConfig(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 font-mono text-[11px] text-amber-200 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400">
                      {savedConfigMsg && 'Configuration saved securely in browser!'}
                    </span>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg transition"
                    >
                      Save Config
                    </button>
                  </div>
                </form>
              </div>

              {/* Firestore Rules */}
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-amber-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    2. Production Security Rules (firestore.rules)
                  </h4>
                  <button
                    onClick={handleCopyRules}
                    className="flex items-center gap-1 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-semibold rounded-lg text-xs transition"
                  >
                    {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedRules ? 'Copied!' : 'Copy Rules'}
                  </button>
                </div>
                <p className="text-neutral-400 text-[11px] mb-2 leading-relaxed">
                  Paste these rules in the <strong>Firestore &gt; Rules</strong> tab in your Firebase Console. They guarantee that location is never exposed to non-friends:
                </p>
                <pre className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 font-mono text-[10px] text-amber-200/90 overflow-x-auto max-h-48">
                  {FIRESTORE_RULES_CONTENT}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  Android Phones & Tablets
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  1. Open AFZAAL LOCATION SHARE in Chrome on your Android device.<br />
                  2. Tap the gold <strong>Install App</strong> button in the top navigation bar.<br />
                  3. If prompt doesn't appear, tap the Chrome menu (3 dots) &rarr; tap <strong>Add to Home screen</strong> or <strong>Install app</strong>.<br />
                  4. The app launches full-screen with native GPS accuracy and offline caching.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Apple className="w-4 h-4 text-amber-400" />
                  iPhones & iPads (iOS Safari)
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  1. Open this app in <strong>Safari</strong> on iOS.<br />
                  2. Tap the <strong>Share</strong> button (box with upward arrow at bottom).<br />
                  3. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
                  4. Tap <strong>Add</strong> in the top-right corner. The luxury gold icon appears on your iPhone home screen!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Laptop className="w-4 h-4 text-amber-400" />
                  Desktop (Mac, Windows, Linux)
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  1. In Google Chrome, Edge, or Brave, click the <strong>Install</strong> icon in the address bar (or click "Install App" in our navigation bar).<br />
                  2. Confirm installation to run as a dedicated desktop window without browser borders.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
