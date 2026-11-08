import { 
  UserProfile, 
  Friendship, 
  LocationShareSession, 
  AppNotification, 
  UserReport, 
  PrivacyAuditLog,
  UserLocation,
  SharingDuration
} from '../types';

const USERS_STORAGE_KEY = 'afzaal_users_v2';
const CURRENT_USER_KEY = 'afzaal_current_user_v2';
const FRIENDSHIPS_STORAGE_KEY = 'afzaal_friendships_v2';
const SESSIONS_STORAGE_KEY = 'afzaal_sessions_v2';
const NOTIFICATIONS_STORAGE_KEY = 'afzaal_notifications_v2';
const REPORTS_STORAGE_KEY = 'afzaal_reports_v2';
const AUDIT_LOG_KEY = 'afzaal_audit_logs_v2';
const FIREBASE_CONFIG_KEY = 'afzaal_custom_firebase_config_v2';

// Luxury preset avatars
export const LUXURY_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
];

// Initial Seed Users for immediate testability and multi-friend demo
const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user_afzaal_founder',
    name: 'Afzaal Tariq',
    email: 'm39966944@gmail.com', // Matches user email from metadata
    phone: '+1 555-0199',
    avatarUrl: LUXURY_AVATARS[1],
    bio: 'Founder & Security Lead at Afzaal Location Share.',
    role: 'admin',
    createdAt: '2026-01-15T08:00:00.000Z',
    isOnline: true,
    isSharing: false,
    currentLocation: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 9,
      timestamp: Date.now() - 30000,
      address: 'Market St, San Francisco, CA'
    }
  },
  {
    id: 'user_sophia',
    name: 'Sophia Vance',
    email: 'sophia.v@luxshare.io',
    phone: '+1 555-0288',
    avatarUrl: LUXURY_AVATARS[0],
    bio: 'Creative Director. Always on the move.',
    role: 'user',
    createdAt: '2026-02-10T11:20:00.000Z',
    isOnline: true,
    isSharing: true,
    currentLocation: {
      latitude: 37.7833,
      longitude: -122.4167,
      accuracy: 6,
      timestamp: Date.now() - 45000,
      address: 'Union Square, San Francisco, CA'
    }
  },
  {
    id: 'user_zayn',
    name: 'Zayn Malik',
    email: 'zayn.m@soundwave.net',
    phone: '+1 555-0377',
    avatarUrl: LUXURY_AVATARS[3],
    bio: 'Music Producer & Traveler.',
    role: 'user',
    createdAt: '2026-03-01T15:45:00.000Z',
    isOnline: true,
    isSharing: true,
    currentLocation: {
      latitude: 37.8012,
      longitude: -122.4014,
      accuracy: 12,
      timestamp: Date.now() - 90000,
      address: 'Pier 39 / Embarcadero, San Francisco, CA'
    }
  },
  {
    id: 'user_elena',
    name: 'Elena Rostova',
    email: 'elena.rostova@gemini.corp',
    phone: '+1 555-0466',
    avatarUrl: LUXURY_AVATARS[2],
    bio: 'Architect & Urban Planner.',
    role: 'user',
    createdAt: '2026-03-20T09:10:00.000Z',
    isOnline: false,
    isSharing: false,
    currentLocation: {
      latitude: 37.7694,
      longitude: -122.4467,
      accuracy: 15,
      timestamp: Date.now() - 420000,
      address: 'Buena Vista Park, San Francisco, CA'
    }
  }
];

const INITIAL_FRIENDSHIPS: Friendship[] = [
  {
    id: 'fship_1',
    requesterId: 'user_afzaal_founder',
    recipientId: 'user_sophia',
    status: 'accepted',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5
  },
  {
    id: 'fship_2',
    requesterId: 'user_afzaal_founder',
    recipientId: 'user_zayn',
    status: 'accepted',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3
  },
  {
    id: 'fship_3',
    requesterId: 'user_elena',
    recipientId: 'user_afzaal_founder',
    status: 'pending',
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2
  }
];

