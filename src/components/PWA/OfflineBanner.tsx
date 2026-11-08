import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto z-50 flex items-center gap-2.5 rounded-2xl bg-amber-950/95 border border-amber-500/50 p-3 text-xs font-semibold text-amber-200 shadow-2xl backdrop-blur-md animate-fade-in">
      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></div>
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <div>
        <span>Offline Mode Active</span>
        <div className="text-[10px] text-amber-300/80 font-normal">Displaying cached map and friends data.</div>
      </div>
    </div>
  );
};
