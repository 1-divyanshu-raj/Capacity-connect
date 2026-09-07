import React, { useState } from 'react';
import { MOCK_PERSONNEL_DIRECTORY } from '../../data/mockData';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Award, 
  Search, 
  Filter, 
  ShieldCheck, 
  Building2, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Briefcase
} from 'lucide-react';

export const PersonnelProfilesDirectory: React.FC = () => {
  const [roleFilter, setRoleFilter] = useState<'all' | 'trainer' | 'trainee'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string | null>(null);

  const filteredPersonnel = MOCK_PERSONNEL_DIRECTORY.filter((person) => {
    const matchesRole = roleFilter === 'all' || person.role === roleFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      person.fullName.toLowerCase().includes(query) ||
      person.institute.toLowerCase().includes(query) ||
      person.department.toLowerCase().includes(query) ||
      person.designation.toLowerCase().includes(query) ||
      (person.thesisTitle && person.thesisTitle.toLowerCase().includes(query)) ||
      (person.qualification && person.qualification.toLowerCase().includes(query));
    return matchesRole && matchesSearch;
  });

  const selectedPerson = MOCK_PERSONNEL_DIRECTORY.find(p => p.id === selectedPersonnelId);

  // Aggregates for the executive stat cards
  const totalTrainers = MOCK_PERSONNEL_DIRECTORY.filter(p => p.role === 'trainer').length;
  const totalTrainees = MOCK_PERSONNEL_DIRECTORY.filter(p => p.role === 'trainee').length;
  const totalThesesSupervised = MOCK_PERSONNEL_DIRECTORY.reduce((acc, p) => acc + (p.thesesSupervisedCount || 0), 0);
  const totalMentoredStudents = MOCK_PERSONNEL_DIRECTORY.reduce((acc, p) => acc + (p.studentsMentoredCount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="liquid-glass-accent rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
            Official Personnel Registry
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Trainer & Trainee Academic Dossiers
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Comprehensive directory of MoES research faculty, senior research supervisors, and trainee scientists. Review supervised theses, research citations, and student mentorship metrics.
          </p>
        </div>

        {/* Executive High-Volume Metric Counters */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-sm text-center min-w-[140px]">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Supervised Theses</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {totalThesesSupervised}+ Research
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Senior Research Submissions</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-sm text-center min-w-[140px]">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Mentored Scientists</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {totalMentoredStudents.toLocaleString()}+
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Across 5 Apex Institutes</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="liquid-glass rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            id="personnel-search-input"
            type="text"
            placeholder="Search by faculty name, trainee, institute, thesis topic, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'trainer', 'trainee'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                roleFilter === r
                  ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {r === 'all' ? `All Personnel (${MOCK_PERSONNEL_DIRECTORY.length})` : r === 'trainer' ? `Faculty Trainers (${totalTrainers})` : `Trainee Scientists (${totalTrainees})`}
            </button>
          ))}
        </div>
      </div>

      {/* Personnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPersonnel.map((person) => {
          const isTrainer = person.role === 'trainer';

          return (
            <div
              key={person.id}
              className="liquid-glass rounded-3xl p-5 border border-slate-200/90 dark:border-slate-700/80 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Card Top: Avatar & Role Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={person.avatar} 
                      alt={person.fullName}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {person.fullName}
                      </h3>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                        {person.designation}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                    isTrainer 
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                      : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                  }`}>
                    {person.role}
                  </span>
                </div>

                {/* Institute & Department */}
                <div className="space-y-1 mb-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold truncate">
                    <Building2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{person.institute}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 pl-5 truncate">
                    {person.department}
                  </div>
                </div>

                {/* Trainer-Specific Metrics vs Trainee-Specific Metrics */}
                {isTrainer ? (
                  <div className="space-y-2 mb-4">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60">
                        <span className="text-[10px] text-rose-700 dark:text-rose-300 block font-semibold">Theses Supervised</span>
                        <span className="text-base font-black text-rose-900 dark:text-rose-200 font-mono">
                          {person.thesesSupervisedCount} Research
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-semibold">Trainees Mentored</span>
                        <span className="text-base font-black text-emerald-900 dark:text-emerald-200 font-mono">
                          {person.studentsMentoredCount}+
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Papers & Citations: </span>
                      <span>{person.researchPapersCount} published ({person.citationsCount?.toLocaleString()} citations)</span>
                    </div>

                    {person.thesesDetails && person.thesesDetails.length > 0 && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 italic bg-white/60 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        "{person.thesesDetails[0]}"
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Thesis Topic:</span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
                          {person.thesisStatus}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                        {person.thesisTitle}
                      </p>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Supervisor: <span className="font-semibold text-slate-700 dark:text-slate-300">{person.thesisSupervisor}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] px-1">
                      <span className="text-slate-500 dark:text-slate-400">Courses & Avg:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {person.coursesCompletedCount}/{person.coursesEnrolledCount} Completed ({person.averageGrade})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        NCF-ID: {person.ncfId || `NCF-MET-${person.id.slice(-3)}`}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-700/80 text-amber-800 dark:text-amber-300">
                        <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                        {person.igotKarmaPoints || 1450} Karma Pts
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer: Security Clearance & Action Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{person.clearanceLevel}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPersonnelId(person.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Dossier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Personnel Dossier Detailed Modal */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-rose-500 to-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src={selectedPerson.avatar} 
                  alt={selectedPerson.fullName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/80 shadow-md shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black">{selectedPerson.fullName}</h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/20 uppercase tracking-wider">
                      {selectedPerson.role}
                    </span>
                  </div>
                  <p className="text-xs text-rose-100 mt-0.5">{selectedPerson.designation} • {selectedPerson.institute}</p>
                  <p className="text-[10px] font-mono text-rose-200 mt-0.5">{selectedPerson.nicUid}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPersonnelId(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-200 text-xs">
              
              {/* Educational Qualifications */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  Academic Background & Degrees
                </span>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  {selectedPerson.qualification}
                </p>
              </div>

              {/* Research / Thesis Section */}
              {selectedPerson.role === 'trainer' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                      <span className="text-[10px] text-rose-700 dark:text-rose-300 block font-semibold">Research Theses</span>
                      <span className="text-xl font-black text-rose-900 dark:text-rose-100 font-mono">{selectedPerson.thesesSupervisedCount}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-semibold">Mentored Trainees</span>
                      <span className="text-xl font-black text-emerald-900 dark:text-emerald-100 font-mono">{selectedPerson.studentsMentoredCount}+</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 block font-semibold">Citations</span>
                      <span className="text-xl font-black text-amber-900 dark:text-amber-100 font-mono">{selectedPerson.citationsCount?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1.5 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-rose-600" />
                      <span>Senior Research Theses Supervised</span>
                    </h4>
                    <ul className="space-y-1.5 pl-2">
                      {selectedPerson.thesesDetails?.map((thesis, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{thesis}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* iGOT Alignment Dossier Badge */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                        <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                        <span>iGOT Karmayogi National Competency</span>
                      </div>
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 font-mono mt-0.5">
                        NCF-ID: {selectedPerson.ncfId || `NCF-MET-${selectedPerson.id.slice(-3)}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-amber-900 dark:text-amber-100 font-mono">
                        {(selectedPerson.igotKarmaPoints || 1450).toLocaleString()} PTS
                      </span>
                      <span className="block text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        MoES Synced
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">Primary Research Thesis</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 text-[10px] font-bold">
                        {selectedPerson.thesisStatus}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      "{selectedPerson.thesisTitle}"
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Supervisor: <strong>{selectedPerson.thesisSupervisor}</strong>
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1.5 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-rose-600" />
                      <span>Published Scientific Papers</span>
                    </h4>
                    <ul className="space-y-1.5 pl-2">
                      {selectedPerson.papersList?.map((paper, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{paper}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Key Skills / Competencies */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-1.5">
                  Core Scientific Competencies
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedPerson.keyExpertise || selectedPerson.keySkills || []).map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact and Clearance Footer */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                <div>
                  <span>Official Email: </span>
                  <a href={`mailto:${selectedPerson.email}`} className="text-rose-600 dark:text-rose-400 font-semibold hover:underline">
                    {selectedPerson.email}
                  </a>
                </div>
                <div className="font-mono">
                  Clearance: <strong className="text-emerald-600 dark:text-emerald-400">{selectedPerson.clearanceLevel}</strong>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPersonnelId(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-rose-600 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-rose-500 transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
