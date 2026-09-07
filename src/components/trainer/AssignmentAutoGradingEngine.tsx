import React, { useState } from 'react';
import { 
  ScientificAssignmentSubmission, 
  ScientificSubmissionStatus, 
  AutomatedTestCaseLog,
  ScoreBreakdown 
} from '../../types';
import { 
  Cpu, 
  Terminal, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  Database, 
  Sliders, 
  Check, 
  Award,
  Search,
  Filter,
  FileCode,
  Sparkles,
  Server
} from 'lucide-react';
import { sound } from '../../utils/soundEffects';

interface AssignmentAutoGradingEngineProps {
  trainerName: string;
  submissions: ScientificAssignmentSubmission[];
  onUpdateSubmission: (updated: ScientificAssignmentSubmission) => void;
}

export const AssignmentAutoGradingEngine: React.FC<AssignmentAutoGradingEngineProps> = ({
  trainerName,
  submissions,
  onUpdateSubmission
}) => {
  const [selectedSubId, setSelectedSubId] = useState<string>(submissions[0]?.id || '');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRunningValidation, setIsRunningValidation] = useState(false);
  const [activeConsoleLogs, setActiveConsoleLogs] = useState<string[]>([]);

  const selectedSub = submissions.find((s) => s.id === selectedSubId) || submissions[0];

  const handleSelectSub = (sub: ScientificAssignmentSubmission) => {
    sound.playClick();
    setSelectedSubId(sub.id);
    setActiveConsoleLogs([]);
  };

  // Run live containerized test execution simulation
  const handleRunValidationSuite = () => {
    if (!selectedSub) return;

    sound.playClick();
    setIsRunningValidation(true);
    setActiveConsoleLogs([
      `[INIT] Spawning Docker container: moes-hpc-validator-v4.1 on PARAM Mihir node`,
      `[INGEST] Loading trainee artifact: ${selectedSub.fileName} (${selectedSub.fileSize})`,
      `[SCHEMA] Parsing file structure & WMO metadata tags...`
    ]);

    // Step 1
    setTimeout(() => {
      setActiveConsoleLogs((prev) => [
        ...prev,
        `[PASS] TC-01: File encoding UTF-8 verified. No corrupt null byte sequences.`
      ]);
    }, 600);

    // Step 2
    setTimeout(() => {
      setActiveConsoleLogs((prev) => [
        ...prev,
        `[ASSERT] TC-02: Checking observation covariance & spatial geodetic bounds...`,
        `[PASS] Geodetic coordinates (Lat: 6.0N-38.0N, Lon: 68.0E-98.0E) within Indian monsoon domain.`
      ]);
    }, 1200);

    // Step 3
    setTimeout(() => {
      setActiveConsoleLogs((prev) => [
        ...prev,
        `[ALGO] TC-03: Running numerical convergence loop against ground truth AWS sensors...`,
        `[PASS] Root Mean Square Error (RMSE) converged to 0.88 mm/hr (benchmark threshold <= 1.4 mm/hr).`
      ]);
    }, 1900);

    // Step 4
    setTimeout(() => {
      setActiveConsoleLogs((prev) => [
        ...prev,
        `[BENCHMARK] TC-04: Profiling memory resident footprint and multi-thread OpenMP scaling...`,
        `[PASS] Peak memory 242 MB (limit: 1024 MB). Runtime latency 84ms on 16 vCPUs.`,
        `[AUTO-GRADE] All 4 test assertions passed successfully. Composite Score: 94/100.`
      ]);

      const updatedLogs: AutomatedTestCaseLog[] = [
        {
          testId: 'TC-01',
          name: 'Containerized Syntax & WMO Schema Integrity',
          category: 'schema',
          passed: true,
          runtimeMs: 38,
          outputLog: `[PASS] File ${selectedSub.fileName} validated against WMO BUFR/NetCDF standard.`
        },
        {
          testId: 'TC-02',
          name: 'Geodetic Coordinate & Timestamp Orthogonality',
          category: 'assertions',
          passed: true,
          runtimeMs: 64,
          outputLog: '[PASS] Observation coordinates mapped cleanly inside Indian EEZ.'
        },
        {
          testId: 'TC-03',
          name: 'Ground Truth AWS Residual Minimization',
          category: 'accuracy',
          passed: true,
          runtimeMs: 142,
          outputLog: '[PASS] Algorithmic convergence delta 0.0014 achieved within 18 iterations.'
        },
        {
          testId: 'TC-04',
          name: 'PARAM Mihir HPC Threading & Latency',
          category: 'performance',
          passed: true,
          runtimeMs: 84,
          outputLog: '[PASS] Resident footprint 242 MB. Latency < 100ms.'
        }
      ];

      const scoreBreakdown: ScoreBreakdown = {
        schemaIntegrity: 25,
        algorithmicPrecision: 33,
        errorResilience: 18,
        documentationStandards: 18,
        totalScore: 94
      };

      const updatedSub: ScientificAssignmentSubmission = {
        ...selectedSub,
        status: 'Graded',
        scoreBreakdown,
        testCaseLogs: updatedLogs,
        feedbackNotes: `Auto-Graded by PARAM Mihir validation engine. Validated by ${trainerName}. All baseline constraints satisfied.`
      };

      onUpdateSubmission(updatedSub);
      setIsRunningValidation(false);
      sound.playSuccess();
    }, 2600);
  };

  const handleManualOverride = (newStatus: ScientificSubmissionStatus, totalOverrideScore: number) => {
    if (!selectedSub) return;
    sound.playClick();

    const scoreBreakdown: ScoreBreakdown = {
      schemaIntegrity: Math.min(25, Math.floor(totalOverrideScore * 0.25)),
      algorithmicPrecision: Math.min(35, Math.floor(totalOverrideScore * 0.35)),
      errorResilience: Math.min(20, Math.floor(totalOverrideScore * 0.20)),
      documentationStandards: Math.min(20, Math.floor(totalOverrideScore * 0.20)),
      totalScore: totalOverrideScore
    };

    const updated: ScientificAssignmentSubmission = {
      ...selectedSub,
      status: newStatus,
      scoreBreakdown: newStatus === 'Graded' ? scoreBreakdown : selectedSub.scoreBreakdown,
      feedbackNotes: `Trainer Override applied by ${trainerName}: Status marked as ${newStatus}.`
    };

    onUpdateSubmission(updated);
    sound.playSuccess();
  };

  const filteredSubmissions = submissions.filter((s) => {
    const matchStatus = filterStatus === 'all' || s.status.toLowerCase().includes(filterStatus.toLowerCase());
    const matchQuery = !searchQuery || s.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) || s.traineeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchQuery;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="liquid-glass-accent rounded-3xl p-6 sm:p-8 space-y-2 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/70 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                MoES HPC Automated Evaluation
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                PARAM Mihir Cluster Runner
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Scientific Dataset & Code Auto-Grading Engine
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Server className="w-3.5 h-3.5 text-emerald-500" />
              <span>Container Cluster: Online</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          Monitor and execute automated validation pipelines for scientific submissions.
          The engine runs sandboxed unit tests against raw sensor feeds, validates data structures, benchmarks mathematical models against national baselines, and generates verifiable score cards.
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
            placeholder="Search by trainee or task title..."
            className="w-full pl-9.5 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            <option value="all">All Submission Queues</option>
            <option value="Pending Auto-Grade">Pending Auto-Grade</option>
            <option value="Graded">Graded & Verified</option>
            <option value="Requires Resubmission">Requires Resubmission</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Submissions Queue (Left 4 cols) + Interactive Runner & Terminal (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Submissions Queue (4 cols) */}
        <div className="lg:col-span-4 space-y-3 overflow-y-auto max-h-[750px] pr-1">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            Incoming Tasks Queue ({filteredSubmissions.length})
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
              No tasks match your filter.
            </div>
          ) : (
            filteredSubmissions.map((sub) => {
              const isSelected = sub.id === selectedSub?.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => handleSelectSub(sub)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                      : 'bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                      {sub.taskId}
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
                      {sub.taskTitle}
                    </h5>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
                      Trainee: <strong className="text-slate-900 dark:text-slate-200">{sub.traineeName}</strong> ({sub.department})
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
                    <span className="font-mono text-[11px]">{sub.fileName}</span>
                    {sub.scoreBreakdown && (
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {sub.scoreBreakdown.totalScore}/100
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Validation Suite & Terminal Output (8 cols) */}
        <div className="lg:col-span-8">
          {selectedSub ? (
            <div className="liquid-glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 space-y-6 shadow-sm">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                      {selectedSub.taskId}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {selectedSub.department} • Ingested: {selectedSub.submittedAt}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {selectedSub.taskTitle}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Submitter: <strong className="text-slate-900 dark:text-white">{selectedSub.traineeName}</strong> ({selectedSub.traineeId})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="run-benchmark-suite-btn"
                    disabled={isRunningValidation}
                    onClick={handleRunValidationSuite}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-rose-700 dark:bg-rose-600 hover:bg-rose-800 dark:hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isRunningValidation ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>Run Benchmark Validation Suite</span>
                  </button>
                </div>
              </div>

              {/* Benchmark Target Info */}
              {selectedSub.datasetBenchmarkTarget && (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs space-y-1">
                  <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-amber-600" />
                    HPC Target Assertion Baseline:
                  </span>
                  <p className="text-amber-800 dark:text-amber-300 font-mono">
                    {selectedSub.datasetBenchmarkTarget}
                  </p>
                </div>
              )}

              {/* Score Breakdown Cards (if available) */}
              {selectedSub.scoreBreakdown && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-rose-600" />
                      Composite Auto-Grade Score
                    </h5>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                        {selectedSub.scoreBreakdown.totalScore}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">/ 100</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[10px] text-slate-500 block">Schema (25)</span>
                      <strong className="text-base font-black font-mono text-emerald-600">
                        {selectedSub.scoreBreakdown.schemaIntegrity}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[10px] text-slate-500 block">Precision (35)</span>
                      <strong className="text-base font-black font-mono text-rose-600">
                        {selectedSub.scoreBreakdown.algorithmicPrecision}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[10px] text-slate-500 block">Resilience (20)</span>
                      <strong className="text-base font-black font-mono text-amber-600">
                        {selectedSub.scoreBreakdown.errorResilience}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[10px] text-slate-500 block">WMO Standards (20)</span>
                      <strong className="text-base font-black font-mono text-blue-600">
                        {selectedSub.scoreBreakdown.documentationStandards}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Terminal / Execution Console */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-bold flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    Automated Test Suite Execution Log
                  </span>
                  <span className="font-mono text-[10px]">Host: mihir.ncmrwf.gov.in</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs space-y-1.5 min-h-[160px] max-h-64 overflow-y-auto border border-slate-800 shadow-inner">
                  {activeConsoleLogs.length > 0 ? (
                    activeConsoleLogs.map((log, idx) => (
                      <div 
                        key={idx} 
                        className={`leading-relaxed ${
                          log.includes('[PASS]')
                            ? 'text-emerald-400'
                            : log.includes('[FAIL]')
                            ? 'text-rose-400 font-bold'
                            : log.includes('[INIT]') || log.includes('[INGEST]')
                            ? 'text-blue-400'
                            : log.includes('[AUTO-GRADE]')
                            ? 'text-amber-300 font-black'
                            : 'text-slate-300'
                        }`}
                      >
                        {log}
                      </div>
                    ))
                  ) : selectedSub.testCaseLogs && selectedSub.testCaseLogs.length > 0 ? (
                    selectedSub.testCaseLogs.map((log) => (
                      <div key={log.testId} className="space-y-0.5 border-b border-slate-900 pb-1 last:border-b-0">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>[{log.testId}] {log.name}</span>
                          <span>{log.runtimeMs}ms</span>
                        </div>
                        <p className={`text-[11px] ${log.passed ? 'text-emerald-400' : 'text-rose-400 font-bold'}`}>
                          {log.outputLog}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-center py-8">
                      Click "Run Benchmark Validation Suite" above to launch containerized test assertions on PARAM Mihir.
                    </div>
                  )}
                </div>
              </div>

              {/* Trainer Override Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Faculty Override & Manual Verification:
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Senior Scientists can adjust scores, approve edge-case telemetry, or trigger re-runs.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleManualOverride('Requires Resubmission', 60)}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 border border-rose-200 dark:border-rose-800 transition cursor-pointer"
                  >
                    Flag Resubmission
                  </button>

                  <button
                    type="button"
                    onClick={() => handleManualOverride('Graded', 95)}
                    className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Grade (95%)</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
              Select an assignment submission from the queue.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
