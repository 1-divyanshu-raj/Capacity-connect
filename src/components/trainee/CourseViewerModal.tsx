import React, { useState } from 'react';
import { Course, CourseModule } from '../../types';
import { useHeartbeatTracking } from '../../hooks/useHeartbeatTracking';
import { 
  X, 
  PlayCircle, 
  PauseCircle,
  CheckCircle2, 
  FileText, 
  Download, 
  Award, 
  Clock, 
  BookOpen, 
  Building2,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  Activity,
  FastForward,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { sound } from '../../utils/soundEffects';

interface CourseViewerModalProps {
  course: Course;
  onClose: () => void;
  onStartAssessment?: (assessmentId: string) => void;
}

export const CourseViewerModal: React.FC<CourseViewerModalProps> = ({ 
  course, 
  onClose,
  onStartAssessment 
}) => {
  const [selectedModule, setSelectedModule] = useState<CourseModule>(course.modules[0] || {
    id: 'm-default',
    title: 'Module Overview',
    duration: '45 mins',
  });

  const [isPlaying, setIsPlaying] = useState(true);
  const [simulatedPlayheadSeconds, setSimulatedPlayheadSeconds] = useState(45);
  const [skipWarningMessage, setSkipWarningMessage] = useState<string | null>(null);

  // Client-side Heartbeat Hook for engagement tracking & anti-skipping
  const {
    isActive,
    isIdle,
    isHidden,
    isSkippingDetected,
    activeSeconds,
    engagementVerified,
    statusLabel,
    verifiedPercentage,
    reportPlaybackPosition,
    resetHeartbeat,
  } = useHeartbeatTracking({
    totalDurationSeconds: 180, // 3 mins threshold for simulation demo
    idleTimeoutSeconds: 60,
    skipThresholdSeconds: 15,
    onEngagementVerified: () => {
      sound.playSuccess();
    },
    onSkippingAttempted: (jump) => {
      sound.playError();
      setSkipWarningMessage(`Anti-Skip Triggered: Fast-forwarded +${Math.round(jump)}s beyond verified threshold. Progress paused.`);
      setTimeout(() => setSkipWarningMessage(null), 5000);
    }
  });

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Simulate user fast-forwarding to test anti-skipping
  const handleFastForwardSimulation = () => {
    sound.playClick();
    const jumpTo = simulatedPlayheadSeconds + 35; // jumps 35s forward (> 15s limit)
    setSimulatedPlayheadSeconds(jumpTo);
    reportPlaybackPosition(jumpTo);
  };

  const handleNormalAdvance = () => {
    const next = simulatedPlayheadSeconds + 5;
    setSimulatedPlayheadSeconds(next);
    reportPlaybackPosition(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl liquid-glass rounded-3xl border border-white/80 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] bg-white dark:bg-slate-900">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
              {course.department} • {course.category}
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              {course.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
          
          {/* Left / Main Player Area (2 cols) */}
          <div className="lg:col-span-2 p-6 overflow-y-auto space-y-5 bg-white/70 dark:bg-slate-900/90">
            
            {/* Active Time & Anti-Skipping Heartbeat Live HUD */}
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
              
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <span className={`w-3.5 h-3.5 rounded-full ${
                    isHidden || isSkippingDetected
                      ? 'bg-rose-500 animate-ping'
                      : isIdle
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-emerald-400 animate-ping'
                  }`} />
                  <span className={`absolute w-2 h-2 rounded-full ${
                    isHidden || isSkippingDetected
                      ? 'bg-rose-500'
                      : isIdle
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`} />
                </div>

                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold tracking-tight">
                      {statusLabel}
                    </span>
                    {engagementVerified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Active Time: <strong className="text-emerald-300">{formatSeconds(activeSeconds)}</strong> • Verification: {verifiedPercentage}%
                  </p>
                </div>
              </div>

              {/* Anti-Skipping / Interactive Simulation Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  title="Test anti-skipping by fast-forwarding > 15 seconds"
                  onClick={handleFastForwardSimulation}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] font-mono flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <FastForward className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test Fast-Forward (+35s)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer"
                >
                  {isPlaying ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                </button>
              </div>

            </div>

            {/* Warning Banner when Paused / Skipped */}
            {(isHidden || isIdle || isSkippingDetected || skipWarningMessage) && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold">
                    {skipWarningMessage || (
                      isHidden 
                        ? 'Tab or Window Hidden — Active engagement timer is paused'
                        : isIdle 
                        ? 'Trainee Inactive (>60s) — Move mouse or interact with the lesson to resume'
                        : 'Anti-Skipping Protected Content'
                    )}
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300">
                    MoES certification guidelines mandate verified presence without unattended playback or artificial fast-forwarding.
                  </p>
                </div>
              </div>
            )}

            {/* Video Lecture Simulation Container */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-md border border-slate-800 flex flex-col items-center justify-center text-center p-6 group">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent pointer-events-none" />
              
              <div className="relative z-10 space-y-3">
                <div 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 rounded-full bg-rose-500/30 border-2 border-rose-400 flex items-center justify-center text-rose-300 mx-auto shadow-lg group-hover:scale-110 transition cursor-pointer"
                >
                  {isPlaying ? <PauseCircle className="w-9 h-9" /> : <PlayCircle className="w-9 h-9" />}
                </div>
                <div>
                  <h4 className="text-white font-bold text-base">
                    {selectedModule.title}
                  </h4>
                  <p className="text-xs text-slate-300">
                    Duration: {selectedModule.duration} • Instructor: {course.instructor}
                  </p>
                </div>
              </div>

              {/* Floating Bottom Bar with Engagement Seal */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-slate-400 z-10">
                <span className="flex items-center gap-1.5 font-mono">
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  MoES Official Lecture Stream (1080p)
                </span>
                
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 flex items-center gap-1 text-[10px] bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    Heartbeat Verified
                  </span>
                  <span className="font-mono">Gov-CDN Verified</span>
                </div>
              </div>
            </div>

            {/* Module Transcript & Lecture Notes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Official Lecture Notes & Operational Transcript
                </h4>
                <button
                  onClick={() => alert(`Downloading official MoES lecture notes for "${selectedModule.title}" (PDF)`)}
                  className="text-xs font-semibold text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 leading-relaxed shadow-sm space-y-2">
                <p>
                  {selectedModule.transcriptSnippet || 
                    `In this operational training session for ${course.title}, we review standard calibration procedures, data ingestion pipeline from national satellite telemetry, and real-time visualization on the IMD GIS platform.`
                  }
                </p>
                <p className="text-slate-500 dark:text-slate-400 italic">
                  Reference: {selectedModule.readingMaterial || 'MoES Standard Technical Guideline 2026, Ministry of Earth Sciences.'}
                </p>
              </div>
            </div>

            {/* Assessment Callout */}
            {course.assessmentId && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/50 dark:to-red-950/50 border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5 justify-center sm:justify-start">
                    <Award className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Subject Certification Assessment Ready
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Complete the 5-MCQ timed evaluation to qualify for your official Ministry Certificate (Score &gt; 70%).
                  </p>
                </div>
                <button
                  id="start-course-assessment-btn"
                  onClick={() => {
                    onClose();
                    if (onStartAssessment && course.assessmentId) {
                      onStartAssessment(course.assessmentId);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-md transition whitespace-nowrap active:scale-95 cursor-pointer"
                >
                  Start Assessment Quiz
                </button>
              </div>
            )}

          </div>

          {/* Right Syllabus / Modules Sidebar */}
          <div className="p-6 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                Course Syllabus ({course.modules.length} Modules)
              </h4>
              <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-400">
                {course.progress}% Completed
              </span>
            </div>

            <div className="space-y-2">
              {course.modules.map((mod, idx) => {
                const isSelected = selectedModule.id === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedModule(mod)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 border-rose-400 dark:border-rose-500 shadow-md shadow-rose-900/5'
                        : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                      isSelected ? 'bg-rose-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}>
                      {idx + 1}
                    </span>

                    <div className="flex-1 space-y-0.5">
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                        {mod.title}
                      </h5>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {mod.duration}
                      </span>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Engagement Status Capsule */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Anti-Skip Protection:
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  ENFORCED
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Lectures require continuous tab presence. Idle timeout triggers after 60 seconds of inactivity.
              </p>
            </div>

            {/* Course Meta Info */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Duration:</span>
                <strong className="text-slate-900 dark:text-white">{course.durationWeeks} Weeks</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Level:</span>
                <span className="font-bold text-rose-700 dark:text-rose-400">{course.level}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Enrolled Personnel:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{course.enrolledCount} Scientists</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
