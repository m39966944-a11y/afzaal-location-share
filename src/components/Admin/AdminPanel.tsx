import React, { useState } from 'react';
import { UserProfile, UserReport, LocationShareSession } from '../../types';
import { storageService } from '../../services/storageService';
import { 
  Shield, 
  Users, 
  Radio, 
  AlertTriangle, 
  CheckCircle, 
  Ban, 
  Unlock, 
  Lock, 
  EyeOff, 
  TrendingUp, 
  Clock, 
  FileText,
  UserCheck
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: UserProfile;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports' | 'security'>('overview');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const allUsers = storageService.getUsers();
  const allSessions = storageService.getSessions();
  const allReports = storageService.getReports();
  const allFriendships = storageService.getFriendships();
  const auditLogs = storageService.getAuditLogs();

  const activeSessionsCount = allSessions.filter(s => s.isActive).length;
  const pendingReportsCount = allReports.filter(r => r.status === 'pending').length;

  const handleToggleBan = (userId: string, name: string) => {
    storageService.toggleUserBan(userId);
    setActionNotice(`Updated account status for ${name}.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleToggleRole = (userId: string) => {
    storageService.toggleUserRole(userId);
    setActionNotice(`Updated user role permissions.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleResolveReport = (reportId: string) => {
    storageService.updateReportStatus(reportId, 'resolved');
    setActionNotice('Report marked as resolved.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Admin Notice Banner regarding strict privacy */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 shadow-lg">
        <EyeOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <span className="font-bold text-amber-300">Privacy Shield Enforced:</span> As an administrator, you manage user accounts and system safety. In compliance with the AFZAAL LOCATION SHARE privacy charter, admins cannot secretly view or intercept private live GPS locations.
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-neutral-900 border border-amber-400 rounded-xl text-amber-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition shrink-0 ${
            activeTab === 'overview' ? 'bg-amber-500 text-black shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          System Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition shrink-0 ${
            activeTab === 'users' ? 'bg-amber-500 text-black shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Registered Accounts ({allUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition shrink-0 ${
            activeTab === 'reports' ? 'bg-amber-500 text-black shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          User Reports ({pendingReportsCount})
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition shrink-0 ${
            activeTab === 'security' ? 'bg-amber-500 text-black shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Audit Logs
        </button>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Total Users
              </div>
              <div className="text-2xl font-bold font-luxury text-amber-100">{allUsers.length}</div>
              <div className="text-[10px] text-emerald-400 mt-1">100% verified identities</div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                Active Broadcasts
              </div>
              <div className="text-2xl font-bold font-luxury text-emerald-300">{activeSessionsCount}</div>
              <div className="text-[10px] text-neutral-400 mt-1">Encrypted GPS streams</div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                Friendships
              </div>
              <div className="text-2xl font-bold font-luxury text-amber-100">{allFriendships.length}</div>
              <div className="text-[10px] text-neutral-400 mt-1">Mutual trust links</div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Pending Reports
              </div>
              <div className="text-2xl font-bold font-luxury text-amber-200">{pendingReportsCount}</div>
              <div className="text-[10px] text-neutral-400 mt-1">Safety monitoring</div>
            </div>
          </div>

          {/* Active Sessions Monitor */}
          <div className="p-5 rounded-2xl bg-neutral-900/90 border border-amber-500/20">
            <h4 className="font-bold text-xs uppercase tracking-wider text-amber-200 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Session Activity (Aggregated Telemetry)
            </h4>
            <div className="space-y-2">
              {allSessions.filter(s => s.isActive).map(sess => (
                <div key={sess.id} className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <img src={sess.userAvatar} className="w-8 h-8 rounded-full object-cover border border-amber-400" />
                    <div>
                      <span className="font-semibold text-neutral-200">{sess.userName}</span>
                      <div className="text-[10px] text-neutral-400">
                        Broadcasting to: {sess.targetType === 'all_friends' ? 'All Confirmed Friends' : `${sess.allowedFriendIds.length} Friends`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                      ACTIVE
                    </span>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      {sess.durationMinutes === -1 ? 'Manual stop' : `${sess.durationMinutes}m duration`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-amber-500/20">
          <h4 className="font-bold text-xs uppercase tracking-wider text-amber-200 mb-3">
            Registered Network Accounts
          </h4>
          <div className="space-y-2.5">
            {allUsers.map(u => (
              <div key={u.id} className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <img src={u.avatarUrl} className="w-10 h-10 rounded-full object-cover border border-amber-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-100">{u.name}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                    <div className="text-neutral-400 text-[11px]">{u.email} • {u.phone}</div>
                    <div className="text-[10px] text-neutral-500">Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleRole(u.id)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] transition"
                  >
                    Toggle Role
                  </button>
                  <button
                    onClick={() => handleToggleBan(u.id, u.name)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                      u.isOnline ? 'bg-red-950/60 text-red-300 hover:bg-red-900/80 border border-red-500/30' : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/80 border border-emerald-500/30'
                    }`}
                  >
                    {u.isOnline ? 'Suspend' : 'Reactivate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Reports */}
      {activeTab === 'reports' && (
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-amber-500/20">
          <h4 className="font-bold text-xs uppercase tracking-wider text-amber-200 mb-3">
            Safety & Abuse Reports
          </h4>
          {allReports.length === 0 ? (
            <p className="text-xs text-neutral-400 py-4 text-center">No reports submitted.</p>
          ) : (
            <div className="space-y-3">
              {allReports.map(rep => (
                <div key={rep.id} className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-neutral-200">
                      Report by <span className="text-amber-300">{rep.reporterName}</span> against <span className="text-red-300">{rep.reportedUserName}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      rep.status === 'resolved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}>
                      {rep.status}
                    </span>
                  </div>
                  <div className="text-neutral-400 text-[11px] mb-2">{rep.reason}: {rep.details}</div>
                  {rep.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolveReport(rep.id)}
                      className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === 'security' && (
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-amber-500/20">
          <h4 className="font-bold text-xs uppercase tracking-wider text-amber-200 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            Security & Permission Audit Trail
          </h4>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {auditLogs.map(log => (
              <div key={log.id} className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-900 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-[10px] text-amber-400 font-bold uppercase">{log.action}</span>
                  <div className="text-[11px] text-neutral-300">{log.details}</div>
                </div>
                <div className="text-[10px] text-neutral-500 text-right">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
