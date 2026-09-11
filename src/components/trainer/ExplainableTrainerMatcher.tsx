import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Award, 
  Star, 
  Briefcase, 
  Sliders, 
  CheckCircle2, 
  Calculator, 
  Sparkles, 
  HelpCircle, 
  Database, 
  Zap, 
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Building2,
  BookOpen
} from 'lucide-react';
import { SupabaseTrainer, TrainerMatchScore } from '../../types';
import { fetchTrainersFromSupabase, updateTrainerWorkloadHours } from '../../lib/supabase';
import { sound } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';

interface ExplainableTrainerMatcherProps {
  theme?: 'light' | 'dark';
  currentTrainerName?: string;
}

export const ExplainableTrainerMatcher: React.FC<ExplainableTrainerMatcherProps> = ({
  currentTrainerName
}) => {
  // Trainers from Supabase
  const [trainers, setTrainers] = useState<SupabaseTrainer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Multi-criteria weights: S_p = alpha * C_p + beta * E_p - gamma * W_p
  // alpha: Competency weight (0 to 1)
  // beta: Pedagogical rating weight (0 to 1)
  // gamma: Workload penalty weight (0 to 1)
  const [alpha, setAlpha] = useState<number>(0.50); // default 0.50
  const [beta, setBeta] = useState<number>(0.40);  // default 0.40
  const [gamma, setGamma] = useState<number>(0.15); // default 0.15

  // Course requirements for matching
  const [selectedTargetCourse, setSelectedTargetCourse] = useState<string>('Advanced Numerical Weather Prediction (NWP) Modeling');
  const [selectedSpecializationFilter, setSelectedSpecializationFilter] = useState<string>('all');

  // Interactive modal/detail card for explainability
  const [inspectedTrainerId, setInspectedTrainerId] = useState<string | null>(null);
  const [assignmentFeedback, setAssignmentFeedback] = useState<string>('');

  // Initial fetch from Supabase
  useEffect(() => {
    let mounted = true;
    const loadTrainers = async () => {
      setIsLoading(true);
      const res = await fetchTrainersFromSupabase();
      if (mounted) {
        if (res.data && res.data.length > 0) {
          setTrainers(res.data);
          setInspectedTrainerId(res.data[0].id);
        }
        setSupabaseError(res.error);
        setIsLoading(false);
      }
    };
    loadTrainers();
    return () => { mounted = false; };
  }, []);

  // Compute multi-criteria score for each trainer
  // S_p = alpha * C_p + beta * E_p - gamma * W_p
  // Note: E_p is out of 5, so normalized to 100 as (rating / 5.0) * 100
  // W_p is in hours, penalized by gamma * W_p
  const scoredTrainers: TrainerMatchScore[] = useMemo(() => {
    if (!trainers || trainers.length === 0) return [];

    const computed = trainers.map((t) => {
      const Cp = t.competency_score;
      const EpNormalized = (t.rating / 5.0) * 100;
      const Wp = t.workload_hours;

      // Formula application
      const score = (alpha * Cp) + (beta * EpNormalized) - (gamma * Wp);
      const compositeScore = Math.max(0, Math.round(score * 10) / 10);

      // Generate explainability rationale
      let rationale = '';
      if (Cp >= 95 && Wp <= 15) {
        rationale = 'Exemplary competency paired with low workload gives this faculty top priority.';
      } else if (Wp > 20) {
        rationale = `High domain expertise penalized by heavy active workload (${Wp}h).`;
      } else if (t.rating >= 4.8) {
        rationale = 'High pedagogical satisfaction from prior trainee batches boosts rating.';
      } else {
        rationale = 'Balanced pedagogical and operational readiness profile.';
      }

      return {
        trainer: t,
        competencyScore: Cp,
        pedagogicalRating: t.rating,
        pedagogicalNormalized: Math.round(EpNormalized * 10) / 10,
        workloadHours: Wp,
        compositeScore,
        rank: 0,
        isOptimal: false,
        matchRationale: rationale
      };
    });

    // Sort descending by composite score S_p
    computed.sort((a, b) => b.compositeScore - a.compositeScore);

    // Assign rank
    computed.forEach((item, idx) => {
      item.rank = idx + 1;
      item.isOptimal = idx === 0;
    });

    return computed;
  }, [trainers, alpha, beta, gamma]);

  // Active inspected trainer
  const inspectedTrainer = useMemo(() => {
    return scoredTrainers.find(item => item.trainer.id === inspectedTrainerId) || scoredTrainers[0];
  }, [scoredTrainers, inspectedTrainerId]);

  // Adjust workload hours in real time
  const handleWorkloadChange = async (trainerId: string, deltaHours: number) => {
    setTrainers(prev => prev.map(t => {
      if (t.id === trainerId) {
        const updatedHours = Math.max(0, Math.min(50, t.workload_hours + deltaHours));
        updateTrainerWorkloadHours(trainerId, updatedHours);
        return { ...t, workload_hours: updatedHours };
      }
      return t;
    }));
  };

  // Assign trainer to targeted course
  const handleAssignTrainer = (name: string) => {
    sound.playSuccess();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
    setAssignmentFeedback(`Faculty Assignment Confirmed: ${name} deployed as lead instructor for "${selectedTargetCourse}". iGOT Capacity record dispatched.`);
    setTimeout(() => setAssignmentFeedback(''), 4500);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur-sm p-5 sm:p-6 transition-all space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-red-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Explainable Trainer Matching Engine
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                S_p = α·C_p + β·E_p − γ·W_p
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Multi-criteria pedagogical optimization matching Ministry faculty based on domain competence, student feedback, and live workload capacity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
            <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Supabase: {isLoading ? 'Querying...' : `Loaded (${trainers.length} Trainers)`}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Target Course & Specialization Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Target Course / MoES Induction Module
          </label>
          <select
            value={selectedTargetCourse}
            onChange={(e) => setSelectedTargetCourse(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
          >
            <option value="Advanced Numerical Weather Prediction (NWP) Modeling">Advanced Numerical Weather Prediction (NWP) Modeling</option>
            <option value="Operational Oceanographic Modelling & Tsunami Early Warning">Operational Oceanographic Modelling & Tsunami Early Warning</option>
            <option value="Tropical Cyclone Track & Intensity Nowcasting">Tropical Cyclone Track & Intensity Nowcasting</option>
            <option value="Satellite Meteorological Data Inversion & Calibration">Satellite Meteorological Data Inversion & Calibration</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Formula Weights Configuration Presets
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { sound.playClick(); setAlpha(0.60); setBeta(0.30); setGamma(0.10); }}
              className="flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
            >
              Research-Heavy (α=0.6)
            </button>
            <button
              type="button"
              onClick={() => { sound.playClick(); setAlpha(0.50); setBeta(0.40); setGamma(0.15); }}
              className="flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 transition"
            >
              Standard (Balanced)
            </button>
            <button
              type="button"
              onClick={() => { sound.playClick(); setAlpha(0.35); setBeta(0.35); setGamma(0.30); }}
              className="flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
            >
              Low-Workload First (γ=0.3)
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Criteria Sliders Panel */}
      <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-rose-500" />
            <span>Interactive Parameter Tuning for S_p = α·C_p + β·E_p − γ·W_p</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Alpha: Competency Weight */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-600 dark:text-slate-400">α (Competency C_p):</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{(alpha * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
          </div>

          {/* Beta: Pedagogical Rating Weight */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-600 dark:text-slate-400">β (Pedagogical E_p):</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{(beta * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={beta}
              onChange={(e) => setBeta(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
          </div>

          {/* Gamma: Workload Penalty Weight */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-600 dark:text-slate-400">γ (Workload Penalty W_p):</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{(gamma * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={0.5}
              step={0.05}
              value={gamma}
              onChange={(e) => setGamma(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Assignment Feedback Banner */}
      {assignmentFeedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{assignmentFeedback}</span>
        </div>
      )}

      {/* Ranked Trainer List & Formula Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Ranked Faculty Cards */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Ranked Faculty Candidates (Highest S_p Composite Score)</span>
            <span className="text-[10px] text-slate-400 font-mono">Live Recalculation</span>
          </div>

          {scoredTrainers.map((item) => (
            <div
              key={item.trainer.id}
              onClick={() => { sound.playClick(); setInspectedTrainerId(item.trainer.id); }}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                inspectedTrainerId === item.trainer.id
                  ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 shadow-md'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 ${
                    item.rank === 1 
                      ? 'bg-amber-400 text-amber-950 shadow-xs' 
                      : item.rank === 2
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    #{item.rank}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.trainer.name}
                      </h4>
                      {item.isOptimal && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-200 uppercase tracking-wider">
                          Optimal Match
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.trainer.specialization}
                    </p>
                  </div>
                </div>

                {/* Composite Score Pill */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-mono">Composite S_p</div>
                    <div className="text-lg font-black text-rose-600 dark:text-rose-400">
                      {item.compositeScore}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignTrainer(item.trainer.name);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-rose-600 dark:hover:bg-rose-500 dark:hover:text-white transition cursor-pointer"
                  >
                    Assign
                  </button>
                </div>
              </div>

              {/* Breakdown metrics mini-bar */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Competency (C_p)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{item.competencyScore}%</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Rating (E_p)</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {item.pedagogicalRating} / 5.0
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Workload (W_p)</span>
                  <span className={`font-bold ${item.workloadHours > 20 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                    {item.workloadHours} hrs
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Col: Mathematical Explainability Drawer */}
        <div className="p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Mathematical Derivation
            </h4>
          </div>

          {inspectedTrainer && (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Evaluating Candidate:</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {inspectedTrainer.trainer.name}
                </span>
                <span className="block text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  {inspectedTrainer.trainer.specialization}
                </span>
              </div>

              {/* Exact Formula with filled numbers */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] space-y-1">
                <div className="text-slate-400 text-[10px]">S_p Calculation:</div>
                <div className="text-slate-800 dark:text-slate-200 font-bold">
                  S_p = ({alpha.toFixed(2)} × {inspectedTrainer.competencyScore}) + ({beta.toFixed(2)} × {inspectedTrainer.pedagogicalNormalized}) − ({gamma.toFixed(2)} × {inspectedTrainer.workloadHours})
                </div>
                <div className="text-rose-600 dark:text-rose-400 font-extrabold pt-1 border-t border-slate-100 dark:border-slate-700">
                  = {(alpha * inspectedTrainer.competencyScore).toFixed(1)} + {(beta * inspectedTrainer.pedagogicalNormalized).toFixed(1)} − {(gamma * inspectedTrainer.workloadHours).toFixed(1)} = {inspectedTrainer.compositeScore}
                </div>
              </div>

              {/* Rationale Explanation */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Explainable Decision Rationale:
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  {inspectedTrainer.matchRationale}
                </p>
              </div>

              {/* Interactive Workload Simulation */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Simulate Workload Capacity Change:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleWorkloadChange(inspectedTrainer.trainer.id, -4)}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-[10px] font-bold"
                  >
                    -4h Capacity
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWorkloadChange(inspectedTrainer.trainer.id, 4)}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-[10px] font-bold"
                  >
                    +4h Workload
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleAssignTrainer(inspectedTrainer.trainer.name)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Deploy for {selectedTargetCourse.slice(0, 24)}...</span>
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
};
