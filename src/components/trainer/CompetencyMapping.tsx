import React, { useState } from 'react';
import { CompetencyMatch } from '../../types';
import { 
  Sparkles, 
  CheckCircle2, 
  Award, 
  Calendar, 
  Users, 
  Building2, 
  ChevronRight,
  TrendingUp,
  Briefcase
} from 'lucide-react';

interface CompetencyMappingProps {
  competencies: CompetencyMatch[];
  onAcceptDeputation?: (subject: string) => void;
}

export const CompetencyMapping: React.FC<CompetencyMappingProps> = ({
  competencies,
  onAcceptDeputation,
}) => {
  const [acceptedSubjects, setAcceptedSubjects] = useState<string[]>([]);

  const handleAccept = (subj: string) => {
    setAcceptedSubjects((prev) => [...prev, subj]);
    if (onAcceptDeputation) onAcceptDeputation(subj);
    alert(`Deputation accepted! Training cohort for "${subj}" has been assigned to your calendar.`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="liquid-glass-accent rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-rose-200/80 dark:border-rose-900/50">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800">
            <Sparkles className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>AI Faculty Skill Vectorization</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Trainer Competency & Deputation Mapping
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Automated AI match scoring compares your published research, IMD operational telemetry experience, and pedagogical history against open Ministry training mandates.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm shrink-0 flex items-center gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Overall Alignment</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">94.6%</span>
          </div>
          <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Open Mandates</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{competencies.length}</span>
          </div>
        </div>
      </div>

      {/* Competency Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {competencies.map((comp) => {
          const isAccepted = acceptedSubjects.includes(comp.subject);

          return (
            <div
              key={comp.id}
              className="liquid-glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 space-y-5 flex flex-col justify-between hover:border-rose-300 dark:hover:border-rose-700 transition shadow-sm"
            >
              <div className="space-y-4">
                {/* Header & Match Score Pill */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-100 dark:border-rose-900">
                      {comp.department}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mt-1">
                      {comp.subject}
                    </h3>
                  </div>

                  {/* AI Match Badge */}
                  <div className="text-center p-2 rounded-2xl bg-gradient-to-b from-rose-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800 border border-emerald-200 dark:border-emerald-700/60 shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">AI Match</span>
                    <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                      {comp.matchScore}%
                    </span>
                  </div>
                </div>

                {/* Match Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-emerald-500"
                      style={{ width: `${comp.matchScore}%` }}
                    />
                  </div>
                </div>

                {/* AI Rationale */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 space-y-1">
                  <strong className="text-rose-900 dark:text-rose-400 block font-bold">
                    AI Qualification Analysis:
                  </strong>
                  <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                    {comp.analysisSnippet}
                  </p>
                </div>

                {/* Matched Skills Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Verified Competency Intersections:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {comp.skillsMatched.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cohort Details */}
                <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Cohort Size: <strong className="text-slate-900 dark:text-white">{comp.openTraineeSlots} Scientists</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-red-500 dark:text-red-400" />
                    <span>Target: <strong className="text-slate-900 dark:text-white">{comp.recommendedDate}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {isAccepted ? (
                  <div className="w-full py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Deputation Accepted & Batch Allocated</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAccept(comp.subject)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span>Accept Deputation & Schedule Batch</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
