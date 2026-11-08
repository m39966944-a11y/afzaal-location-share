import React from 'react';
import { AppNotification } from '../../types';
import { storageService } from '../../services/storageService';
import { 
  Bell, 
  CheckCheck, 
  Radio, 
  UserPlus, 
  ShieldAlert, 
  X, 
  Clock,
  ArrowRight
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  currentUserId: string;
  onOpenFriends?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  currentUserId,
  onOpenFriends
}) => {
  if (!isOpen) return null;

  const handleMarkAll = () => {
    storageService.markAllNotificationsAsRead(currentUserId);
  };

  const handleClickItem = (n: AppNotification) => {
    storageService.markNotificationAsRead(n.id);
    if (n.type === 'friend_request' && onOpenFriends) {
      onOpenFriends();
      onClose();
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'share_started':
        return <Radio className="w-4 h-4 text-emerald-400" />;
      case 'share_stopped':
        return <Radio className="w-4 h-4 text-neutral-400" />;
      case 'friend_request':
      case 'friend_accepted':
        return <UserPlus className="w-4 h-4 text-amber-400" />;
      case 'security_alert':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm h-full bg-neutral-950 border-l border-amber-500/30 p-5 shadow-2xl flex flex-col justify-between">
        {/* Top gold bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>

        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-amber-100 font-luxury uppercase tracking-wider">
                Notifications
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {notifications.some(n => !n.read) && (
                <button
                  onClick={handleMarkAll}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Read all
                </button>
              )}
              <button 
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="mt-4 space-y-2.5 max-h-[80vh] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-400" />
                <p className="text-xs">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const minutesAgo = Math.floor((Date.now() - n.timestamp) / 60000);
                const timeStr = minutesAgo <= 0 ? 'Just now' : `${minutesAgo}m ago`;

                return (
                  <div
                    key={n.id}
                    onClick={() => handleClickItem(n)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      !n.read 
                        ? 'bg-neutral-900/90 border-amber-500/40 shadow-sm' 
                        : 'bg-neutral-950/60 border-neutral-800/80 hover:bg-neutral-900/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 p-1 rounded-md bg-neutral-900 border border-neutral-800 shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-neutral-200">{n.title}</h4>
                          <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {timeStr}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{n.message}</p>

                        {n.type === 'friend_request' && (
                          <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-300 font-semibold">
                            <span>Review invitation in Friends tab</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800 text-center">
          <p className="text-[10px] text-neutral-500">
            Real-time encrypted event delivery
          </p>
        </div>
      </div>
    </div>
  );
};
