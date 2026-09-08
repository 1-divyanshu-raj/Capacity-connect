import React, { useState } from 'react';
import { TraineeProgress } from '../../types';
import { 
  Users, 
  Search, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Filter, 
  BarChart2,
  Sparkles
} from 'lucide-react';

interface TraineeAnalyticsProps {
  trainees: TraineeProgress[];
}

export const TraineeAnalytics: React.FC<TraineeAnalyticsProps> = ({ trainees }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [instituteFilter, setInstituteFilter] = useState('All');

  const institutes = ['All', 'IMD New Delhi', 'INCOIS Hyderabad', 'IITM Pune', 'NCMRWF Noida', 'NCPOR Goa'];

  const filtered = trainees.filter((t) => {
    const matchesSearch = t.traineeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.institute.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.activeCourse.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesInst = instituteFilter === 'All' || t.institute === instituteFilter;
    return matchesSearch && matchesInst;
  });

  const avgCompletion = Math.round(trainees.reduce((acc, curr) => acc + curr.overallProgress, 0) / trainees.length);
  const avgScore = Math.round(trainees.reduce((acc, curr) => acc + curr.averageQuizScore, 0) / trainees.length);
  const totalCertificates = trainees.reduce((acc, curr) => acc + curr.completedModules, 0);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto max-w-full overflow-x-hidden">
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="liquid-glass-card rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Cohort Completion Rate</span>
            <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{avgCompletion}%</div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 mt-2 overflow-hidden">
            <div className="h-full bg-rose-600 rounded-full" style={{ width: `${avgCompletion}%` }} />
          </div>
        </div>

        <div className="liquid-glass-card rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Average MCQ Exam Score</span>
            <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">{avgScore}%</div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">&ge; 70% passing benchmark</p>
        </div>

        <div className="liquid-glass-card rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Certificates Earned</span>
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalCertificates}</div>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-medium">Validated by MoES registry</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="liquid-glass rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search trainee by name, institute, or active module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={instituteFilter}
            onChange={(e) => setInstituteFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium outline-none"
          >
            {institutes.map((inst) => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Trainees Progress Table */}
      <div className="liquid-glass rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left text-xs min-w-[740px]">
            <thead className="bg-slate-900 dark:bg-slate-800 text-white uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-5">Scientist / Trainee</th>
                <th className="py-3.5 px-4">Institute</th>
                <th className="py-3.5 px-4">Active Course</th>
                <th className="py-3.5 px-4">Overall Progress</th>
                <th className="py-3.5 px-4">Exam Score</th>
                <th className="py-3.5 px-4">iGOT Status</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white/70 dark:bg-slate-900/60">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition">
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-slate-900 dark:text-white">{t.traineeName}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono text-rose-700 dark:text-rose-400">{t.traineeId}</span>
                      <span className="text-[9px] font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        NCF-MET-{t.id.slice(-3)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                    {t.institute}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 font-semibold max-w-[200px] truncate">
                    {t.activeCourse}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 sm:w-24 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-rose-600"
                          style={{ width: `${t.overallProgress}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{t.overallProgress}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    <span className={t.averageQuizScore >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                      {t.averageQuizScore}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                      1,450 Pts
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      On Track
                    </span>
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
