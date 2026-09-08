import React, { useState, useRef } from 'react';
import { PresentationSubmission, PresentationStatus, PresentationRubricScore } from '../../types';
import { 
  Video, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Play, 
  Sliders, 
  Award, 
  Layers, 
  UserCheck, 
  ExternalLink,
  Presentation,
  Sparkles,
  Info
} from 'lucide-react';
import { sound } from '../../utils/soundEffects';
import { checkUpload, safeLine, secureId, UPLOAD_RULES } from '../../lib/security';

interface PresentationUploadCenterProps {
  traineeName: string;
  traineeId: string;
  department: string;
  submissions: PresentationSubmission[];
  onNewPresentation: (submission: PresentationSubmission) => void;
}

export const PresentationUploadCenter: React.FC<PresentationUploadCenterProps> = ({
  traineeName,
  traineeId,
  department,
  submissions,
  onNewPresentation
}) => {
  const [title, setTitle] = useState('');
  const [seminarTopic, setSeminarTopic] = useState('');
  const [courseTitle, setCourseTitle] = useState('Doppler Radar Meteorology & Severe Storm Tracking');
  const [format, setFormat] = useState<'MP4' | 'WebM' | 'PDF/PPTX'>('MP4');
  const [durationOrPages, setDurationOrPages] = useState('12 mins (1080p)');
  const [summary, setSummary] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedPresForView, setSelectedPresForView] = useState<PresentationSubmission | null>(
    submissions[0] || null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const courseOptions = [
    'Doppler Radar Meteorology & Severe Storm Tracking',
    'Numerical Weather Prediction: WRF & NCUM Operational Modeling',
    'Seismological Data Inversion & Tsunami Warning',
    'Polar Earth Sciences & Cryosphere Modeling',
    'Agricultural Meteorology & District Forecast Advisory'
  ];

  // Seminar media types declared by the `accept` attribute, enforced in code:
  // the attribute alone is trivially bypassed by a drag & drop or a proxy.
  const PRESENTATION_EXTENSIONS = ['.mp4', '.webm', '.pdf', '.pptx'];

  const acceptFile = (file: File | undefined | null): File | null => {
    if (!file) return null;
    const verdict = checkUpload(file, { allowedExtensions: PRESENTATION_EXTENSIONS, maxBytes: UPLOAD_RULES.maxBytes });
    if (!verdict.ok) {
      alert(verdict.reason ?? 'That file cannot be accepted.');
      return null;
    }
    return file;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const accepted = acceptFile(e.target.files[0]);
      if (accepted) setSelectedFile(accepted);
      // Allow re-picking the same file after a rejected attempt.
      e.target.value = '';
    }
  };

  const handlePresentationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !seminarTopic.trim()) {
      alert('Please provide a presentation title and seminar topic.');
      return;
    }

    sound.playClick();
    setUploadProgress(20);

    const timer1 = setTimeout(() => setUploadProgress(65), 500);
    const timer2 = setTimeout(() => {
      setUploadProgress(100);

      const newPres: PresentationSubmission = {
        id: secureId('pres', 4).toLowerCase(),
        title,
        seminarTopic,
        courseTitle,
        traineeName,
        traineeId,
        department,
        submittedAt: new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }) + ' IST',
        format,
        mediaUrl: format === 'PDF/PPTX' 
          ? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800'
          : 'https://images.unsplash.com/photo-1590055531615-f16d36ffe8ec?auto=format&fit=crop&q=80&w=800',
        durationOrPages: durationOrPages || (format === 'PDF/PPTX' ? '24 Slides (PDF)' : '12 mins'),
        fileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '38.4 MB',
        status: 'Submitted - In Review',
        summary: summary || `Presentation on ${seminarTopic} prepared for ${courseTitle} by ${traineeName}.`,
        rubricScore: undefined
      };

      onNewPresentation(newPres);
      setSelectedPresForView(newPres);
      setTitle('');
      setSeminarTopic('');
      setSummary('');
      setSelectedFile(null);
      setUploadProgress(null);
      sound.playSuccess();
    }, 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  };

  const getStatusBadge = (status: PresentationStatus) => {
    switch (status) {
      case 'Graded':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Graded
          </span>
        );
      case 'Submitted - In Review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Submitted - In Review
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
                MoES Scientific Seminar & Defense
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                Formal Presentation Protocol
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Presentation & Video Seminar Submission Center
            </h3>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Video className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>MP4 • WebM • PDF / PPTX</span>
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          Submit recorded operational presentations or slide decks for your assigned meteorological, oceanographic, or climate modules.
          Faculty trainers review submissions against a structured rubric evaluating technical depth, communication clarity, and adherence to operational Ministry procedures.
        </p>
      </div>

      {/* Main Grid: Upload Card (Left 7 cols) + Rubric Preview Card (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Presentation Upload Card (7 cols) */}
        <div className="lg:col-span-7">
          <form 
            onSubmit={handlePresentationSubmit}
            className="liquid-glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Presentation className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Upload New Presentation or Seminar</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Step 1 of 2
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Presentation Title:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 160))}
                  placeholder="e.g., Kalbaishakhi Severe Squall Line Radar Inversion"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  maxLength={160}
                  />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Seminar Topic / Specialty:
                </label>
                <input
                  type="text"
                  required
                  value={seminarTopic}
                  onChange={(e) => setSeminarTopic(e.target.value.slice(0, 160))}
                  placeholder="e.g., Doppler Radar Clutter Filtering"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  maxLength={160}
                  />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Associated Course:
                </label>
                <select
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {courseOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Presentation Format:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['MP4', 'WebM', 'PDF/PPTX'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormat(fmt)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        format === fmt
                          ? 'bg-slate-900 dark:bg-rose-600 text-white border-transparent shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Duration or Page Count:
                </label>
                <input
                  type="text"
                  value={durationOrPages}
                  onChange={(e) => setDurationOrPages(e.target.value.slice(0, 240))}
                  placeholder="e.g. 14 mins (1080p) or 26 slides"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  maxLength={240}
                  />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Executive Abstract / Methodology Summary:
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value.slice(0, 240))}
                  placeholder="Brief description of the observational methods, data sources, and findings demonstrated in this presentation..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  maxLength={240}
                  />
              </div>

            </div>

            {/* File Drag/Attach Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-rose-400 bg-slate-50/50 dark:bg-slate-900/40 text-center cursor-pointer transition flex items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp4,.webm,.pdf,.pptx"
                onChange={handleFileChange}
                className="hidden"
              />
              <Video className="w-5 h-5 text-rose-500" />
              <div className="text-xs text-slate-600 dark:text-slate-300">
                {selectedFile ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                ) : (
                  <span>Click to attach recorded {format} file or presentation deck (up to 200MB)</span>
                )}
              </div>
            </div>

            {uploadProgress !== null && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-slate-500">
                  <span>Uploading presentation stream...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-rose-600 rounded-full" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                id="submit-presentation-btn"
                disabled={uploadProgress !== null}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-rose-700 dark:bg-rose-600 hover:bg-rose-800 dark:hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>Submit Presentation for Evaluation</span>
              </button>
            </div>

          </form>
        </div>

        {/* Right: Rubric Preview Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="liquid-glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 space-y-4 shadow-sm">
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Evaluation Standards
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" /> 100 PTS Total
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                Faculty Grading Rubric Preview
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                How trainers evaluate your seminar before publishing certification credits:
              </p>
            </div>

            {/* Rubric Criteria Cards */}
            <div className="space-y-3 pt-1">
              
              {/* Criterion 1: Technical Depth (40%) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    1. Technical & Scientific Depth
                  </span>
                  <span className="font-mono font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                    40 Points
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Rigorous mathematical formulation, algorithm explanation (e.g. 4D-Var, Doppler de-aliasing), calibration fidelity, and analytical interpretation of error margins.
                </p>
              </div>

              {/* Criterion 2: Domain Accuracy (30%) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    2. Domain Accuracy & MoES Protocols
                  </span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    30 Points
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Conformance with IMD/INCOIS operational guidelines, WMO BUFR conventions, correct terminology, and handling of live telemetry constraints.
                </p>
              </div>

              {/* Criterion 3: Communication Skill (30%) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    3. Communication & Presentation Skill
                  </span>
                  <span className="font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                    30 Points
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Visual clarity of charts and figures, slide design, vocal pacing, response to hypothetical operational edge cases, and presentation structure.
                </p>
              </div>

            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Score &gt; 70 Points qualifies for 50 iGOT National Karma Points.</span>
            </div>

          </div>
        </div>

      </div>

      {/* Trainee Presentation Submissions List & Detailed Viewer */}
      <div className="space-y-4">
        <h4 className="text-lg font-black text-slate-900 dark:text-white">
          Your Submitted Presentations ({submissions.length})
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Submissions Cards */}
          <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
            {submissions.map((pres) => {
              const isSelected = selectedPresForView?.id === pres.id;
              return (
                <div
                  key={pres.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedPresForView(pres);
                  }}
                  className={`p-4 rounded-2xl border transition cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                      : 'bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {pres.format}
                    </span>
                    {getStatusBadge(pres.status)}
                  </div>

                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {pres.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {pres.courseTitle}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
                    <span>{pres.durationOrPages}</span>
                    {pres.rubricScore && (
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {pres.rubricScore.totalScore} / 100
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Preview & Evaluation View */}
          <div className="lg:col-span-2">
            {selectedPresForView ? (
              <div className="liquid-glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 space-y-6 shadow-sm">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      {selectedPresForView.department} • {selectedPresForView.format}
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                      {selectedPresForView.title}
                    </h4>
                  </div>
                  <div>
                    {getStatusBadge(selectedPresForView.status)}
                  </div>
                </div>

                {/* Inline Media Player Simulation */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex flex-col items-center justify-center text-center p-6 group">
                  <img
                    src={selectedPresForView.mediaUrl}
                    alt={selectedPresForView.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-35 filter blur-[1px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                  <div className="relative z-10 space-y-2">
                    <div className="w-14 h-14 rounded-full bg-rose-500/40 border-2 border-rose-400 flex items-center justify-center text-white mx-auto shadow-lg group-hover:scale-105 transition cursor-pointer">
                      <Play className="w-7 h-7 ml-0.5 fill-white" />
                    </div>
                    <div className="text-white text-xs font-bold">
                      Interactive Lecture Seminar Playback
                    </div>
                    <p className="text-[11px] text-slate-300 font-mono">
                      {selectedPresForView.durationOrPages} • Stream Encrypted (AES-256)
                    </p>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] text-slate-400 z-10 font-mono">
                    <span>MoES Video Telemetry Repository</span>
                    <span>Trainee: {selectedPresForView.traineeName}</span>
                  </div>
                </div>

                {/* Summary Abstract */}
                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-white">Seminar Abstract:</span>
                  <p className="leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    {selectedPresForView.summary}
                  </p>
                </div>

                {/* Evaluator Rubric Feedback & Breakdown (if graded) */}
                {selectedPresForView.rubricScore ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-black text-xs text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                          Official Trainer Evaluation & Grade
                        </span>
                      </div>
                      <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                        {selectedPresForView.rubricScore.totalScore} / 100
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800">
                        <span className="text-[10px] text-slate-500 block">Tech Depth</span>
                        <strong className="font-mono text-slate-900 dark:text-white">
                          {selectedPresForView.rubricScore.technicalDepth} / 40
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800">
                        <span className="text-[10px] text-slate-500 block">Domain Acc</span>
                        <strong className="font-mono text-slate-900 dark:text-white">
                          {selectedPresForView.rubricScore.domainAccuracy} / 30
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800">
                        <span className="text-[10px] text-slate-500 block">Communication</span>
                        <strong className="font-mono text-slate-900 dark:text-white">
                          {selectedPresForView.rubricScore.communicationSkill} / 30
                        </strong>
                      </div>
                    </div>

                    {selectedPresForView.rubricScore.detailedComments && (
                      <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white text-[11px] flex items-center justify-between">
                          <span>Reviewer Remarks:</span>
                          <span className="font-normal text-slate-500">{selectedPresForView.rubricScore.evaluatedBy}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 italic">
                          "{selectedPresForView.rubricScore.detailedComments}"
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <h5 className="font-bold text-xs text-amber-900 dark:text-amber-200">
                        Awaiting Faculty Trainer Evaluation
                      </h5>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300">
                        This presentation has been submitted and queued for review by the lead scientist of this course. Rubric scores will appear here once evaluated.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
                Select a presentation from the list to view video playback and rubric evaluation.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
