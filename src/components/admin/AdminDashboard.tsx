import React, { useState } from 'react';
import { UserProfile, PendingApproval, Announcement } from '../../types';
import { UserApprovals } from './UserApprovals';
import { NationalCapacityAnalytics } from './NationalCapacityAnalytics';
import { AnnouncementCenter } from './AnnouncementCenter';
import { PersonnelProfilesDirectory } from './PersonnelProfilesDirectory';
import { LivePresenceHUD } from './LivePresenceHUD';
import { 
  ShieldAlert, 
  BarChart3, 
  Megaphone, 
  Users, 
  CheckCircle2, 
  Building2, 
  Fingerprint,
  GraduationCap,
  Award,
  Activity,
  Radio
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: UserProfile;
  approvals: PendingApproval[];
  announcements: Announcement[];
  onApproveUser: (id: string) => void;
  onRejectUser: (id: string) => void;
  onAddAnnouncement: (ann: Announcement) => void;
  onTogglePinAnnouncement: (id: string) => void;
  onDeleteAnnouncement: (id: string) => void;
  onSignOut?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  approvals,
  announcements,
  onApproveUser,
  onRejectUser,
  onAddAnnouncement,
  onTogglePinAnnouncement,
  onDeleteAnnouncement,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<'presence' | 'analytics' | 'approvals' | 'directory' | 'announcements'>('presence');

  const pendingCount = approvals.filter((a) => a.status === 'Pending').length;

  return (
    <div className="min-h-[calc(100vh-80px)] p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto max-w-full overflow-x-hidden">
      
      {/* Overview Stat Cards with High Organizational Scaling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Trained Scientists</span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">4,980+</div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">3,420+ Certified Officers</p>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Research Theses</span>
            <GraduationCap className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">184+ Advanced</div>
          <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-1 font-medium">430+ PG Fellow Dissertations</p>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Pending Approvals</span>
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{pendingCount}</div>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-medium">{approvals.length} total verification requests</p>
        </div>

        <div 
          id="admin-overview-institutes-card"
          className="liquid-glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Affiliated Institutes</span>
            <Building2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">5 Apex</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              iGOT: 4 Synced
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium truncate">IMD, INCOIS, IITM, NCMRWF, NCPOR</p>
        </div>
      </div>

      {/* Admin Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 liquid-glass max-w-full overflow-x-auto pb-1">
        <button
          id="admin-tab-presence"
          type="button"
          onClick={() => setActiveTab('presence')}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'presence'
              ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>Live Presence HUD</span>
        </button>

        <button
          id="admin-tab-analytics"
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>National Capacity Analytics</span>
        </button>

        <button
          id="admin-tab-approvals"
          type="button"
          onClick={() => setActiveTab('approvals')}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'approvals'
              ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Approvals Queue</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-mono font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          id="admin-tab-directory"
          type="button"
          onClick={() => setActiveTab('directory')}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'directory'
              ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Faculty & Trainee Academic Dossiers</span>
        </button>

        <button
          id="admin-tab-announcements"
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'announcements'
              ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Announcement Center</span>
        </button>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'presence' && (
        <LivePresenceHUD />
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <NationalCapacityAnalytics />
        </div>
      )}

      {activeTab === 'approvals' && (
        <UserApprovals
          approvals={approvals}
          onApprove={onApproveUser}
          onReject={onRejectUser}
        />
      )}

      {activeTab === 'directory' && (
        <PersonnelProfilesDirectory />
      )}

      {activeTab === 'announcements' && (
        <AnnouncementCenter
          announcements={announcements}
          onAddAnnouncement={onAddAnnouncement}
          onTogglePin={onTogglePinAnnouncement}
          onDeleteAnnouncement={onDeleteAnnouncement}
        />
      )}

    </div>
  );
};

