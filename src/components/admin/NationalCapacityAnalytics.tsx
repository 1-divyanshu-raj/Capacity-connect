import React, { useState } from 'react';
import { 
  Building2, 
  TrendingUp, 
  Award, 
  Users, 
  MapPin, 
  ShieldCheck,
  Compass,
  BarChart3,
  PieChart as PieIcon,
  GraduationCap,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { INSTITUTE_METRICS, SKILL_GAP_METRICS } from '../../data/mockData';

export const NationalCapacityAnalytics: React.FC = () => {
  const [activeInstituteIndex, setActiveInstituteIndex] = useState<number | null>(null);

  const throughputData = [
    { month: 'Oct', certified: 285, enrolled: 440 },
    { month: 'Nov', certified: 390, enrolled: 575 },
    { month: 'Dec', certified: 510, enrolled: 720 },
    { month: 'Jan', certified: 680, enrolled: 960 },
    { month: 'Feb', certified: 890, enrolled: 1210 },
    { month: 'Mar', certified: 1140, enrolled: 1480 },
  ];

  const domainDistribution = [
    { name: 'Radar Meteorology', value: 38, color: '#e11d48' },
    { name: 'Numerical Weather Prediction', value: 27, color: '#f43f5e' },
    { name: 'Seismology & Tsunami Science', value: 18, color: '#fb7185' },
    { name: 'Ocean & Cryosphere Dynamics', value: 17, color: '#10b981' },
  ];

  const maxEnrolled = 1600;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="liquid-glass-accent rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5 max-w-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
            Institutional CBP Dashboard • Mission Karmayogi
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Institutional CBP Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            National Earth Science Capacity Building Plan (CBP) analytics and real-time competency indices across IMD, INCOIS, NCMRWF, IITM, and NCPOR. Tracking operational readiness against National Monsoon Mission, Deep Ocean Mission, and Tsunami Early Warning mandates.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-sm shrink-0 flex items-center gap-5">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">National Readiness</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">91.8%</span>
          </div>
          <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Active Trainees</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">4,980+</span>
          </div>
          <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Certified Officers</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">3,420+</span>
          </div>
        </div>
      </div>

      {/* Chart Row 1: Institute Readiness Index & Monthly Throughput */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Institute Readiness Index (Interactive SVG Bar Chart - Smartboard Optimized) */}
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-4 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>MoES Institute Readiness Index</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Autonomous institute operational capacity & training saturation</p>
            </div>
            <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900">
              Live Feed
            </span>
          </div>

          {/* Custom SVG Bar Chart */}
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-5 gap-3 h-56 items-end px-2 pt-6 pb-2 border-b border-slate-200 dark:border-slate-700">
              {INSTITUTE_METRICS.map((inst, idx) => {
                const heightPercent = inst.readinessIndex;
                const isHovered = activeInstituteIndex === idx;

                return (
                  <div
                    key={inst.code}
                    className="flex flex-col items-center h-full justify-end group cursor-pointer touch-manipulation select-none"
                    onMouseEnter={() => setActiveInstituteIndex(idx)}
                    onMouseLeave={() => setActiveInstituteIndex(null)}
                    onClick={() => setActiveInstituteIndex(activeInstituteIndex === idx ? null : idx)}
                  >
                    {/* Tooltip on hover / tap */}
                    <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 mb-1 transition-all ${
                      isHovered ? 'opacity-100 -translate-y-1 scale-105 shadow-md' : 'opacity-85'
                    }`}>
                      {inst.readinessIndex}%
                    </div>

                    {/* High-Contrast Bar */}
                    <div className="w-full max-w-[56px] bg-slate-100 dark:bg-slate-800 rounded-t-xl overflow-hidden flex items-end h-full border border-slate-200/50 dark:border-slate-700">
                      <div
                        className={`w-full rounded-t-xl transition-all duration-300 ${
                          isHovered 
                            ? 'bg-gradient-to-t from-rose-600 to-red-500 shadow-lg shadow-rose-500/40' 
                            : 'bg-rose-600 dark:bg-rose-500'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Labels */}
            <div className="grid grid-cols-5 gap-3 text-center">
              {INSTITUTE_METRICS.map((inst, idx) => (
                <button
                  key={inst.code}
                  type="button"
                  onClick={() => setActiveInstituteIndex(activeInstituteIndex === idx ? null : idx)}
                  className={`space-y-0.5 p-1 rounded-lg transition text-left sm:text-center cursor-pointer ${
                    activeInstituteIndex === idx ? 'bg-rose-50 dark:bg-rose-950/60' : ''
                  }`}
                >
                  <span className="block font-bold text-xs text-slate-900 dark:text-white">{inst.code}</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">{inst.trained.toLocaleString()} staff</span>
                </button>
              ))}
            </div>

            {/* Active Highlight Info Card (Smartboard touch-friendly) */}
            <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs flex flex-wrap items-center justify-between gap-2 text-rose-950 dark:text-rose-200 transition-all">
              <div className="flex items-center gap-2 flex-wrap">
                <span>Selected: <strong>{activeInstituteIndex !== null ? INSTITUTE_METRICS[activeInstituteIndex].name : 'All MoES Apex Institutes'}</strong></span>
                {activeInstituteIndex !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                    INSTITUTE_METRICS[activeInstituteIndex].igotSyncStatus === 'Synced'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  }`}>
                    {INSTITUTE_METRICS[activeInstituteIndex].igotSyncStatus === 'Synced' ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    )}
                    iGOT Sync: {INSTITUTE_METRICS[activeInstituteIndex].igotSyncStatus}
                  </span>
                )}
              </div>
              <span className="font-mono font-bold text-rose-700 dark:text-rose-300">
                {activeInstituteIndex !== null ? `${INSTITUTE_METRICS[activeInstituteIndex].trained.toLocaleString()} Certified Personnel` : '4,980+ Total'}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Certification Throughput (SVG Trend Area Chart - Smartboard High Visibility) */}
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-4 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Certification & Enrollment Velocity</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Six-month trainee onboarding and examination passing volume</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900">
              +48% MoM Velocity
            </span>
          </div>

          {/* High-Contrast SVG Trend Chart */}
          <div className="pt-2">
            <svg viewBox="0 0 500 210" className="w-full h-56 overflow-visible">
              <defs>
                <linearGradient id="roseAreaHighContrast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="emeraldAreaHighContrast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* High Contrast Grid Lines */}
              <line x1="40" y1="30" x2="480" y2="30" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeDasharray="4 4" />
              <line x1="40" y1="80" x2="480" y2="80" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeDasharray="4 4" />
              <line x1="40" y1="130" x2="480" y2="130" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeDasharray="4 4" />
              <line x1="40" y1="180" x2="480" y2="180" stroke="currentColor" className="text-slate-400 dark:text-slate-600" strokeWidth="1.5" />

              {/* Enrolled Path (Higher Numbers) */}
              <path
                d="M 60 148 L 140 132 L 220 114 L 300 88 L 380 62 L 460 30 L 460 180 L 60 180 Z"
                fill="url(#roseAreaHighContrast)"
              />
              <path
                d="M 60 148 L 140 132 L 220 114 L 300 88 L 380 62 L 460 30"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Certified Path */}
              <path
                d="M 60 168 L 140 156 L 220 142 L 300 120 L 380 94 L 460 66 L 460 180 L 60 180 Z"
                fill="url(#emeraldAreaHighContrast)"
              />
              <path
                d="M 60 168 L 140 156 L 220 142 L 300 120 L 380 94 L 460 66"
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Interactive Data Points & High-Legibility Labels */}
              {throughputData.map((d, i) => {
                const x = 60 + i * 80;
                const yEnrolled = 180 - (d.enrolled / maxEnrolled) * 150;
                const yCertified = 180 - (d.certified / maxEnrolled) * 150;
                return (
                  <g key={d.month} className="group cursor-pointer">
                    <circle cx={x} cy={yEnrolled} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="2.5" />
                    <circle cx={x} cy={yCertified} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
                    <text 
                      x={x} 
                      y="200" 
                      textAnchor="middle" 
                      fontSize="12" 
                      fontWeight="bold"
                      fill="currentColor"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      {d.month}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* High-Contrast Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-3 text-xs text-slate-700 dark:text-slate-300 font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-sm" />
                <span>Enrolled Trainees (1,480 in Mar)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm" />
                <span>Certified Scientists (1,140 in Mar)</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Chart Row 2: Skill Gap Analysis & Subject Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* National Competency Deficit / Skill Gaps (2 cols) */}
        <div className="lg:col-span-2 liquid-glass rounded-3xl p-6 sm:p-8 space-y-4 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                National Earth Science Competency Deficits
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Required vs. Current personnel quotas across mission-critical domains</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {SKILL_GAP_METRICS.map((gap) => {
              const percentage = Math.round((gap.currentCapacity / gap.requiredPersonnel) * 100);

              return (
                <div key={gap.domain} className="space-y-2 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">{gap.domain}</span>
                    <span className="font-mono text-rose-700 dark:text-rose-400 font-bold">
                      {gap.currentCapacity.toLocaleString()} / {gap.requiredPersonnel.toLocaleString()} Scientists ({percentage}%)
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentage >= 80 ? 'bg-emerald-500' : percentage >= 60 ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <span>Priority: <strong className={gap.priority === 'Critical' ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-200'}>{gap.priority}</strong></span>
                    <span>Deficit: <strong className="text-slate-800 dark:text-slate-200">{gap.deficit.toLocaleString()} Personnel</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Domain Distribution Donut Card (1 col) */}
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-4 flex flex-col justify-between border border-slate-200/80 dark:border-slate-700">
          <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Subject Domain Share</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Distribution of active trainees & institutional cohorts</p>
          </div>

          {/* High-Contrast Donut Chart */}
          <div className="flex items-center justify-center py-4">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {/* Segments: 38%, 27%, 18%, 17% */}
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#e11d48" strokeWidth="4.5" strokeDasharray="38 62" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#f43f5e" strokeWidth="4.5" strokeDasharray="27 73" strokeDashoffset="-38" />
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#fb7185" strokeWidth="4.5" strokeDasharray="18 82" strokeDashoffset="-65" />
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#10b981" strokeWidth="4.5" strokeDasharray="17 83" strokeDashoffset="-83" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">100%</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">MoES Syllabus</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {domainDistribution.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: d.color }} />
                  <span className="truncate max-w-[170px]">{d.name}</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Main MoES Institute Table with iGOT API Sync Status */}
      <div className="liquid-glass rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                MoES Autonomous Institutes & Apex Training Centers
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                National training quota, capacity saturation, and iGOT Karmayogi API synchronization status
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              4 Synced
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              1 Pending
            </span>
          </div>
        </div>

        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-900 dark:bg-slate-800 text-white uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-5">Institute / Code</th>
                <th className="py-3.5 px-4">Specialization Domain</th>
                <th className="py-3.5 px-4 text-center">Certified Staff</th>
                <th className="py-3.5 px-4 text-center">Readiness</th>
                <th className="py-3.5 px-4 text-center">Active Fellows</th>
                <th className="py-3.5 px-4">iGOT API Sync Status</th>
                <th className="py-3.5 px-5 text-right">Last API Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white/80 dark:bg-slate-900/60">
              {INSTITUTE_METRICS.map((inst) => (
                <tr key={inst.code} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-rose-700 dark:text-rose-400 text-sm px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900">
                        {inst.code}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{inst.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Autonomous Institute under MoES</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {inst.leadDomain}
                  </td>
                  <td className="py-4 px-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                    {inst.trained.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5 font-mono font-bold text-xs">
                      <span className="text-emerald-700 dark:text-emerald-400">{inst.readinessIndex}%</span>
                      <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden hidden sm:block">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${inst.readinessIndex}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {inst.activeFellows} Fellows
                  </td>
                  <td className="py-4 px-4">
                    {inst.igotSyncStatus === 'Synced' ? (
                      <span 
                        id={`igot-sync-${inst.code.toLowerCase()}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Synced</span>
                      </span>
                    ) : (
                      <span 
                        id={`igot-sync-${inst.code.toLowerCase()}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800 shadow-xs"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Pending</span>
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {inst.lastSyncTimestamp || 'Synchronized'}
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
