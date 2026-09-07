import React, { useState, useEffect } from 'react';
import { InstitutePresence, ActiveLearningSession } from '../../types';
import { MOCK_INSTITUTE_PRESENCE, MOCK_ACTIVE_SESSIONS } from '../../data/assignmentData';
import { 
  Activity, 
  Users, 
  Radio, 
  ShieldCheck, 
  Globe2, 
  Building2, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  ArrowUpRight,
  Filter,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { sound } from '../../utils/soundEffects';

interface LivePresenceHUDProps {
  onRefresh?: () => void;
}

export const LivePresenceHUD: React.FC<LivePresenceHUDProps> = () => {
  const [institutes, setInstitutes] = useState<InstitutePresence[]>(MOCK_INSTITUTE_PRESENCE);
  const [sessions, setSessions] = useState<ActiveLearningSession[]>(MOCK_ACTIVE_SESSIONS);
  const [selectedInstituteCode, setSelectedInstituteCode] = useState<string>('ALL');
  const [isLiveSyncing, setIsLiveSyncing] = useState<boolean>(true);
  const [lastTick, setLastTick] = useState<number>(Date.now());

  const totalActiveUsers = institutes.reduce((acc, inst) => acc + inst.activeUsersCount, 0);
  const totalActiveTrainees = institutes.reduce((acc, inst) => acc + inst.activeTrainees, 0);
  const totalActiveTrainers = institutes.reduce((acc, inst) => acc + inst.activeTrainers, 0);

  // Periodically simulate minor live presence fluctuation to show real-time heartbeat
  useEffect(() => {
    if (!isLiveSyncing) return;

    const interval = setInterval(() => {
      setLastTick(Date.now());
      setInstitutes((prev) =>
        prev.map((inst) => {
          // slight random jitter (+1, 0, -1)
          const jitter = Math.floor(Math.random() * 3) - 1;
          const newTotal = Math.max(20, inst.activeUsersCount + jitter);
          return {
            ...inst,
            activeUsersCount: newTotal,
          };
        })
      );
    }, 8000);

    return () => clearInterval(interval);
  }, [isLiveSyncing]);

  const filteredSessions = sessions.filter((s) => {
    if (selectedInstituteCode === 'ALL') return true;
    return s.instituteCode === selectedInstituteCode;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Live Presence Header HUD Banner */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white/90 via-rose-50/20 to-white/80 dark:from-slate-900/90 dark:via-rose-950/20 dark:to-slate-900/80 shadow-md">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200/70 dark:border-slate-800">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                LIVE TELEMETRY ACTIVE
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Real-Time Presence HUD
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>National MoES Scientific Presence & Engagement</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Live concurrent telemetry across 5 apex atmospheric, oceanic, and polar research institutes under the Ministry of Earth Sciences.
            </p>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="flex items-center gap-3">
            
            <div className="p-3 sm:p-4 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm text-center min-w-[120px]">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Total Online
              </div>
              <div className="text-2xl font-black font-mono text-rose-700 dark:text-rose-400">
                {totalActiveUsers}
              </div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                Active Heartbeats
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm text-center min-w-[110px]">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Trainees
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {totalActiveTrainees}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {totalActiveTrainers} Faculty
              </div>
            </div>

          </div>

        </div>

        {/* Live Institute Grid Cards (5 Apex Institutes) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-5">
          {institutes.map((inst) => {
            const isSelected = selectedInstituteCode === inst.code;
            return (
              <div
                key={inst.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedInstituteCode(selectedInstituteCode === inst.code ? 'ALL' : inst.code);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                  isSelected
                    ? 'bg-rose-50/80 dark:bg-rose-950/50 border-rose-500 ring-2 ring-rose-500/20 shadow-sm'
                    : 'bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-rose-300 dark:hover:border-rose-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white tracking-wider">
                    {inst.code}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{inst.activeUsersCount} live</span>
                  </div>
                </div>

                <div className="text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate" title={inst.name}>
                    {inst.name.split(' ')[0]} {inst.name.split(' ')[1] || ''}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">
                    {inst.city}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono text-[10px]">Avg Engagement</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                    {inst.avgEngagementScore}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Real-time Streaming Sessions Ticker / Activity Table */}
      <div className="liquid-glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 space-y-4 shadow-sm">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Real-Time Active Learning & Benchmark Sessions</span>
            </h4>
            <p className="text-xs text-slate-500">
              Live event stream verified by client-side heartbeat trackers and HPC execution monitors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedInstituteCode('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedInstituteCode === 'ALL'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Institutes ({sessions.length})
            </button>
            <span className="text-xs font-mono text-slate-400">|</span>
            <button
              type="button"
              onClick={() => setIsLiveSyncing(!isLiveSyncing)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLiveSyncing ? 'animate-spin text-emerald-500' : 'text-slate-400'}`} />
              <span>{isLiveSyncing ? 'Live Telemetry ON' : 'Paused'}</span>
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Officer / Scientist</th>
                <th className="py-3 px-3">Institute</th>
                <th className="py-3 px-3">Active Operation / Learning Task</th>
                <th className="py-3 px-3">Module / Subject</th>
                <th className="py-3 px-3">Heartbeat Telemetry</th>
                <th className="py-3 px-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredSessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                    <div className="font-bold">{s.officerName}</div>
                    <div className="text-[10px] text-slate-500 font-normal">{s.designation}</div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                      {s.instituteCode}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-medium">
                    {s.activity}
                  </td>

                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-sans">
                    {s.courseOrModule}
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      {s.timestamp}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    {s.engagementVerified ? (
                      <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        Verified Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                        <Clock className="w-3 h-3 text-amber-500" />
                        Verifying...
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
