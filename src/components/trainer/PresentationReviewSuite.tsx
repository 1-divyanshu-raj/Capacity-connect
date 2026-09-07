import React, { useState } from 'react';
import { PresentationSubmission, PresentationRubricScore, PresentationStatus } from '../../types';
import { 
  Video, 
  Award, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sliders, 
  Play, 
  User, 
  Send, 
  Building2, 
  FileText, 
  Check, 
  RefreshCw,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { sound } from '../../utils/soundEffects';

interface PresentationReviewSuiteProps {
  trainerName: string;
  trainerInstitute: string;
  submissions: PresentationSubmission[];
  onUpdateSubmission: (updated: PresentationSubmission) => void;
}

export const PresentationReviewSuite: React.FC<PresentationReviewSuiteProps> = ({
  trainerName,
  trainerInstitute,
  submissions,
  onUpdateSubmission
}) => {
  const [selectedPresId, setSelectedPresId] = useState<string>(submissions[0]?.id || '');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedPres = submissions.find((s) => s.id === selectedPresId) || submissions[0];

  // Grading Rubric Inputs
  const [technicalDepth, setTechnicalDepth] = useState<number>(
    selectedPres?.rubricScore?.technicalDepth ?? 35
  );
  const [domainAccuracy, setDomainAccuracy] = useState<number>(
    selectedPres?.rubricScore?.domainAccuracy ?? 26
  );
  const [communicationSkill, setCommunicationSkill] = useState<number>(
    selectedPres?.rubricScore?.communicationSkill ?? 25
  );
  const [feedbackComments, setFeedbackComments] = useState<string>(
    selectedPres?.rubricScore?.detailedComments ?? ''
  );
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  // Sync state when selected presentation changes
  const handleSelectPresentation = (pres: PresentationSubmission) => {
    sound.playClick();
    setSelectedPresId(pres.id);
    setTechnicalDepth(pres.rubricScore?.technicalDepth ?? 35);
    setDomainAccuracy(pres.rubricScore?.domainAccuracy ?? 26);
    setCommunicationSkill(pres.rubricScore?.communicationSkill ?? 25);
    setFeedbackComments(pres.rubricScore?.detailedComments ?? '');
  };

  const totalScore = technicalDepth + domainAccuracy + communicationSkill;

  const handleSubmitEvaluation = (actionStatus: PresentationStatus) => {
    if (!selectedPres) return;

    sound.playClick();
    setIsSubmittingGrade(true);

    setTimeout(() => {
      const rubricScore: PresentationRubricScore = {
        technicalDepth,
        domainAccuracy,
        communicationSkill,
        totalScore,
        evaluatedBy: `${trainerName} (${trainerInstitute})`,
        evaluationDate: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        detailedComments: feedbackComments || (
          actionStatus === 'Graded'
            ? 'Demonstrated strong domain competence and clear scientific presentation. Approved for iGOT credits.'
            : 'Operational methodology needs revision. Please address feedback comments and resubmit.'
        )
      };

      const updated: PresentationSubmission = {
        ...selectedPres,
        status: actionStatus,
        rubricScore
      };

      onUpdateSubmission(updated);
      setIsSubmittingGrade(false);
      sound.playSuccess();
    }, 600);
  };

  const filteredSubmissions = submissions.filter((s) => {
    const matchDept = filterDepartment === 'all' || s.department.toLowerCase().includes(filterDepartment.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.status.toLowerCase().includes(filterStatus.toLowerCase());
    const matchQuery = !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.traineeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDept && matchStatus && matchQuery;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="liquid-glass-accent rounded-3xl p-6 sm:p-8 space-y-2 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/70 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                Faculty Seminar Evaluation Suite
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                Peer & Senior Scientist Review
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Trainee Presentation Review & Rubric Grading
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              Evaluator: <strong className="text-rose-700 dark:text-rose-400">{trainerName}</strong>
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          Review recorded video presentations and seminar decks submitted by probationary scientists and officers.
          Assign scores across standardized MoES rubric criteria (Technical Depth, Domain Accuracy, and Communication) and publish formal evaluation remarks.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by trainee or seminar title..."
            className="w-full pl-9.5 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Department Filter */}
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            <option value="all">All Institutes (MoES)</option>
            <option value="IMD">IMD Centers</option>
            <option value="INCOIS">INCOIS Hyderabad</option>
            <option value="NCMRWF">NCMRWF Noida</option>
            <option value="IITM">IITM Pune</option>
            <option value="NCPOR">NCPOR Goa</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted - In Review">Awaiting Review</option>
            <option value="Graded">Graded</option>
            <option value="Requires Resubmission">Requires Resubmission</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Submissions Directory (Left 4 cols) + Interactive Review & Rubric Panel (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Submissions Directory List (4 cols) */}
        <div className="lg:col-span-4 space-y-3 overflow-y-auto max-h-[750px] pr-1">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            Submitted Presentations ({filteredSubmissions.length})
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
              No presentations match your search criteria.
            </div>
          ) : (
            filteredSubmissions.map((sub) => {
              const isSelected = sub.id === selectedPres?.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => handleSelectPresentation(sub)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                      : 'bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                      {sub.department}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      sub.status === 'Graded'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : sub.status === 'Requires Resubmission'
                        ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    }`}>
                      {sub.status}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {sub.title}
                    </h5>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
                      Trainee: <strong className="text-slate-900 dark:text-slate-200">{sub.traineeName}</strong>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
                    <span className="font-mono text-[11px]">{sub.format} • {sub.durationOrPages}</span>
                    {sub.rubricScore && (
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {sub.rubricScore.totalScore}/100
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Presentation Video Player & Interactive Rubric Form (8 cols) */}
        <div className="lg:col-span-8">
          {selectedPres ? (
            <div className="liquid-glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 space-y-6 shadow-sm">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                      {selectedPres.department}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Submitted: {selectedPres.submittedAt}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {selectedPres.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Presenter: <strong className="text-slate-900 dark:text-white">{selectedPres.traineeName}</strong> • {selectedPres.courseTitle}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300">
                    {selectedPres.format} ({selectedPres.durationOrPages})
                  </span>
                </div>
              </div>

              {/* Video Player Preview Container */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center p-6 group shadow-inner">
                <img
                  src={selectedPres.mediaUrl}
                  alt={selectedPres.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 filter blur-[1px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                <div className="relative z-10 space-y-2">
                  <div 
                    onClick={() => sound.playClick()}
                    className="w-16 h-16 rounded-full bg-rose-600/60 border-2 border-rose-400 flex items-center justify-center text-white mx-auto shadow-xl group-hover:scale-110 transition cursor-pointer"
                  >
                    <Play className="w-8 h-8 ml-1 fill-white" />
                  </div>
                  <div className="text-white text-xs font-bold">
                    Play Trainee Operational Presentation
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono">
                    Stream Quality: High Definition (1080p) • Authenticated MoES Internal CDN
                  </p>
                </div>

                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-slate-400 z-10 font-mono">
                  <span>Trainee ID: {selectedPres.traineeId}</span>
                  <span>Review Status: {selectedPres.status}</span>
                </div>
              </div>

              {/* Presentation Abstract */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                <span className="font-bold text-slate-900 dark:text-white">Trainee Executive Abstract:</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  {selectedPres.summary}
                </p>
              </div>

              {/* Interactive Rubric Grading Form */}
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h5 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Interactive Rubric Evaluation
                  </h5>
                  <div className="flex items-baseline gap-1 bg-rose-50 dark:bg-rose-950 px-3 py-1 rounded-xl border border-rose-200 dark:border-rose-800">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Total Rubric Score:</span>
                    <span className="text-xl font-black text-rose-800 dark:text-rose-200 font-mono ml-1">
                      {totalScore}
                    </span>
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">/ 100</span>
                  </div>
                </div>

                {/* Rubric Sliders */}
                <div className="space-y-4">
                  
                  {/* Slider 1: Technical Depth (40 pts) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        1. Technical & Scientific Depth (Max 40 Pts)
                      </span>
                      <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                        {technicalDepth} / 40
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={technicalDepth}
                      onChange={(e) => setTechnicalDepth(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-600"
                    />
                    <p className="text-[10px] text-slate-500">
                      Mathematical rigor, inversion formulation, background covariance matrix formulation, error bounds.
                    </p>
                  </div>

                  {/* Slider 2: Domain Accuracy (30 pts) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        2. Domain Accuracy & MoES Guidelines (Max 30 Pts)
                      </span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {domainAccuracy} / 30
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={30}
                      value={domainAccuracy}
                      onChange={(e) => setDomainAccuracy(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <p className="text-[10px] text-slate-500">
                      WMO standard BUFR compliance, IMD radar color protocols, observational telemetry accuracy.
                    </p>
                  </div>

                  {/* Slider 3: Communication (30 pts) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        3. Communication & Presentation Skill (Max 30 Pts)
                      </span>
                      <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                        {communicationSkill} / 30
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={30}
                      value={communicationSkill}
                      onChange={(e) => setCommunicationSkill(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <p className="text-[10px] text-slate-500">
                      Slide clarity, chart readability, pacing, structured conclusions, operational defense readiness.
                    </p>
                  </div>

                </div>

                {/* Qualitative Trainer Comments */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Qualitative Feedback & Recommendation Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={feedbackComments}
                    onChange={(e) => setFeedbackComments(e.target.value)}
                    placeholder="Provide specific constructive observations for the probationary scientist..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-500">
                    Evaluator ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{trainerName}</span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={isSubmittingGrade}
                      onClick={() => handleSubmitEvaluation('Requires Resubmission')}
                      className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-700 dark:text-rose-300 border border-slate-200 dark:border-slate-700 font-bold text-xs transition cursor-pointer active:scale-95"
                    >
                      Request Resubmission
                    </button>

                    <button
                      type="button"
                      disabled={isSubmittingGrade}
                      onClick={() => handleSubmitEvaluation('Graded')}
                      className="flex-1 sm:flex-none min-h-[44px] px-6 py-2.5 rounded-xl bg-rose-700 dark:bg-rose-600 hover:bg-rose-800 dark:hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      {isSubmittingGrade ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>Submit Final Grade & Award Credits</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
              Select a presentation to evaluate.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
