import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  UserLocation, 
  LocationShareSession, 
  Friendship, 
  AppNotification, 
  SharingDuration 
} from './types';
import { storageService } from './services/storageService';
import { gpsService } from './services/gpsService';
import { MapView } from './components/Map/MapView';
import { ShareLocationModal } from './components/Location/ShareLocationModal';
import { FriendsManager } from './components/Friends/FriendsManager';
import { ProfileModal } from './components/Profile/ProfileModal';
import { AuthModal } from './components/Auth/AuthModal';
import { AdminPanel } from './components/Admin/AdminPanel';
import { SetupGuideModal } from './components/Setup/SetupGuideModal';
import { NotificationDrawer } from './components/Notifications/NotificationDrawer';
import { PWAInstallButton } from './components/PWA/PWAInstallButton';
import { OfflineBanner } from './components/PWA/OfflineBanner';
import { 
  Radio, 
  MapPin, 
  Users, 
  Shield, 
  ShieldAlert, 
  Bell, 
  StopCircle, 
  Sparkles, 
  Flame, 
  Settings, 
  Navigation, 
  Clock, 
  ChevronRight,
  Compass,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);
  const [sharedFriends, setSharedFriends] = useState<LocationShareSession[]>([]);
  const [friendsList, setFriendsList] = useState<{ friend: UserProfile; friendship: Friendship }[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<{ friend: UserProfile; friendship: Friendship; isIncoming: boolean }[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'map' | 'friends' | 'admin' | 'setup'>('map');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedFriendSession, setSelectedFriendSession] = useState<LocationShareSession | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleLocateMe = async () => {
    setIsLocating(true);
    setGpsError(null);
    try {
      const loc = await gpsService.requestCurrentPosition();
      setCurrentLocation(loc);
      storageService.updateLiveLocation(loc);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Location permission is required.';
      setGpsError(msg);
    } finally {
      setIsLocating(false);
    }
  };

  // Initialize and Sync from storage
  const reloadData = () => {
    const user = storageService.getCurrentUser();
    setCurrentUser(user);

    if (user) {
      const friends = storageService.getFriendsForUser(user.id);
      setFriendsList(friends);

      const pendings = storageService.getPendingInvitations(user.id);
      setPendingInvitations(pendings);

      const visibleSessions = storageService.getSharedLocationsVisibleToUser(user.id);
      setSharedFriends(visibleSessions);

      const notifs = storageService.getNotifications(user.id);
      setNotifications(notifs);

      if (user.currentLocation) {
        setCurrentLocation(user.currentLocation);
      }
    } else {
      setIsAuthModalOpen(true);
    }
  };

  useEffect(() => {
    reloadData();
    const unsubscribe = storageService.subscribe(() => {
      reloadData();
    });
    return () => unsubscribe();
  }, []);

  // Initialize GPS Watcher
  useEffect(() => {
    if (!currentUser) return;

    // Check GPS
    gpsService.requestCurrentPosition()
      .then((loc) => {
        setCurrentLocation(loc);
        storageService.updateLiveLocation(loc);
      })
      .catch((err) => {
        setGpsError(err.message);
      });

    // Start live continuous background tracking
    gpsService.startLiveTracking();
    const unbindLoc = gpsService.onLocationUpdate((loc) => {
      setCurrentLocation(loc);
      if (currentUser.isSharing) {
        storageService.updateLiveLocation(loc);
      }
    });

    const unbindErr = gpsService.onError((err) => {
      setGpsError(err);
    });

    return () => {
      unbindLoc();
      unbindErr();
      gpsService.stopLiveTracking();
    };
  }, [currentUser?.id, currentUser?.isSharing]);

  // Periodic expiration checker
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentUser?.isSharing) {
        const active = storageService.getActiveSessionForUser(currentUser.id);
        if (!active || !active.isActive) {
          reloadData();
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Handlers
  const handleStartSharing = (
    duration: SharingDuration,
    targetType: 'all_friends' | 'specific',
    allowedFriendIds: string[],
    location: UserLocation
  ) => {
    storageService.startSharingLocation(duration, targetType, allowedFriendIds, location);
    reloadData();
  };

  const handleStopSharing = () => {
    storageService.stopSharingLocation();
    reloadData();
  };

  const handleLogout = () => {
    storageService.setCurrentUser(null);
    setCurrentUser(null);
    setIsProfileModalOpen(false);
    setIsAuthModalOpen(true);
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;
  const activeMySession = currentUser ? storageService.getActiveSessionForUser(currentUser.id) : null;
  const isBroadcasting = !!(currentUser?.isSharing && activeMySession?.isActive);

  // Remaining time calculation
  const getRemainingTimeText = () => {
    if (!activeMySession) return '';
    if (activeMySession.durationMinutes === -1 || !activeMySession.expiresAt) {
      return 'Until stopped';
    }
    const diff = Math.max(0, activeMySession.expiresAt - Date.now());
    const mins = Math.ceil(diff / 60000);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m remaining`;
    }
    return `${mins}m remaining`;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Offline Toast Banner */}
      <OfflineBanner />

      {/* Top Luxury Navbar */}
      <header className="sticky top-0 z-40 w-full bg-[#0d0d0f]/90 backdrop-blur-md border-b border-amber-500/25 px-4 lg:px-8 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('map')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-600 p-0.5 shadow-[0_0_20px_rgba(212,175,55,0.5)]">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wider font-luxury gold-gradient-text uppercase">
                  AFZAAL LOCATION SHARE
                </span>
                <span className="hidden sm:inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30 uppercase tracking-widest">
                  LUXURY PRO
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-medium tracking-wide">
                Privacy-First GPS Network
              </p>
            </div>
          </div>

          {/* Navigation Controls & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Firebase & PWA Guide Button */}
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow transition"
              title="Firebase & PWA Instructions"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Setup Guide</span>
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-amber-300 transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black font-extrabold text-[10px] flex items-center justify-center shadow">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* User Profile Pill */}
            {currentUser ? (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 transition group"
              >
                <div className="relative">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-amber-400 group-hover:scale-105 transition"
                  />
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-black ${isBroadcasting ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`}></span>
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-neutral-200 group-hover:text-amber-300 transition">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    {currentUser.role === 'admin' ? 'Administrator' : 'Verified Member'}
                  </div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs shadow hover:bg-amber-400 transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-5">
        {/* Top Active Broadcast Banner or Quick Share Strip */}
        {isBroadcasting ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/80 via-neutral-900 to-amber-950/80 border-2 border-amber-400 shadow-[0_0_35px_rgba(212,175,55,0.25)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400 flex items-center justify-center shrink-0">
                <Radio className="w-6 h-6 text-amber-400 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black animate-ping"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-amber-300">
                    Broadcasting Live GPS Location
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold text-[10px] border border-amber-400/30">
                    {getRemainingTimeText()}
                  </span>
                </div>
                <div className="text-xs text-neutral-300 mt-1">
                  Visible to: <span className="font-semibold text-white">{activeMySession?.targetType === 'all_friends' ? 'All Confirmed Friends' : `${activeMySession?.allowedFriendIds.length} Selected Friends`}</span> • Real-time encrypted updates
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={handleStopSharing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg transition active:scale-95"
              >
                <StopCircle className="w-4 h-4 text-white" />
                Stop Sharing Now
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-neutral-200">
                    Private Mode • Device Location Protected
                  </h3>
                  {currentLocation && (
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.2 rounded-full">
                      GPS Active (±{currentLocation.accuracy || 8}m)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {currentLocation?.street || currentLocation?.area || currentLocation?.city ? (
                    <>
                      <strong className="text-amber-200">
                        {currentLocation.street ? `${currentLocation.street}, ` : ''}
                        {currentLocation.area ? `${currentLocation.area}, ` : ''}
                        {currentLocation.city || currentLocation.town || ''}
                      </strong>
                      {currentLocation.district ? ` • ${currentLocation.district}` : ''}
                      {currentLocation.province ? ` • ${currentLocation.province}` : ''}
                      {currentLocation.country ? ` • ${currentLocation.country}` : ''}
                    </>
                  ) : (
                    currentLocation?.address || 'Device GPS active • Tap Locate Me on map to center'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.35)] transition active:scale-95"
              >
                <Radio className="w-4 h-4 text-black" />
                <span>Share Live Location</span>
              </button>
            </div>
          </div>
        )}

        {gpsError && (
          <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-xl">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-semibold text-amber-300">GPS Access Notice:</span> {gpsError}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleLocateMe}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition"
              >
                Enable GPS Now
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation Menu */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'map'
                  ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Live Map</span>
              {sharedFriends.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeTab === 'map' ? 'bg-black text-amber-400' : 'bg-amber-500 text-black'}`}>
                  {sharedFriends.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('friends')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'friends'
                  ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Friends & Invites</span>
              {pendingInvitations.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              )}
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin Panel</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('setup')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'setup'
                  ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span className="hidden sm:inline">Firebase & PWA</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Real-time Sync Active</span>
          </div>
        </div>

        {/* Tab 1: Live Interactive Map */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="h-[68vh] min-h-[520px] w-full">
              <MapView
                myLocation={currentLocation}
                sharedFriends={sharedFriends}
                isSharing={isBroadcasting}
                onSelectFriend={(sess) => setSelectedFriendSession(sess)}
                selectedFriendId={selectedFriendSession?.userId}
                onLocateMe={handleLocateMe}
                isLocating={isLocating}
                gpsError={gpsError}
                onRequestGPSPermission={handleLocateMe}
              />
            </div>

            {/* Quick Friend Location Drawer (Horizontal Pills on Mobile) */}
            {sharedFriends.length > 0 && (
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-amber-500/20">
                <div className="text-xs font-bold text-amber-200 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>Currently Sharing Friends</span>
                  <span className="text-neutral-400 text-[11px] font-normal">{sharedFriends.length} live broadcast{sharedFriends.length === 1 ? '' : 's'}</span>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {sharedFriends.map(session => (
                    <div
                      key={session.id}
                      onClick={() => setSelectedFriendSession(session)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border shrink-0 cursor-pointer transition ${
                        selectedFriendSession?.userId === session.userId
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : 'bg-neutral-950 border-neutral-800 hover:border-amber-500/30 text-neutral-300'
                      }`}
                    >
                      <div className="relative">
                        <img src={session.userAvatar} className="w-9 h-9 rounded-full object-cover border border-amber-400" />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black animate-ping"></span>
                      </div>
                      <div>
                        <div className="text-xs font-bold">{session.userName}</div>
                        <div className="text-[10px] text-neutral-400 line-clamp-1 max-w-[130px]">
                          {session.lastLocation?.address || 'Live Location'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Friends Manager */}
        {activeTab === 'friends' && currentUser && (
          <FriendsManager
            currentUserId={currentUser.id}
            friends={friendsList}
            pendingInvitations={pendingInvitations}
            onSelectFriendOnMap={(fId) => {
              setActiveTab('map');
            }}
            onOpenShareModal={() => setIsShareModalOpen(true)}
          />
        )}

        {/* Tab 3: Admin Panel */}
        {activeTab === 'admin' && currentUser && currentUser.role === 'admin' && (
          <AdminPanel currentUser={currentUser} />
        )}

        {/* Tab 4: Setup & Documentation */}
        {activeTab === 'setup' && (
          <div className="p-6 rounded-2xl bg-neutral-900/90 border border-amber-500/30 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div>
                <h2 className="text-base font-bold font-luxury text-amber-100 uppercase tracking-wider">
                  Firebase Backend & Security Rules Architecture
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Zero-leakage security rules and instructions for connecting custom Cloud Firestore
                </p>
              </div>
              <button
                onClick={() => setIsSetupModalOpen(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow transition"
              >
                Open Interactive Setup Dialog
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <h3 className="font-bold text-xs text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Privacy & Data Invariants
                </h3>
                <ul className="text-xs text-neutral-300 space-y-2 list-disc list-inside">
                  <li><strong>Zero Secret Tracking:</strong> Device location cannot be accessed or queried by phone number alone.</li>
                  <li><strong>Mutual Friend Authorization:</strong> Only confirmed friends in the sender's allowlist can read location packets.</li>
                  <li><strong>Instant Kill Switch:</strong> Broadcasters can terminate sharing with 1 tap, automatically revoking tokens.</li>
                  <li><strong>Time-Bounded TTL:</strong> Sharing sessions expire automatically after 15m, 1h, or 8h.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <h3 className="font-bold text-xs text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Cloud Firestore Integration
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  AFZAAL LOCATION SHARE includes a persistent real-time engine with multi-window sync. To connect your live Google Cloud Firebase project, click the <strong>Setup Guide</strong> button in the top navigation bar to paste your Firebase credentials or deploy the hardened Firestore rules.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Luxury Footer */}
      <footer className="mt-auto border-t border-neutral-900 bg-neutral-950/80 px-4 py-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-luxury font-bold text-amber-400">AFZAAL LOCATION SHARE</span>
            <span>•</span>
            <span>Luxury Black & Gold Edition</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>End-to-End Authorized</span>
            <span>•</span>
            <span>PWA Standalone Ready</span>
            <span>•</span>
            <span>Android & iOS Compatible</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ShareLocationModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        friends={friendsList}
        onStartSharing={handleStartSharing}
        currentLocation={currentLocation}
      />

      {currentUser && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={currentUser}
          onLogout={handleLogout}
          onUserSwitched={(newUser) => setCurrentUser(newUser)}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          reloadData();
        }}
      />

      <SetupGuideModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
      />

      {currentUser && (
        <NotificationDrawer
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          currentUserId={currentUser.id}
          onOpenFriends={() => setActiveTab('friends')}
        />
      )}
    </div>
  );
}