const INITIAL_SESSIONS: LocationShareSession[] = [
  {
    id: 'sess_sophia_live',
    userId: 'user_sophia',
    userName: 'Sophia Vance',
    userAvatar: LUXURY_AVATARS[0],
    targetType: 'all_friends',
    allowedFriendIds: ['user_afzaal_founder'],
    durationMinutes: 60,
    startedAt: Date.now() - 15 * 60 * 1000,
    expiresAt: Date.now() + 45 * 60 * 1000,
    isActive: true,
    lastLocation: {
      latitude: 37.7833,
      longitude: -122.4167,
      accuracy: 6,
      timestamp: Date.now() - 45000,
      address: 'Union Square, San Francisco, CA'
    }
  },
  {
    id: 'sess_zayn_live',
    userId: 'user_zayn',
    userName: 'Zayn Malik',
    userAvatar: LUXURY_AVATARS[3],
    targetType: 'all_friends',
    allowedFriendIds: ['user_afzaal_founder'],
    durationMinutes: 480,
    startedAt: Date.now() - 60 * 60 * 1000,
    expiresAt: Date.now() + 420 * 60 * 1000,
    isActive: true,
    lastLocation: {
      latitude: 37.8012,
      longitude: -122.4014,
      accuracy: 12,
      timestamp: Date.now() - 90000,
      address: 'Pier 39, San Francisco, CA'
    }
  }
];

// BroadcastChannel for instant real-time multi-tab and multi-device synchronization
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('afzaal_share_sync') 
  : null;

