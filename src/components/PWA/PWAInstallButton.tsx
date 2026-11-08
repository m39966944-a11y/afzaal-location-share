import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, Apple, Check, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone mode, hide
  if (isInstalled) {
    return (
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
        <Check className="w-3.5 h-3.5" />
        <span>Installed App</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-3.5 py-1.5 text-xs font-extrabold text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] transition active:scale-95"
        title="Install Afzaal Location Share on your home screen"
      >
        <Download className="w-4 h-4 text-black" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-neutral-900/80 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-neutral-800 transition"
        >
          <Apple className="w-3.5 h-3.5" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-neutral-950 border border-amber-500/40 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
                <div className="flex items-center gap-2">
                  <Apple className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-amber-100 font-luxury uppercase tracking-wider">Install on iPhone / iPad</h3>
                </div>
                <button onClick={() => setShowIOSGuide(false)} className="text-neutral-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-neutral-300 space-y-3 leading-relaxed">
                <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                  <span>Tap the <strong>Share</strong> button in your Safari toolbar (box with an upward arrow at the bottom).</span>
                </div>
                <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                  <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                </div>
                <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                  <span>Tap <strong>Add</strong> in top-right. Launches full screen with luxury gold styling!</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback button on desktop or non-detected browser to view instructions
  return (
    <button
      onClick={() => setShowIOSGuide(true)}
      className="hidden sm:flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-neutral-900/80 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-neutral-800 transition"
      title="How to install as app"
    >
      <Download className="w-3.5 h-3.5 text-amber-400" />
      <span>Install PWA</span>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-950 border border-amber-500/40 p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <h3 className="text-sm font-bold text-amber-100 font-luxury uppercase tracking-wider">Install Application</h3>
              <button onClick={(e) => { e.stopPropagation(); setShowIOSGuide(false); }} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed mb-4">
              To install AFZAAL LOCATION SHARE onto your device:
              <br /><br />
              • <strong>Chrome / Edge (Desktop/Android):</strong> Look for the Install icon in the address bar or tap browser menu &gt; <em>Install app</em>.
              <br />
              • <strong>iOS Safari:</strong> Tap Share &gt; <em>Add to Home Screen</em>.
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); setShowIOSGuide(false); }}
              className="w-full py-2 bg-amber-500 rounded-xl text-black font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </button>
  );
};
