import React, { useState } from 'react';
import { SharingDuration, UserProfile, UserLocation } from '../../types';
import { gpsService } from '../../services/gpsService';
import { 
  ShieldAlert, 
  Clock, 
  Users, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  Sparkles, 
  X,
  Compass
} from 'lucide-react';

interface ShareLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: { friend: UserProfile }[];
  onStartSharing: (duration: SharingDuration, targetType: 'all_friends' | 'specific', friendIds: string[], location: UserLocation) => void;
  currentLocation: UserLocation | null;
}

export const ShareLocationModal: React.FC<ShareLocationModalProps> = ({
  isOpen,
  onClose,
  friends,
  onStartSharing,
  currentLocation
}) => {
  const [duration, setDuration] = useState<SharingDuration>(60);
  const [targetType, setTargetType] = useState<'all_friends' | 'specific'>('all_friends');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(gpsService.isSimulationActive());
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [hasConfirmedPrivacy, setHasConfirmedPrivacy] = useState(true);

  if (!isOpen) return null;

  const toggleFriend = (id: string) => {
    setSelectedFriendIds(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const handleStart = async () => {
    setGpsError(null);
    setIsLoadingGPS(true);

    try {
      let loc = currentLocation;
      if (!loc) {
        // Fetch fresh GPS
        loc = await gpsService.requestCurrentPosition();
      }

      if (!loc) {
        throw new Error('Unable to acquire GPS coordinates.');
      }

      const friendIdsToShare = targetType === 'all_friends' 
        ? friends.map(f => f.friend.id) 
        : selectedFriendIds;

      if (targetType === 'specific' && friendIdsToShare.length === 0) {
        setGpsError('Please select at least one friend to share with.');
        setIsLoadingGPS(false);
        return;
      }

      onStartSharing(duration, targetType, friendIdsToShare, loc);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'GPS permission is required to share your live location.';
      setGpsError(msg);
    } finally {
      setIsLoadingGPS(false);
    }
  };

  const handleToggleSimulation = (val: boolean) => {
    setIsSimulating(val);
    gpsService.toggleSimulation(val, currentLocation || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-neutral-950 border border-amber-500/40 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.15)] overflow-hidden">
        {/* Top gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-600"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-luxury text-amber-200">Share Live Location</h2>
              <p className="text-xs text-neutral-400">Authorized GPS broadcast to friends</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-4 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Privacy & Consent Banner */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <span className="font-semibold text-amber-300">Privacy Guarantee:</span> Your location is strictly shared only with the friends you authorize below. You can terminate sharing instantly at any moment.
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5 mb-2.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Sharing Duration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: '15 Minutes', val: 15 as SharingDuration },
                { label: '1 Hour', val: 60 as SharingDuration, rec: true },
                { label: '8 Hours', val: 480 as SharingDuration },
                { label: 'Until Stopped', val: -1 as SharingDuration }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setDuration(opt.val)}
                  className={`p-2.5 rounded-xl text-center border text-xs font-semibold transition relative ${
                    duration === opt.val
                      ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                      : 'bg-neutral-900/80 text-neutral-300 border-neutral-800 hover:border-amber-500/40'
                  }`}
                >
                  {opt.rec && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-amber-300 text-black text-[9px] font-extrabold rounded-full uppercase">
                      Popular
                    </span>
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Share Target */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5 mb-2.5">
              <Users className="w-4 h-4 text-amber-400" />
              Who Can See You?
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setTargetType('all_friends')}
                className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                  targetType === 'all_friends'
                    ? 'bg-amber-500/15 border-amber-400 text-amber-200'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="font-bold text-amber-100 mb-0.5">All Confirmed Friends</div>
                <div className="text-[11px] text-neutral-400">All {friends.length} friends in your circle</div>
              </button>
              <button
                type="button"
                onClick={() => setTargetType('specific')}
                className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                  targetType === 'specific'
                    ? 'bg-amber-500/15 border-amber-400 text-amber-200'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="font-bold text-amber-100 mb-0.5">Select Specific Friends</div>
                <div className="text-[11px] text-neutral-400">Choose custom recipients</div>
              </button>
            </div>

            {targetType === 'specific' && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-neutral-900/50 rounded-xl border border-neutral-800">
                {friends.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-3">No confirmed friends yet. Search users by phone first.</p>
                ) : (
                  friends.map(({ friend }) => {
                    const isChecked = selectedFriendIds.includes(friend.id);
                    return (
                      <div
                        key={friend.id}
                        onClick={() => toggleFriend(friend.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                          isChecked ? 'bg-amber-500/20 text-amber-200' : 'hover:bg-neutral-800/60 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={friend.avatarUrl} className="w-7 h-7 rounded-full object-cover border border-amber-500/30" />
                          <span className="text-xs font-medium">{friend.name}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="accent-amber-500 rounded w-4 h-4"
                        />
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Current GPS Status Info */}
          <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-neutral-200">
                  {currentLocation?.area || currentLocation?.city ? (
                    <>
                      <span className="text-amber-200">{currentLocation.area ? `${currentLocation.area}, ` : ''}{currentLocation.city || ''}</span>
                      {currentLocation.country ? ` (${currentLocation.country})` : ''}
                    </>
                  ) : (
                    currentLocation?.address || 'Browser GPS Acquired'
                  )}
                </div>
                <div className="text-[11px] text-neutral-400">
                  Accuracy: ±{currentLocation?.accuracy || 8}m • Lat: {currentLocation?.latitude.toFixed(6) || '37.7749'}, Lng: {currentLocation?.longitude.toFixed(6) || '-122.4194'}
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              GPS Ready
            </span>
          </div>

          {/* Test Movement Simulator Toggle (Helps desktop and indoor testing) */}
          <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-medium text-neutral-200">Simulate Walking Movement</div>
                <div className="text-[10px] text-neutral-400">Tests real-time tracking while at desk</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isSimulating} 
                onChange={(e) => handleToggleSimulation(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-neutral-300">
            <input
              type="checkbox"
              checked={hasConfirmedPrivacy}
              onChange={(e) => setHasConfirmedPrivacy(e.target.checked)}
              className="mt-0.5 accent-amber-500 w-4 h-4 rounded"
            />
            <span>I explicitly authorize AFZAAL LOCATION SHARE to broadcast my real-time GPS coordinates to the selected friends for the duration specified.</span>
          </label>

          {gpsError && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-900 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!hasConfirmedPrivacy || isLoadingGPS}
            onClick={handleStart}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.4)] transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoadingGPS ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                Acquiring GPS...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-black" />
                Start Live Sharing
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