class StorageService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initDefaults();
    if (syncChannel) {
      syncChannel.onmessage = () => {
        this.notifyListeners();
      };
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => {
        this.notifyListeners();
      });
    }
  }

  private initDefaults() {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(USERS_STORAGE_KEY)) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(FRIENDSHIPS_STORAGE_KEY)) {
      localStorage.setItem(FRIENDSHIPS_STORAGE_KEY, JSON.stringify(INITIAL_FRIENDSHIPS));
    }
    if (!localStorage.getItem(SESSIONS_STORAGE_KEY)) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(INITIAL_SESSIONS));
    }
    if (!localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)) {
      const initialNotifs: AppNotification[] = [
        {
          id: 'notif_welcome',
          userId: 'user_afzaal_founder',
          type: 'security_alert',
          title: 'Welcome to AFZAAL LOCATION SHARE',
          message: 'Zero-knowledge tracking policy is active. Your GPS is only queried when you explicitly grant permission.',
          timestamp: Date.now() - 86400000,
          read: false
        },
        {
          id: 'notif_elena_invite',
          userId: 'user_afzaal_founder',
          type: 'friend_request',
          title: 'New Friend Invitation',
          message: 'Elena Rostova (+1 555-0466) sent you a friend request.',
          timestamp: Date.now() - 3600000 * 2,
          read: false,
          metadata: { friendId: 'user_elena', friendName: 'Elena Rostova' }
        },
        {
          id: 'notif_sophia_share',
          userId: 'user_afzaal_founder',
          type: 'share_started',
          title: 'Sophia Vance is sharing location',
          message: 'Sophia Vance started sharing live location with you for 1 hour.',
          timestamp: Date.now() - 15 * 60 * 1000,
          read: true,
          metadata: { friendId: 'user_sophia', friendName: 'Sophia Vance' }
        }
      ];
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(initialNotifs));
    }
    if (!localStorage.getItem(CURRENT_USER_KEY)) {
      // Default to Afzaal Tariq
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(INITIAL_USERS[0]));
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => {
      try { cb(); } catch (e) { console.error(e); }
    });
  }

  private broadcast() {
    if (syncChannel) {
      syncChannel.postMessage({ type: 'SYNC_UPDATE', timestamp: Date.now() });
    }
    this.notifyListeners();
  }

  // --- Users & Auth ---
  public getUsers(): UserProfile[] {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_USERS;
  }

  public getCurrentUser(): UserProfile | null {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  public setCurrentUser(user: UserProfile | null) {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      // update in users array
      const users = this.getUsers().map(u => u.id === user.id ? user : u);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    this.broadcast();
  }

  public loginWithEmail(email: string): UserProfile {
    const users = this.getUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Auto-register convenience
      const name = email.split('@')[0].replace(/[._-]/g, ' ');
      user = {
        id: 'user_' + Math.random().toString(36).substring(2, 9),
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email,
        phone: '+1 555-' + Math.floor(1000 + Math.random() * 9000),
        avatarUrl: LUXURY_AVATARS[Math.floor(Math.random() * LUXURY_AVATARS.length)],
        bio: 'Member of Afzaal Location Share network.',
        role: email.includes('admin') || email.includes('m39966944') ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
        isOnline: true,
        isSharing: false
      };
      users.push(user);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
    this.setCurrentUser(user);
    this.logPrivacyAction(user.id, 'USER_LOGIN', `Logged in via email: ${email}`);
    return user;
  }

  public signUp(name: string, email: string, phone: string, avatarUrl?: string): UserProfile {
    const users = this.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const newUser: UserProfile = {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      avatarUrl: avatarUrl || LUXURY_AVATARS[Math.floor(Math.random() * LUXURY_AVATARS.length)],
      bio: 'Privacy conscious location sharing user.',
      role: email.includes('admin') || email.includes('m39966944') ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
      isOnline: true,
      isSharing: false
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    this.setCurrentUser(newUser);
    this.logPrivacyAction(newUser.id, 'USER_REGISTER', `Created account with phone: ${phone}`);
    return newUser;
  }

  public updateProfile(updates: Partial<UserProfile>): UserProfile {
    const current = this.getCurrentUser();
    if (!current) throw new Error('Not logged in');

    const updated: UserProfile = { ...current, ...updates };
    this.setCurrentUser(updated);
    this.logPrivacyAction(current.id, 'PROFILE_UPDATE', 'Updated personal profile details');
    return updated;
  }

  public switchUser(userId: string): UserProfile | null {
    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (target) {
      this.setCurrentUser(target);
      return target;
    }
    return null;
  }

  // --- Search Users by Phone (Privacy-safe) ---
  public searchUserByPhone(phoneQuery: string): { user: UserProfile | null; message?: string } {
    const cleaned = phoneQuery.replace(/[\s\-\(\)]/g, '').toLowerCase();
    if (!cleaned || cleaned.length < 4) {
      return { user: null, message: 'Please enter a valid phone number (at least 4 digits)' };
    }

    const current = this.getCurrentUser();
    const users = this.getUsers();
    
    // Find matching user
    const found = users.find(u => {
      if (current && u.id === current.id) return false;
      const uClean = u.phone.replace(/[\s\-\(\)]/g, '').toLowerCase();
      return uClean.includes(cleaned);
    });

    if (!found) {
      return { user: null, message: 'No registered user found with this phone number.' };
    }

    // PRIVACY NOTICE: Location is NEVER exposed via phone search alone!
    const sanitizedSafeProfile: UserProfile = {
      id: found.id,
      name: found.name,
      email: found.email,
      phone: found.phone,
      avatarUrl: found.avatarUrl,
      bio: found.bio,
      role: found.role,
      createdAt: found.createdAt,
      isOnline: found.isOnline,
      isSharing: false, // hidden
      currentLocation: undefined // explicitly omitted for privacy!
    };

    return { user: sanitizedSafeProfile };
  }

  // --- Friendships ---
  public getFriendships(): Friendship[] {
    const raw = localStorage.getItem(FRIENDSHIPS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_FRIENDSHIPS;
  }

  public getFriendsForUser(userId: string): { friend: UserProfile; friendship: Friendship }[] {
    const friendships = this.getFriendships();
    const users = this.getUsers();
    const userMap = new Map(users.map(u => [u.id, u]));

    const result: { friend: UserProfile; friendship: Friendship }[] = [];

    friendships.forEach(f => {
      if (f.status === 'accepted') {
        const friendId = f.requesterId === userId ? f.recipientId : (f.recipientId === userId ? f.requesterId : null);
        if (friendId && userMap.has(friendId)) {
          result.push({
            friend: userMap.get(friendId)!,
            friendship: f
          });
        }
      }
    });

    return result;
  }

  public getPendingInvitations(userId: string): { friend: UserProfile; friendship: Friendship; isIncoming: boolean }[] {
    const friendships = this.getFriendships();
    const users = this.getUsers();
    const userMap = new Map(users.map(u => [u.id, u]));

    const result: { friend: UserProfile; friendship: Friendship; isIncoming: boolean }[] = [];

    friendships.forEach(f => {
      if (f.status === 'pending') {
        if (f.recipientId === userId) {
          const sender = userMap.get(f.requesterId);
          if (sender) {
            result.push({ friend: sender, friendship: f, isIncoming: true });
          }
        } else if (f.requesterId === userId) {
          const recipient = userMap.get(f.recipientId);
          if (recipient) {
            result.push({ friend: recipient, friendship: f, isIncoming: false });
          }
        }
      }
    });

    return result;
  }

  public sendFriendInvitation(targetUserId: string): Friendship {
    const current = this.getCurrentUser();
    if (!current) throw new Error('Not logged in');
    if (current.id === targetUserId) throw new Error('You cannot add yourself');

    const friendships = this.getFriendships();
    const existing = friendships.find(f => 
      (f.requesterId === current.id && f.recipientId === targetUserId) ||
      (f.requesterId === targetUserId && f.recipientId === current.id)
    );

    if (existing) {
      if (existing.status === 'accepted') throw new Error('Already friends');
      if (existing.status === 'pending') throw new Error('An invitation is already pending');
    }

    const newFriendship: Friendship = {
      id: 'fship_' + Math.random().toString(36).substring(2, 9),
      requesterId: current.id,
      recipientId: targetUserId,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    friendships.push(newFriendship);
    localStorage.setItem(FRIENDSHIPS_STORAGE_KEY, JSON.stringify(friendships));

    // Send notification to recipient
    this.addNotification({
      userId: targetUserId,
      type: 'friend_request',
      title: 'New Friend Invitation',
      message: `${current.name} (${current.phone}) wants to connect for secure location sharing.`,
      metadata: { friendId: current.id, friendName: current.name }
    });

    this.logPrivacyAction(current.id, 'FRIEND_INVITATION_SENT', `Sent friend invitation to user ${targetUserId}`);
    this.broadcast();
    return newFriendship;
  }

  public respondToFriendInvitation(friendshipId: string, accept: boolean) {
    const current = this.getCurrentUser();
    if (!current) throw new Error('Not logged in');

    const friendships = this.getFriendships();
    const index = friendships.findIndex(f => f.id === friendshipId);
    if (index === -1) throw new Error('Invitation not found');

    const f = friendships[index];
    if (accept) {
      f.status = 'accepted';
      f.updatedAt = Date.now();
      // Notify sender
      this.addNotification({
        userId: f.requesterId,
        type: 'friend_accepted',
        title: 'Invitation Accepted!',
        message: `${current.name} accepted your friend request. You can now share locations mutually.`,
        metadata: { friendId: current.id, friendName: current.name }
      });
    } else {
      f.status = 'rejected';
      f.updatedAt = Date.now();
    }

    localStorage.setItem(FRIENDSHIPS_STORAGE_KEY, JSON.stringify(friendships));
    this.logPrivacyAction(current.id, accept ? 'FRIEND_ACCEPTED' : 'FRIEND_REJECTED', `Handled friend invitation ${friendshipId}`);
    this.broadcast();
  }

  public removeFriend(friendUserId: string) {
    const current = this.getCurrentUser();
    if (!current) throw new Error('Not logged in');

    let friendships = this.getFriendships();
    friendships = friendships.filter(f => 
      !((f.requesterId === current.id && f.recipientId === friendUserId) ||
        (f.requesterId === friendUserId && f.recipientId === current.id))
    );
    localStorage.setItem(FRIENDSHIPS_STORAGE_KEY, JSON.stringify(friendships));

    // Also stop any sharing sessions between them immediately!
    this.revokeSharingWithFriend(friendUserId);

    this.logPrivacyAction(current.id, 'FRIEND_REMOVED', `Removed friend ${friendUserId} and revoked all permissions.`);
    this.broadcast();
  }

  // --- Location Sharing Sessions ---
  public getSessions(): LocationShareSession[] {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    const sessions: LocationShareSession[] = raw ? JSON.parse(raw) : INITIAL_SESSIONS;
    
    // Auto-expire
    const now = Date.now();
    let updated = false;
    sessions.forEach(s => {
      if (s.isActive && s.expiresAt && s.expiresAt < now) {
        s.isActive = false;
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    }
    return sessions;
  }

  public getActiveSessionForUser(userId: string): LocationShareSession | null {
    const sessions = this.getSessions();
    return sessions.find(s => s.userId === userId && s.isActive) || null;
  }

  public getSharedLocationsVisibleToUser(userId: string): LocationShareSession[] {
    const sessions = this.getSessions();
    const friends = this.getFriendsForUser(userId).map(f => f.friend.id);

    return sessions.filter(s => {
      if (!s.isActive) return false;
      if (s.userId === userId) return false; // don't duplicate own
      // Must be a confirmed friend
      if (!friends.includes(s.userId)) return false;
      // Must be in allowed list or all friends
      if (s.targetType === 'all_friends') return true;
      return s.allowedFriendIds.includes(userId);
    });
  }

  public startSharingLocation(
    duration: SharingDuration,
    targetType: 'all_friends' | 'specific',
    allowedFriendIds: string[],
    initialLocation: UserLocation
  ): LocationShareSession {
    const current = this.getCurrentUser();
    if (!current) throw new Error('Not logged in');

    // Stop previous active sessions
    this.stopAllSharingForUser(current.id);

    const now = Date.now();
    const expiresAt = duration === -1 ? null : now + duration * 60 * 1000;

    const newSession: LocationShareSession = {
      id: 'sess_' + Math.random().toString(36).substring(2, 9),
      userId: current.id,
      userName: current.name,
      userAvatar: current.avatarUrl,
      targetType,
      allowedFriendIds,
      durationMinutes: duration,
      startedAt: now,
      expiresAt,
      isActive: true,
      lastLocation: initialLocation
    };

    const sessions = this.getSessions();
    sessions.push(newSession);
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));

    // Update current user status
    current.isSharing = true;
    current.currentLocation = initialLocation;
    current.activeSessionId = newSession.id;
    this.setCurrentUser(current);

    // Notify allowed friends
    const friendsToNotify = targetType === 'all_friends' 
      ? this.getFriendsForUser(current.id).map(f => f.friend.id)
      : allowedFriendIds;

    friendsToNotify.forEach(fId => {
      this.addNotification({
        userId: fId,
        type: 'share_started',
        title: `${current.name} is sharing location`,
        message: `${current.name} started live sharing with you ${duration === -1 ? 'until stopped' : `for ${duration} minutes`}.`,
        metadata: { friendId: current.id, friendName: current.name, sessionId: newSession.id }
      });
    });

    this.logPrivacyAction(current.id, 'SHARING_STARTED', `Started location sharing (${duration === -1 ? 'until stopped' : duration + 'm'}) with ${friendsToNotify.length} friends.`);
    this.broadcast();
    return newSession;
  }

  public updateLiveLocation(location: UserLocation) {
    const current = this.getCurrentUser();
    if (!current) return;

    current.currentLocation = location;
    this.setCurrentUser(current);

    const sessions = this.getSessions();
    const active = sessions.find(s => s.userId === current.id && s.isActive);
    if (active) {
      active.lastLocation = location;
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
      this.broadcast();
    }
  }

  public stopSharingLocation(): boolean {
    const current = this.getCurrentUser();
    if (!current) return false;
    return this.stopAllSharingForUser(current.id);
  }

  public stopAllSharingForUser(userId: string): boolean {
    const sessions = this.getSessions();
    let changed = false;

    sessions.forEach(s => {
      if (s.userId === userId && s.isActive) {
        s.isActive = false;
        changed = true;
        // Notify recipients
        s.allowedFriendIds.forEach(fId => {
          this.addNotification({
            userId: fId,
            type: 'share_stopped',
            title: `${s.userName} stopped sharing`,
            message: `${s.userName} has ended their live location sharing session.`,
            metadata: { friendId: userId, friendName: s.userName }
          });
        });
      }
    });

    if (changed) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    }

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      current.isSharing = false;
      current.activeSessionId = null;
      this.setCurrentUser(current);
    }

    this.logPrivacyAction(userId, 'SHARING_STOPPED', 'Stopped all active live location sessions.');
    this.broadcast();
    return changed;
  }

  public revokeSharingWithFriend(friendId: string) {
    const current = this.getCurrentUser();
    if (!current) return;

    const sessions = this.getSessions();
    let updated = false;

    sessions.forEach(s => {
      if (s.userId === current.id && s.isActive) {
        if (s.allowedFriendIds.includes(friendId)) {
          s.allowedFriendIds = s.allowedFriendIds.filter(id => id !== friendId);
          updated = true;
        }
      }
    });

    if (updated) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
      this.broadcast();
    }
  }

  // --- Notifications ---
  public getNotifications(userId: string): AppNotification[] {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notifs: AppNotification[] = raw ? JSON.parse(raw) : [];
    return notifs.filter(n => n.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
  }

  public addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notifs: AppNotification[] = raw ? JSON.parse(raw) : [];
    const item: AppNotification = {
      ...notif,
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      read: false
    };
    notifs.unshift(item);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifs.slice(0, 100)));
    this.broadcast();
  }

  public markNotificationAsRead(notifId: string) {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return;
    const notifs: AppNotification[] = JSON.parse(raw);
    const item = notifs.find(n => n.id === notifId);
    if (item) {
      item.read = true;
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifs));
      this.broadcast();
    }
  }

  public markAllNotificationsAsRead(userId: string) {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return;
    const notifs: AppNotification[] = JSON.parse(raw);
    notifs.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifs));
    this.broadcast();
  }

  // --- User Reports & Admin ---
  public getReports(): UserReport[] {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [
      {
        id: 'rep_1',
        reporterId: 'user_sophia',
        reporterName: 'Sophia Vance',
        reportedUserId: 'user_zayn',
        reportedUserName: 'Zayn Malik',
        reason: 'Duplicate phone invitation test',
        details: 'Sent multiple requests during rehearsal.',
        status: 'pending',
        createdAt: Date.now() - 3600000 * 5
      }
    ];
  }

  public submitReport(reportedUserId: string, reason: string, details: string) {
    const current = this.getCurrentUser();
    if (!current) throw new Error('Not logged in');

    const users = this.getUsers();
    const reported = users.find(u => u.id === reportedUserId);
    if (!reported) throw new Error('User not found');

    const reports = this.getReports();
    const newReport: UserReport = {
      id: 'rep_' + Math.random().toString(36).substring(2, 9),
      reporterId: current.id,
      reporterName: current.name,
      reportedUserId,
      reportedUserName: reported.name,
      reason,
      details,
      status: 'pending',
      createdAt: Date.now()
    };

    reports.unshift(newReport);
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
    this.logPrivacyAction(current.id, 'SUBMIT_REPORT', `Reported user ${reported.name}`);
    this.broadcast();
    return newReport;
  }

  public updateReportStatus(reportId: string, status: 'pending' | 'investigating' | 'resolved') {
    const reports = this.getReports();
    const rep = reports.find(r => r.id === reportId);
    if (rep) {
      rep.status = status;
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
      this.broadcast();
    }
  }

  // Admin user ban/role toggle
  public toggleUserBan(userId: string): boolean {
    const users = this.getUsers();
    const u = users.find(user => user.id === userId);
    if (!u) return false;
    
    // Toggle online / active
    u.isOnline = !u.isOnline;
    if (!u.isOnline) {
      // Force kill sharing if banned
      this.stopAllSharingForUser(userId);
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    this.broadcast();
    return true;
  }

  public toggleUserRole(userId: string): UserProfile | null {
    const users = this.getUsers();
    const u = users.find(user => user.id === userId);
    if (!u) return null;
    u.role = u.role === 'admin' ? 'user' : 'admin';
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    this.broadcast();
    return u;
  }

  // --- Audit Log ---
  public getAuditLogs(userId?: string): PrivacyAuditLog[] {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    const logs: PrivacyAuditLog[] = raw ? JSON.parse(raw) : [];
    if (userId) {
      return logs.filter(l => l.userId === userId).slice(0, 50);
    }
    return logs.slice(0, 50);
  }

  public logPrivacyAction(userId: string, action: string, details: string) {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    const logs: PrivacyAuditLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift({
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      userId,
      action,
      details,
      timestamp: Date.now(),
      ipMasked: '192.168.***.*** (Encrypted)'
    });
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs.slice(0, 100)));
  }

  // --- Custom Firebase Config Saver ---
  public getCustomFirebaseConfig(): string | null {
    return localStorage.getItem(FIREBASE_CONFIG_KEY);
  }

  public saveCustomFirebaseConfig(configString: string) {
    localStorage.setItem(FIREBASE_CONFIG_KEY, configString);
    this.broadcast();
  }
}

export const storageService = new StorageService();
