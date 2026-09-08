import React, { useState, useRef } from 'react';
import { 
  ScientificAssignmentSubmission, 
  ScientificSubmissionStatus,
  ScoreBreakdown 
} from '../../types';
import { MOCK_ASSIGNMENT_TASKS } from '../../data/assignmentData';
import { 
  Upload, 
  FileCode, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  Terminal, 
  Layers, 
  ChevronRight, 
  Sliders, 
  ArrowUpRight,
  Database,
  Cpu,
  Sparkles,
  Info
} from 'lucide-react';
import { sound } from '../../utils/soundEffects';

interface AssignmentUploadCenterProps {
  traineeName: string;
  traineeId: string;
  submissions: ScientificAssignmentSubmission[];
  onNewSubmission: (submission: ScientificAssignmentSubmission) => void;
  onResubmit?: (submissionId: string) => void;
}

export const AssignmentUploadCenter: React.FC<AssignmentUploadCenterProps> = ({
  traineeName,
  traineeId,
  submissions,
  onNewSubmission,
  onResubmit
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(MOCK_ASSIGNMENT_TASKS[0].taskId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedSubmissionForDetails, setSelectedSubmissionForDetails] = useState<ScientificAssignmentSubmission | null>(
    submissions[0] || null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeTask = MOCK_ASSIGNMENT_TASKS.find((t) => t.taskId === selectedTaskId) || MOCK_ASSIGNMENT_TASKS[0];

  const allowedExtensions = ['.pdf', '.csv', '.json', '.py', '.ipynb'];

  const validateFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const isValidExt = allowedExtensions.some((ext) => fileName.endsWith(ext));
    if (!isValidExt) {
      alert(`Invalid file type. Supported extensions are: ${allowedExtensions.join(', ')}`);
      return false;
    }
    // Limit to 50MB
    if (file.size > 50 * 1024 * 1024) {
      alert('File size exceeds the 50MB benchmark task limit.');
      return false;
    }
    return true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleUploadSubmit = () => {
    if (!selectedFile) return;

    sound.playClick();
    setUploadProgress(15);

    const timer1 = setTimeout(() => setUploadProgress(55), 400);
    const timer2 = setTimeout(() => setUploadProgress(90), 800);
    const timer3 = setTimeout(() => {
      setUploadProgress(100);

      // Derive extension
      const name = selectedFile.name;
      const ext = ('.' + name.split('.').pop()) as '.pdf' | '.csv' | '.json' | '.py' | '.ipynb';

      const newSub: ScientificAssignmentSubmission = {
        id: `sub-${Date.now().toString().slice(-4)}`,
        taskId: activeTask.taskId,
        taskTitle: activeTask.title,
        courseTitle: activeTask.courseTitle,
        department: activeTask.department,
        traineeName,
        traineeId,
        submittedAt: new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }) + ' IST',
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
        fileType: ext,
        status: 'Pending Auto-Grade',
        resubmissionCount: 0,
        datasetBenchmarkTarget: activeTask.benchmarkTarget,
        feedbackNotes: 'Ingested into MoES automated HPC test harness. Auto-grader scheduled.',
        testCaseLogs: [
          {
            testId: 'TC-01',
            name: 'Containerized Syntax & Encoding Check',
            category: 'schema',
            passed: true,
            runtimeMs: 34,
            outputLog: `[PASS] File ${selectedFile.name} parsed successfully with UTF-8 encoding.`
          },
          {
            testId: 'TC-02',
            name: 'Operational Benchmark Target Assertion',
            category: 'accuracy',
            passed: true,
            runtimeMs: 98,
            outputLog: `[RUNNING] Evaluating dataset accuracy against ${activeTask.benchmarkTarget}.`
          }
        ]
      };

      onNewSubmission(newSub);
      setSelectedSubmissionForDetails(newSub);
      setSelectedFile(null);
      setUploadProgress(null);
      sound.playSuccess();
    }, 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (filterStatus === 'all') return true;
    return sub.status.toLowerCase().includes(filterStatus.toLowerCase());
  });

  const getStatusBadge = (status: ScientificSubmissionStatus) => {
    switch (status) {
      case 'Graded':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Graded
          </span>
        );
      case 'Pending Auto-Grade':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
            Pending Auto-Grade
          </span>
        );
      case 'Requires Resubmission':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Requires Resubmission
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="liquid-glass-accent rounded-3xl p-6 sm:p-8 space-y-3 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/70 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                MoES Scientific Lab Submissions
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                Auto-Evaluation Engine Active
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Assignment & Real-World Dataset Upload Portal
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-mono bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Database className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>HPC Containerized Runner</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          Submit raw scientific observations, radar sweeps, numerical simulation code, or operational technical reports.
          The automated runner performs containerized schema validation, anomaly detection precision tests, and algorithmic accuracy benchmarking against national standard baselines.
        </p>
      </div>

      {/* Main Grid: Upload Form & Task Selector (Left 7 cols) + Task Benchmark Info (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive Drag-and-Drop Uploader (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="liquid-glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 space-y-5 shadow-sm">
            
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Submit Scientific Task / Dataset</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Max 50MB
              </span>
            </div>

            {/* Task Selector */}
            <div className="space-y-1.5">
              <label htmlFor="task-select-input" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Active Scientific Task:
              </label>
              <select
                id="task-select-input"
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                {MOCK_ASSIGNMENT_TASKS.map((task) => (
                  <option key={task.taskId} value={task.taskId}>
                    [{task.department}] {task.title} ({task.difficulty})
                  </option>
                ))}
              </select>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 scale-[1.01]'
                  : selectedFile
                  ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 bg-slate-50/50 dark:bg-slate-900/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv,.json,.py,.ipynb"
                onChange={handleFileChange}
                className="hidden"
                id="scientific-file-input"
              />

              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-rose-600 dark:text-rose-400">
                {selectedFile ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                ) : (
                  <Upload className="w-7 h-7" />
                )}
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Container Ingestion
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Click or drag another file to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    Drag & Drop your scientific file here, or <span className="text-rose-600 dark:text-rose-400 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Supports <strong className="text-slate-700 dark:text-slate-300">.pdf, .csv, .json, .py, .ipynb</strong> up to 50MB
                  </p>
                </div>
              )}
            </div>

            {/* Upload Progress Simulation */}
            {uploadProgress !== null && (
              <div className="space-y-1.5 animate-in fade-in">
                <div className="flex justify-between text-xs font-mono text-slate-600 dark:text-slate-400">
                  <span>Uploading to HPC Scratch Storage...</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="button"
                id="submit-dataset-btn"
                disabled={!selectedFile || uploadProgress !== null}
                onClick={handleUploadSubmit}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-rose-700 dark:bg-rose-600 hover:bg-rose-800 dark:hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Cpu className="w-4 h-4" />
                <span>Submit Task for Auto-Grading</span>
              </button>
            </div>

          </div>
        </div>

        {/* Right: Active Task Benchmark Specification Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="liquid-glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                {activeTask.category}
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Due: {activeTask.deadline}
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                {activeTask.title}
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold">
                {activeTask.courseTitle}
              </p>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeTask.description}
            </p>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Benchmark Verification Criteria:</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 font-mono leading-relaxed">
                {activeTask.benchmarkTarget}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Supported File Formats:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeTask.supportedFormats.map((fmt) => (
                  <span
                    key={fmt}
                    className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Submissions List & Score Breakdown Cards Section */}
      <div className="space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-black text-slate-900 dark:text-white">
              Submitted Tasks & Auto-Grade Records ({submissions.length})
            </h4>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold overflow-x-auto">
            {['all', 'graded', 'pending', 'resubmission'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterStatus(f)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs capitalize transition cursor-pointer whitespace-nowrap ${
                  filterStatus === f
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f === 'resubmission' ? 'Requires Resubmission' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Submissions List Column (1 col on lg) */}
          <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
            {filteredSubmissions.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
                No submissions match the selected filter.
              </div>
            ) : (
              filteredSubmissions.map((sub) => {
                const isSelected = selectedSubmissionForDetails?.id === sub.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedSubmissionForDetails(sub);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                        : 'bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                        {sub.taskId}
                      </span>
                      {getStatusBadge(sub.status)}
                    </div>

                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white leading-snug line-clamp-1">
                        {sub.taskTitle}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {sub.fileName} ({sub.fileSize})
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {sub.submittedAt.split(',')[0]}
                      </span>
                      {sub.scoreBreakdown && (
                        <span className="font-black font-mono text-emerald-600 dark:text-emerald-400">
                          {sub.scoreBreakdown.totalScore} / 100
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Submission Detail & Score Breakdown Card (2 cols on lg) */}
          <div className="lg:col-span-2">
            {selectedSubmissionForDetails ? (
              <div className="liquid-glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 space-y-6 shadow-sm">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                        {selectedSubmissionForDetails.taskId}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedSubmissionForDetails.department}
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {selectedSubmissionForDetails.taskTitle}
                    </h4>
                  </div>
                  <div>
                    {getStatusBadge(selectedSubmissionForDetails.status)}
                  </div>
                </div>

                {/* Score Breakdown Cards (if graded or partial) */}
                {selectedSubmissionForDetails.scoreBreakdown ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        Automated Score Breakdown
                      </h5>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                          {selectedSubmissionForDetails.scoreBreakdown.totalScore}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">/ 100</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="text-[10px] font-semibold text-slate-500">Schema & Types</div>
                        <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                          {selectedSubmissionForDetails.scoreBreakdown.schemaIntegrity} <span className="text-xs font-normal text-slate-500">/ 25</span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: `${(selectedSubmissionForDetails.scoreBreakdown.schemaIntegrity / 25) * 100}%` }} 
                          />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="text-[10px] font-semibold text-slate-500">Algorithmic Precision</div>
                        <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                          {selectedSubmissionForDetails.scoreBreakdown.algorithmicPrecision} <span className="text-xs font-normal text-slate-500">/ 35</span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-rose-500 rounded-full" 
                            style={{ width: `${(selectedSubmissionForDetails.scoreBreakdown.algorithmicPrecision / 35) * 100}%` }} 
                          />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="text-[10px] font-semibold text-slate-500">Error Resilience</div>
                        <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                          {selectedSubmissionForDetails.scoreBreakdown.errorResilience} <span className="text-xs font-normal text-slate-500">/ 20</span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full" 
                            style={{ width: `${(selectedSubmissionForDetails.scoreBreakdown.errorResilience / 20) * 100}%` }} 
                          />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="text-[10px] font-semibold text-slate-500">Doc & WMO Standards</div>
                        <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                          {selectedSubmissionForDetails.scoreBreakdown.documentationStandards} <span className="text-xs font-normal text-slate-500">/ 20</span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${(selectedSubmissionForDetails.scoreBreakdown.documentationStandards / 20) * 100}%` }} 
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-spin shrink-0" />
                    <div>
                      <h5 className="font-bold text-xs text-amber-900 dark:text-amber-200">
                        Auto-Grade Test Runner In Progress
                      </h5>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300">
                        Test cases are executing against standard MoES telemetry suites. Score breakdown will display upon completion.
                      </p>
                    </div>
                  </div>
                )}

                {/* Trainer / Auto-Grader Feedback Notes */}
                {selectedSubmissionForDetails.feedbackNotes && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      Evaluation Logs & Reviewer Feedback:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                      {selectedSubmissionForDetails.feedbackNotes}
                    </p>
                  </div>
                )}

                {/* Containerized Test Case Logs Console */}
                {selectedSubmissionForDetails.testCaseLogs && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-bold flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" />
                        HPC Validation Runner Output ({selectedSubmissionForDetails.testCaseLogs.length} Tests)
                      </span>
                      <span className="font-mono text-[10px]">Container: moes-runner-v4.1</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs space-y-2 max-h-56 overflow-y-auto border border-slate-800">
                      {selectedSubmissionForDetails.testCaseLogs.map((log) => (
                        <div key={log.testId} className="space-y-0.5 border-b border-slate-800/80 pb-1.5 last:border-b-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">
                              [{log.testId}] {log.name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {log.runtimeMs}ms
                            </span>
                          </div>
                          <p className={`text-[11px] ${
                            log.passed ? 'text-emerald-400' : 'text-rose-400 font-semibold'
                          }`}>
                            {log.outputLog}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resubmission Action if Required */}
                {selectedSubmissionForDetails.status === 'Requires Resubmission' && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="space-y-0.5 text-center sm:text-left">
                      <div className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5 justify-center sm:justify-start">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Resubmission Required for Full Certification</span>
                      </div>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300">
                        Address the benchmark errors above and submit a corrected dataset to improve your score.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTaskId(selectedSubmissionForDetails.taskId);
                        fileInputRef.current?.click();
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition whitespace-nowrap active:scale-95 cursor-pointer"
                    >
                      Resubmit Corrected File
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
                Select a submission from the list to view its score breakdown and automated logs.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
