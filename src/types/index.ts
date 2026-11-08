export type UserRole = 'user' | 'admin';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number; // in meters
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
  address?: string;
  street?: string;
  town?: string;
  city?: string;
  area?: string;
  district?: string;
  province?: string;
  country?: string;
  formattedAddress?: string;
}

export type PlaceCategory = 
  | 'mosque' 
  | 'hospital' 
  | 'school' 
  | 'restaurant' 
  | 'fuel' 
  | 'park' 
  | 'atm' 
  | 'shop' 
  | 'all'
  | 'other';

export interface NearbyPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  address?: string;
  distanceMeters?: number;
  cuisine?: string;
  openingHours?: string;
  phone?: string;
  website?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  bio?: string;
  role: UserRole;
  createdAt: string;
  isOnline: boolean;
  isSharing: boolean;
  activeSessionId?: string | null;
  currentLocation?: UserLocation;
}

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

export interface Friendship {
  id: string;
  requesterId: string;
  recipientId: string;
  status: FriendshipStatus;
  createdAt: number;
  updatedAt: number;
}

export type SharingDuration = 15 | 60 | 480 | -1; // -1 = Until manually stopped

export interface LocationShareSession {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  targetType: 'all_friends' | 'specific';
  allowedFriendIds: string[]; // only these friends can decrypt / view location
  durationMinutes: SharingDuration;
  startedAt: number;
  expiresAt: number | null; // null if manual stop
  isActive: boolean;
  lastLocation: UserLocation;
}

export type NotificationType = 
  | 'friend_request' 
  | 'friend_accepted' 
  | 'share_started' 
  | 'share_stopped' 
  | 'share_request' 
  | 'security_alert';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  metadata?: {
    friendId?: string;
    friendName?: string;
    sessionId?: string;
  };
}

export interface UserReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: string;
  details: string;
  status: 'pending' | 'investigating' | 'resolved';
  createdAt: number;
}

export interface PrivacyAuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: number;
  ipMasked?: string;
}
