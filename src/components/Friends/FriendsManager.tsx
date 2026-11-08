import React, { useState } from 'react';
import { UserProfile, Friendship } from '../../types';
import { storageService } from '../../services/storageService';
import { 
  Search, 
  UserPlus, 
  UserCheck, 
  UserX, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Check, 
  X, 
  Radio, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface FriendsManagerProps {
  currentUserId: string;
  friends: { friend: UserProfile; friendship: Friendship }[];
  pendingInvitations: { friend: UserProfile; friendship: Friendship; isIncoming: boolean }[];
  onSelectFriendOnMap?: (friendId: string) => void;
  onOpenShareModal?: () => void;
}

export const FriendsManager: React.FC<FriendsManagerProps> = ({
  currentUserId,
  friends,
  pendingInvitations,
  onSelectFriendOnMap,
  onOpenShareModal
}) => {
  const [phoneQuery, setPhoneQuery] = useState('');
  const [searchResult, setSearchResult] = useState<UserProfile | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneQuery.trim()) return;

    setIsSearching(true);
    setSearchMessage(null);
    setSearchResult(null);

    try {
      const res = storageService.searchUserByPhone(phoneQuery);
      if (res.user) {
        setSearchResult(res.user);
      } else {
        setSearchMessage(res.message || 'No registered user found with this phone number.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendInvite = (targetUserId: string) => {
    try {
      storageService.sendFriendInvitation(targetUserId);
      setActionFeedback('Invitation sent successfully!');
      setSearchResult(null);
      setPhoneQuery('');
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: unknown) {
      setActionFeedback(err instanceof Error ? err.message : 'Failed to send invite');
      setTimeout(() => setActionFeedback(null), 3500);
    }
  };

  const handleRespond = (friendshipId: string, accept: boolean) => {
    storageService.respondToFriendInvitation(friendshipId, accept);
    setActionFeedback(accept ? 'Invitation accepted! You are now friends.' : 'Invitation rejected.');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleRemoveFriend = (friendId: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name}? This will immediately revoke any active location sharing sessions between both of you.`)) {
      storageService.removeFriend(friendId);
      setActionFeedback(`Removed ${name}.`);
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const isAlreadyFriend = (userId: string) => friends.some(f => f.friend.id === userId);
  const isAlreadyPending = (userId: string) => pendingInvitations.some(p => p.friend.id === userId);

  return (
    <div className="space-y-6">
      {/* Search by Phone Banner */}
      <div className="p-5 rounded-2xl bg-neutral-900/90 border border-amber-500/30 shadow-xl">
        <div className="flex items-center gap-2.5 mb-3">
          <Phone className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm text-amber-100 font-luxury uppercase tracking-wider">
            Find & Add Friends by Phone Number
          </h3>
        </div>
        <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
          Search for registered contacts. Due to strict security, a phone number alone never reveals any user's location. Location sharing is only enabled after mutual approval.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value)}
              placeholder="e.g. +1 555-0288 or 555"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !phoneQuery.trim()}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl shadow transition disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Search Result Card */}
        {searchResult && (
          <div className="mt-4 p-4 rounded-xl bg-neutral-950 border border-amber-500/40 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <img src={searchResult.avatarUrl} className="w-11 h-11 rounded-full object-cover border border-amber-400" />
              <div>
                <h4 className="font-bold text-sm text-amber-100">{searchResult.name}</h4>
                <div className="text-xs text-neutral-400">{searchResult.phone}</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">Registered User</div>
              </div>
            </div>
            <div>
              {isAlreadyFriend(searchResult.id) ? (
                <span className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-400 text-xs font-semibold flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Friends
                </span>
              ) : isAlreadyPending(searchResult.id) ? (
                <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-semibold">
                  Invitation Pending
                </span>
              ) : (
                <button
                  onClick={() => handleSendInvite(searchResult.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold shadow transition active:scale-95"
                >
                  <UserPlus className="w-4 h-4 text-black" />
                  Send Invite
                </button>
              )}
            </div>
          </div>
        )}

        {searchMessage && (
          <div className="mt-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{searchMessage}</span>
          </div>
        )}

        {actionFeedback && (
          <div className="mt-3 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}
      </div>

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-amber-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-amber-200 font-luxury uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              Pending Invitations ({pendingInvitations.length})
            </h3>
          </div>
          <div className="space-y-2.5">
            {pendingInvitations.map(({ friend, friendship, isIncoming }) => (
              <div 
                key={friendship.id}
                className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img src={friend.avatarUrl} className="w-10 h-10 rounded-full object-cover border border-amber-500/40" />
                  <div>
                    <h4 className="font-bold text-xs text-neutral-200">{friend.name}</h4>
                    <p className="text-[11px] text-neutral-400">{friend.phone}</p>
                    <span className="text-[10px] text-amber-400/80">
                      {isIncoming ? 'Sent you an invitation' : 'Waiting for their response'}
                    </span>
                  </div>
                </div>
                {isIncoming ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRespond(friendship.id, true)}
                      className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center gap-1"
                      title="Accept"
                    >
                      <Check className="w-4 h-4 text-black" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespond(friendship.id, false)}
                      className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition"
                      title="Decline"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-neutral-500 italic">Sent</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Friends List */}
      <div className="p-5 rounded-2xl bg-neutral-900/90 border border-amber-500/30 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-amber-100 font-luxury uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-400" />
              Friends Circle ({friends.length})
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">Authorized contacts who can mutually share live GPS</p>
          </div>
          {onOpenShareModal && (
            <button
              onClick={onOpenShareModal}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5 text-black" />
              Share Now
            </button>
          )}
        </div>

        {friends.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 bg-neutral-950/60 rounded-xl border border-neutral-800">
            <UserPlus className="w-8 h-8 text-amber-500/40 mx-auto mb-2" />
            <p className="text-xs">You have not added any friends yet.</p>
            <p className="text-[11px] text-neutral-500 mt-1">Use the phone search above to invite friends to Afzaal Location Share.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {friends.map(({ friend }) => {
              const activeSession = storageService.getActiveSessionForUser(friend.id);
              const isLive = !!activeSession;

              return (
                <div
                  key={friend.id}
                  className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/90 hover:border-amber-500/40 transition flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={friend.avatarUrl} className="w-11 h-11 rounded-full object-cover border border-amber-400" />
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${friend.isOnline ? 'bg-emerald-500' : 'bg-neutral-600'}`}></span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-amber-100 flex items-center gap-1.5">
                          {friend.name}
                          {friend.role === 'admin' && (
                            <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-bold uppercase">Admin</span>
                          )}
                        </h4>
                        <p className="text-xs text-neutral-400">{friend.phone}</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5 line-clamp-1">{friend.bio || 'Member'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveFriend(friend.id, friend.name)}
                      className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg transition"
                      title="Remove Friend"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status & Actions */}
                  <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center justify-between">
                    <div>
                      {isLive ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          <span>Sharing Location</span>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-500">Not currently sharing</span>
                      )}
                    </div>

                    {isLive && onSelectFriendOnMap && (
                      <button
                        onClick={() => onSelectFriendOnMap(friend.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        View on Map
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
