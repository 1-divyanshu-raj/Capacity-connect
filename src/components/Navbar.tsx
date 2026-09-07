import React, { useState } from 'react';
import { UserProfile, GlobalAnnouncement } from '../types';
import { 
  LogOut, 
  Radio,
  Sun,
  Moon,
  ChevronDown,
  User,
  ShieldCheck,
  Award,
  Menu,
  X,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { sound } from '../utils/soundEffects';

interface NavbarProps {
  currentUser: UserProfile;
  onLogout?: () => void;
  onSignOut?: () => void;
  announcements: GlobalAnnouncement[];
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentUser, 
  onLogout, 
  onSignOut,
  announcements,
  theme = 'light',
  onToggleTheme
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pinnedAnnouncement = announcements.find(a => a.isPinned) || announcements[0];

  const handleSignOutAction = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    sound.playClick();
    setIsProfileMenuOpen(false);
    setIsMobileNavOpen(false);
    if (onSignOut) {
      onSignOut();
    } else if (onLogout) {
      onLogout();
    }
  };

  const handleThemeToggleAction = () => {
    sound.playToggle();
    if (onToggleTheme) {
      onToggleTheme();
    }
  };

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'trainee':
        return {
          label: 'Trainee Learner',
          bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300',
          dot: 'bg-rose-400'
        };
      case 'trainer':
        return {
          label: 'Faculty Trainer',
          bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300',
          dot: 'bg-amber-500'
        };
      case 'admin':
        return {
          label: 'National Admin',
          bg: 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-900 dark:text-red-300',
          dot: 'bg-red-500'
        };
    }
  };

  const badge = getRoleBadge();

  return (
    <header className="sticky top-0 z-40 w-full transition-colors duration-200">
      {/* Top Gov Tricolor Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-600 shadow-sm" />

      {/* Global Live Ticker Bar */}
      {pinnedAnnouncement && (
        <div className="bg-gradient-to-r from-slate-900 via-rose-950/80 to-slate-900 text-white text-xs px-3 sm:px-4 py-1.5 flex items-center justify-between border-b border-rose-500/20 shadow-xs">
          <div className="flex items-center gap-2 max-w-4xl truncate">
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-700/50 shrink-0">
              <Radio className="w-3 h-3 text-rose-400 animate-pulse" /> Live Broadcast
            </span>
            <span className="font-semibold text-rose-100 truncate">
              {pinnedAnnouncement.title}:
            </span>
            <span className="text-slate-300 text-[11px] truncate hidden md:inline">
              {pinnedAnnouncement.content}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-[10px] text-slate-300">
            <span className="hidden sm:inline font-mono text-rose-400">MoES Central Dispatch</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
        </div>
      )}

      {/* Main Glass Navbar */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-[14px] border-b border-[#e2e8f0] dark:border-slate-800/80 px-3 sm:px-4 lg:px-8 py-2.5 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-rose-500 flex items-center justify-center text-white font-bold text-base shadow-md shadow-rose-500/25 shrink-0">
              CC
            </div>
            
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-[16px] sm:text-[18px] font-extrabold tracking-tight text-[#1e293b] dark:text-white leading-tight">
                  CAPACITY <span className="text-rose-500 dark:text-rose-400">CONNECT</span>
                </h1>
                <div className="hidden lg:inline-flex items-center text-[10px] bg-[#f1f5f9] dark:bg-slate-800 px-2 py-0.5 rounded-full text-[#475569] dark:text-slate-300 font-semibold border border-slate-200/60 dark:border-slate-700">
                  V2.0.75-SECURE
                </div>
              </div>
              <p className="text-[9px] sm:text-[10px] text-[#64748b] dark:text-slate-400 uppercase tracking-wider font-semibold">
                Ministry of Earth Sciences | IMD
              </p>
            </div>
          </div>

          {/* Center: Global iGOT Karmayogi & API Gateway Status Pill */}
          <div className="hidden sm:flex items-center gap-2">
            <div 
              id="navbar-igot-gateway-status-pill"
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300/80 dark:border-emerald-700/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold shadow-xs tracking-tight"
              title="Direct bi-directional synchronisation with Government of India iGOT Karmayogi API Gateway"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="whitespace-nowrap">iGOT API Gateway: Connected</span>
            </div>

            <div 
              id="navbar-igot-aligned-pill"
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-[11px] font-bold shadow-xs tracking-tight"
              title="Compliant with National Capacity Building Commission (CBC) iGOT Karmayogi Standards"
            >
              <Award className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="whitespace-nowrap">iGOT Karmayogi Aligned</span>
            </div>
          </div>

          {/* User Profile, Theme Switcher & Sign Out (Desktop) */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Light / Dark Mode Toggle Switch (Desktop & Tablet) */}
            {onToggleTheme && (
              <button
                id="navbar-theme-toggle-btn"
                type="button"
                onClick={handleThemeToggleAction}
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-xl border text-xs font-semibold bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-4 h-4 text-rose-500" />
                    <span className="hidden lg:inline ml-1.5">Dark</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="hidden lg:inline ml-1.5">Light</span>
                  </>
                )}
              </button>
            )}

            {/* Role Badge (Desktop) */}
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${badge.bg}`}>
              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
              <span className="whitespace-nowrap">{badge.label}</span>
            </div>

            {/* Desktop User Profile Capsule & Sign Out Controls */}
            <div className="hidden md:flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                }}
                className="flex items-center gap-2 text-left cursor-pointer group rounded-xl p-1 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition min-h-[44px]"
                title="Account menu"
              >
                <div className="relative shrink-0">
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.fullName} 
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 group-hover:border-rose-300 transition"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                </div>

                <div className="hidden lg:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                      {currentUser.fullName}
                    </span>
                    <span className="font-mono text-[10px] text-rose-700 dark:text-rose-300 font-bold bg-rose-50 dark:bg-rose-950/60 px-1 rounded">
                      @{currentUser.username}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate block max-w-[170px]" title={currentUser.institute}>
                    {currentUser.designation}
                  </span>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition hidden sm:block" />
              </button>

              {/* Direct Primary Sign Out Button */}
              <button
                id="navbar-signout-btn"
                type="button"
                onClick={handleSignOutAction}
                className="flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-slate-800/90 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800 border border-slate-200 dark:border-slate-700 shadow-xs transition-all cursor-pointer active:scale-95"
                title="Sign out and return to Login screen"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span className="inline">Sign Out</span>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsProfileMenuOpen(false)} 
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {currentUser.fullName}
                      </div>
                      <div className="text-[11px] font-mono text-rose-600 dark:text-rose-400">
                        @{currentUser.username} • {currentUser.role.toUpperCase()}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {currentUser.institute}
                      </div>
                      
                      {currentUser.igotKarmaPoints !== undefined && (
                        <div className="mt-2 flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                          <span className="flex items-center gap-1.5 font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            iGOT Karma Points:
                          </span>
                          <span className="font-black font-mono text-amber-700 dark:text-amber-400">
                            {currentUser.igotKarmaPoints.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[11px]">3-Step Verified Session</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">ACTIVE</span>
                      </div>

                      <div className="flex items-center justify-between px-2.5 py-1.5 text-xs text-emerald-800 dark:text-emerald-300 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[11px] font-semibold">iGOT Framework Status</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold">SYNCED</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleSignOutAction}
                        className="w-full mt-2 flex items-center justify-between min-h-[44px] px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer shadow-sm active:scale-98"
                      >
                        <span className="flex items-center gap-2">
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out of Session</span>
                        </span>
                        <span className="text-[10px] opacity-80 font-mono">Exit</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Hamburger Menu Toggle Button (< 768px) */}
            <div className="flex md:hidden items-center">
              <button
                id="navbar-mobile-menu-btn"
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsMobileNavOpen(!isMobileNavOpen);
                }}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                aria-label={isMobileNavOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              >
                {isMobileNavOpen ? (
                  <X className="w-5 h-5 text-rose-500" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                )}
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Collapsible Navigation Drawer (< 768px) */}
      {isMobileNavOpen && (
        <div className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-xl transition-all animate-in slide-in-from-top duration-200 px-4 py-4 space-y-3">
          
          {/* User Info Card */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.fullName} 
              className="w-12 h-12 rounded-full object-cover border-2 border-rose-500 shadow-sm shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {currentUser.fullName}
                </h4>
                <div className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badge.bg} shrink-0`}>
                  {badge.label}
                </div>
              </div>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-mono">@{currentUser.username}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.designation} • {currentUser.institute}</p>
            </div>
          </div>

          {/* iGOT API Gateway Status Pill (Mobile display) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>iGOT API Gateway: Connected</span>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
              LIVE (200 OK)
            </span>
          </div>

          {/* iGOT Karmayogi Pill Badge (Mobile display) */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Award className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>National Capacity Building Plan</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              NCF Aligned
            </span>
          </div>

          {/* Karma Points Counter if available */}
          {currentUser.igotKarmaPoints !== undefined && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
              <span className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <Sparkles className="w-4 h-4 text-amber-500" />
                iGOT Karma Points
              </span>
              <span className="text-sm font-black font-mono text-amber-700 dark:text-amber-300">
                {currentUser.igotKarmaPoints.toLocaleString()} PTS
              </span>
            </div>
          )}

          {/* Controls row: Theme switch & Sign Out */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {onToggleTheme && (
              <button
                type="button"
                onClick={handleThemeToggleAction}
                className="flex items-center justify-center gap-2 min-h-[44px] px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs active:scale-95"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-4 h-4 text-rose-500" />
                    <span>Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Light Mode</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleSignOutAction}
              className="flex items-center justify-center gap-2 min-h-[44px] px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm active:scale-95 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>
      )}
    </header>
  );
};
