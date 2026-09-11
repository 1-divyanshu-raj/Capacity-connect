import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingDown, 
  Sparkles, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Award, 
  BookOpen, 
  Sliders, 
  ShieldCheck, 
  Database, 
  Zap, 
  Info,
  ArrowUpRight,
  BrainCircuit
} from 'lucide-react';
import { SupabaseTrainee, SkillDecayModel } from '../../types';
import { fetchTraineesFromSupabase, updateTraineeDaysUnpracticed } from '../../lib/supabase';
import confetti from 'canvas-confetti';
import { sound } from '../../utils/soundEffects';

interface CompetencyDecayEngineProps {
  currentOfficerName?: string;
  theme?: 'light' | 'dark';
}

export const CompetencyDecayEngine: React.FC<CompetencyDecayEngineProps> = ({
  currentOfficerName = 'Dr. Rajesh Kumar'
}) => {
  // Supabase Trainees
  const [supabaseTrainees, setSupabaseTrainees] = useState<SupabaseTrainee[]>([]);
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>('');
  const [isLoadingSupabase, setIsLoadingSupabase] = useState<boolean>(true);
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'offline'>('connected');

  // Competency Parameters: C_k(t) = C_0 * e^(-lambda * t)
  const [baselineSkill, setBaselineSkill] = useState<number>(95); // C_0
  const [daysUnpracticed, setDaysUnpracticed] = useState<number>(45); // t
  const [decayLambda, setDecayLambda] = useState<number>(0.012); // lambda (standard 0.012)
  const [selectedSkillName, setSelectedSkillName] = useState<string>('Dual-Polarization Doppler Radar Interpretation');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string>('');

  // Initial load from Supabase
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setIsLoadingSupabase(true);
      const res = await fetchTraineesFromSupabase();
      if (mounted) {
        if (res.data && res.data.length > 0) {
          setSupabaseTrainees(res.data);
          // Match selected officer or fallback to first
          const matched = res.data.find(t => t.name.toLowerCase().includes(currentOfficerName.toLowerCase())) || res.data[0];
          setSelectedTraineeId(matched.id);
          setBaselineSkill(matched.baseline_skill);
          setDaysUnpracticed(matched.days_unpracticed);
          setSupabaseStatus(res.error ? 'offline' : 'connected');
        }
        setIsLoadingSupabase(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [currentOfficerName]);

  // When a different trainee is selected from dropdown
  const handleSelectTrainee = (id: string) => {
    sound.playClick();
    setSelectedTraineeId(id);
    const t = supabaseTrainees.find(item => item.id === id);
    if (t) {
      setBaselineSkill(t.baseline_skill);
      setDaysUnpracticed(t.days_unpracticed);
    }
  };

  // Math Calculations: C_k(t) = C_0 * e^(-lambda * t)
  const currentSkillScore = useMemo(() => {
    const raw = baselineSkill * Math.exp(-decayLambda * daysUnpracticed);
    return Math.max(0, Math.min(100, Math.round(raw * 10) / 10));
  }, [baselineSkill, decayLambda, daysUnpracticed]);

  const scoreDegradedPercent = useMemo(() => {
    const diff = baselineSkill - currentSkillScore;
    return Math.max(0, Math.round(diff * 10) / 10);
  }, [baselineSkill, currentSkillScore]);

  const halfLifeDays = useMemo(() => {
    return Math.round(Math.log(2) / decayLambda);
  }, [decayLambda]);

  // Skill category badge
  const retentionCategory = useMemo<'Mastery' | 'Competent' | 'Degrading' | 'Critical Gap'>(() => {
    if (currentSkillScore >= 80) return 'Mastery';
    if (currentSkillScore >= 65) return 'Competent';
    if (currentSkillScore >= 50) return 'Degrading';
    return 'Critical Gap';
  }, [currentSkillScore]);

  // Automated study recommendation based on computed score
  const recommendation = useMemo(() => {
    if (currentSkillScore >= 80) {
      return {
        level: 'Optimal Retention',
        title: 'Mastery Validated — Advance to Peer Leadership',
        description: 'Officer competency exceeds national benchmark. Recommend taking up specialized Numerical Weather Prediction research theses or mentoring incoming probationers.',
        actionLabel: 'Explore Advanced Research Modules',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        urgency: 'low'
      };
    } else if (currentSkillScore >= 65) {
      return {
        level: 'Moderate Decay Warning',
        title: 'Micro-Drill Refresher Recommended',
        description: 'Noticeable decay in temporal recall detected. Complete the 15-minute Doppler Radial Velocity de-aliasing interactive scenario to restore score to 95+.',
        actionLabel: 'Start 15-Min Calibration Drill',
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        urgency: 'medium'
      };
    } else {
      return {
        level: 'Critical Competency Hazard',
        title: 'Mandatory Clinical Re-Certification Required',
        description: 'Operational risk: Skill retention has dropped below MoES active duty certification criteria. Immediate completion of the Dual-Polarization Radar Simulator is mandatory.',
        actionLabel: 'Launch Emergency Re-Certification Drill',
        badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        urgency: 'high'
      };
    }
  }, [currentSkillScore]);

  // Generate SVG curve points for t = 0 to 180 days
  const curvePath = useMemo(() => {
    const width = 500;
    const height = 160;
    const padding = 20;
    const effectiveW = width - padding * 2;
    const effectiveH = height - padding * 2;

    const points: string[] = [];
    const maxDays = 180;

    for (let d = 0; d <= maxDays; d += 2) {
      const val = baselineSkill * Math.exp(-decayLambda * d);
      const x = padding + (d / maxDays) * effectiveW;
      const y = padding + effectiveH - (val / 100) * effectiveH;
      points.push(`${d === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return points.join(' ');
  }, [baselineSkill, decayLambda]);

  // Current day dot coordinates on SVG
  const currentDotCoord = useMemo(() => {
    const width = 500;
    const height = 160;
    const padding = 20;
    const effectiveW = width - padding * 2;
    const effectiveH = height - padding * 2;

    const x = padding + (Math.min(daysUnpracticed, 180) / 180) * effectiveW;
    const y = padding + effectiveH - (currentSkillScore / 100) * effectiveH;
    return { x, y };
  }, [daysUnpracticed, currentSkillScore]);

  // Handle Days Slider Change
  const handleDaysChange = async (days: number) => {
    setDaysUnpracticed(days);
    if (selectedTraineeId) {
      // Background sync to Supabase table
      updateTraineeDaysUnpracticed(selectedTraineeId, days);
    }
  };

  // Trigger Instant Skill Refresher Drill (resets days unpracticed to 0)
  const handleTriggerRefresher = async () => {
    sound.playSuccess();
    setIsRefreshing(true);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });

    setDaysUnpracticed(0);
    if (selectedTraineeId) {
      await updateTraineeDaysUnpracticed(selectedTraineeId, 0);
    }

    setSyncFeedback('Refresher drill completed! Skill score reset to 100% baseline.');
    setTimeout(() => {
      setIsRefreshing(false);
      setSyncFeedback('');
    }, 3000);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur-sm p-5 sm:p-6 transition-all space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Dynamic Competency Intelligence Engine
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                C_k(t) = C_0 · e^(−λt)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mathematical modeling of cognitive skill decay and retention trajectories across MoES operational cadres.
            </p>
          </div>
        </div>

        {/* Supabase Live Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
            <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Supabase: {isLoadingSupabase ? 'Connecting...' : 'Live Synced (4 Trainees)'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Trainee Selector & Domain Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Officer Profile (From Supabase Database)
          </label>
          <select
            id="competency-trainee-selector"
            value={selectedTraineeId}
            onChange={(e) => handleSelectTrainee(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
          >
            {supabaseTrainees.map((trainee) => (
              <option key={trainee.id} value={trainee.id}>
                {trainee.name} — {trainee.department} (Baseline: {trainee.baseline_skill}%, Unpracticed: {trainee.days_unpracticed}d)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Evaluated Competency Domain
          </label>
          <select
            value={selectedSkillName}
            onChange={(e) => setSelectedSkillName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
          >
            <option value="Dual-Polarization Doppler Radar Interpretation">Dual-Polarization Doppler Radar Interpretation (IMD)</option>
            <option value="Numerical Weather Prediction & WRF Modeling">Numerical Weather Prediction & WRF Modeling (NCMRWF)</option>
            <option value="Deep-Sea Tsunami Buoy Telemetry Calibration">Deep-Sea Tsunami Buoy Telemetry Calibration (INCOIS)</option>
            <option value="Aerosol Optical Depth & Monsoon Dynamics">Aerosol Optical Depth & Monsoon Dynamics (IITM)</option>
          </select>
        </div>
      </div>

      {/* Primary Mathematical Metric Display */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Current Score C_k(t) */}
        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>Current Skill Score</span>
            <span className="font-mono text-[10px]">C_k(t)</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              currentSkillScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
              currentSkillScore >= 65 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {currentSkillScore}
            </span>
            <span className="text-xs text-slate-400 font-bold">/ 100</span>
          </div>
          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-1.5 ${
            retentionCategory === 'Mastery' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
            retentionCategory === 'Competent' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
            'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
          }`}>
            {retentionCategory}
          </span>
        </div>

        {/* Metric 2: Baseline Skill C_0 */}
        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>Baseline Skill</span>
            <span className="font-mono text-[10px]">C_0</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              {baselineSkill}
            </span>
            <span className="text-xs text-slate-400 font-bold">%</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">
            Initial Exam Certification
          </p>
        </div>

        {/* Metric 3: Score Degraded */}
        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>Degradation</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
              -{scoreDegradedPercent}
            </span>
            <span className="text-xs text-slate-400 font-bold">pts</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
            {daysUnpracticed} days unpracticed
          </p>
        </div>

        {/* Metric 4: Skill Half-Life */}
        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>Skill Half-Life</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              {halfLifeDays}
            </span>
            <span className="text-xs text-slate-400 font-bold">days</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-mono">
            t_1/2 = ln(2) / λ
          </p>
        </div>
      </div>

      {/* Interactive Sliders Section */}
      <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 space-y-4">
        
        {/* Slider 1: Days Unpracticed (t) */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-rose-500" />
              <span>Interactive Control: Days Unpracticed (t)</span>
            </span>
            <span className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              {daysUnpracticed} Days
            </span>
          </div>
          <input
            id="days-unpracticed-slider"
            type="range"
            min={0}
            max={180}
            step={1}
            value={daysUnpracticed}
            onChange={(e) => handleDaysChange(Number(e.target.value))}
            className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>0d (Freshly Certified)</span>
            <span>30d</span>
            <span>60d (Half-Life Zone)</span>
            <span>90d</span>
            <span>180d (Critical Gap)</span>
          </div>
        </div>

        {/* Secondary Parameters: Decay Constant (lambda) */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Decay Rate Sensitivity (λ):</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{decayLambda}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { sound.playClick(); setDecayLambda(0.008); }}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold transition ${
                decayLambda === 0.008
                  ? 'bg-rose-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
              }`}
            >
              Foundational (λ=0.008)
            </button>
            <button
              type="button"
              onClick={() => { sound.playClick(); setDecayLambda(0.012); }}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold transition ${
                decayLambda === 0.012
                  ? 'bg-rose-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
              }`}
            >
              Standard (λ=0.012)
            </button>
            <button
              type="button"
              onClick={() => { sound.playClick(); setDecayLambda(0.018); }}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold transition ${
                decayLambda === 0.018
                  ? 'bg-rose-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
              }`}
            >
              Complex Tech (λ=0.018)
            </button>
          </div>
        </div>
      </div>

      {/* SVG Mathematical Curve Plot */}
      <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-950 text-white relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200">Retention Trajectory Curve</span>
            <span className="text-[10px] font-mono text-rose-400">C_k(t) vs Time (Days)</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> &gt;80% Mastery
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> 65-80% Competent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> &lt;65% Critical
            </span>
          </div>
        </div>

        {/* SVG Container */}
        <div className="w-full overflow-x-auto py-1">
          <svg viewBox="0 0 500 160" className="w-full h-36">
            <defs>
              <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Threshold Lines */}
            {/* 80% line */}
            <line x1="20" y1="32" x2="480" y2="32" stroke="#10b981" strokeDasharray="3 3" strokeOpacity="0.3" />
            <text x="485" y="35" fill="#10b981" fontSize="8" fontFamily="monospace">80%</text>

            {/* 65% line */}
            <line x1="20" y1="56" x2="480" y2="56" stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity="0.3" />
            <text x="485" y="59" fill="#f59e0b" fontSize="8" fontFamily="monospace">65%</text>

            {/* Shaded Area under curve */}
            <path
              d={`${curvePath} L 480 140 L 20 140 Z`}
              fill="url(#curveGradient)"
            />

            {/* Main Exponential Decay Line */}
            <path
              d={curvePath}
              fill="none"
              stroke="#fb7185"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Current Position Marker */}
            <line
              x1={currentDotCoord.x}
              y1={20}
              x2={currentDotCoord.x}
              y2={140}
              stroke="#f43f5e"
              strokeDasharray="2 2"
              strokeOpacity="0.6"
            />
            <circle
              cx={currentDotCoord.x}
              cy={currentDotCoord.y}
              r="6"
              fill="#f43f5e"
              className="animate-pulse"
            />
            <circle
              cx={currentDotCoord.x}
              cy={currentDotCoord.y}
              r="2.5"
              fill="#ffffff"
            />

            {/* Coordinate Label */}
            <text
              x={Math.min(currentDotCoord.x + 8, 420)}
              y={Math.max(currentDotCoord.y - 8, 28)}
              fill="#ffffff"
              fontSize="10"
              fontWeight="bold"
              fontFamily="monospace"
            >
              t={daysUnpracticed}d: {currentSkillScore}%
            </text>
          </svg>
        </div>
      </div>

      {/* Automated Study Recommendations Box based on Computed Score */}
      <div className={`p-4 rounded-xl border ${recommendation.badgeColor} bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-xs`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
              {recommendation.level}
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {recommendation.title}
            </h4>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
            {recommendation.description}
          </p>
          {syncFeedback && (
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{syncFeedback}</span>
            </p>
          )}
        </div>

        <button
          id="trigger-refresher-drill-btn"
          type="button"
          onClick={handleTriggerRefresher}
          disabled={isRefreshing}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-md shadow-rose-900/20 transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{recommendation.actionLabel}</span>
        </button>
      </div>

    </div>
  );
};
