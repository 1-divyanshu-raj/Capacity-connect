import React, { useState } from 'react';
import { 
  UserProfile, 
  Course, 
  Assessment, 
  QuizResult, 
  ScientificAssignmentSubmission, 
  PresentationSubmission 
} from '../../types';
import { 
  INITIAL_ASSIGNMENT_SUBMISSIONS, 
  INITIAL_PRESENTATION_SUBMISSIONS 
} from '../../data/assignmentData';
import { CourseCenter } from './CourseCenter';
import { TraineeProfile } from './TraineeProfile';
import { CourseViewerModal } from './CourseViewerModal';
import { AssessmentPlayer } from './AssessmentPlayer';
import { CertificateModal } from './CertificateModal';
import { AICoPilotWidget } from './AICoPilotWidget';
import { AssignmentUploadCenter } from './AssignmentUploadCenter';
import { PresentationUploadCenter } from './PresentationUploadCenter';
import { DiscussionForums } from '../common/DiscussionForums';
import { 
  BookOpen, 
  UserCheck, 
  Award, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles,
  Compass,
  FileCheck,
  ChevronRight,
  Database,
  Video,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

interface TraineeDashboardProps {
  currentUser: UserProfile;
  courses: Course[];
  assessments: Record<string, Assessment>;
  assignmentSubmissions?: ScientificAssignmentSubmission[];
  presentationSubmissions?: PresentationSubmission[];
  onAddAssignmentSubmission?: (sub: ScientificAssignmentSubmission) => void;
  onAddPresentationSubmission?: (sub: PresentationSubmission) => void;
  onUpdateUser: (user: UserProfile) => void;
  onSignOut?: () => void;
}

export const TraineeDashboard: React.FC<TraineeDashboardProps> = ({
  currentUser,
  courses,
  assessments,
  assignmentSubmissions = INITIAL_ASSIGNMENT_SUBMISSIONS,
  presentationSubmissions = INITIAL_PRESENTATION_SUBMISSIONS,
  onAddAssignmentSubmission,
  onAddPresentationSubmission,
  onUpdateUser,
  onSignOut,
}) => {
  const [localAssignmentSubmissions, setLocalAssignmentSubmissions] = useState<ScientificAssignmentSubmission[]>(assignmentSubmissions);
  const [localPresentationSubmissions, setLocalPresentationSubmissions] = useState<PresentationSubmission[]>(presentationSubmissions);

  // Keep in sync if parent passes props
  const effectiveAssignmentSubmissions = assignmentSubmissions || localAssignmentSubmissions;
  const effectivePresentationSubmissions = presentationSubmissions || localPresentationSubmissions;

  const handleNewAssignment = (sub: ScientificAssignmentSubmission) => {
    if (onAddAssignmentSubmission) {
      onAddAssignmentSubmission(sub);
    } else {
      setLocalAssignmentSubmissions(prev => [sub, ...prev]);
    }
  };

  const handleNewPresentation = (sub: PresentationSubmission) => {
    if (onAddPresentationSubmission) {
      onAddPresentationSubmission(sub);
    } else {
      setLocalPresentationSubmissions(prev => [sub, ...prev]);
    }
  };

  const [activeTab, setActiveTab] = useState<'courses' | 'tasks' | 'presentations' | 'assessments' | 'forums' | 'profile'>('courses');
  const [selectedCourseForView, setSelectedCourseForView] = useState<Course | null>(null);
  
  // Active assessment being taken
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);
  
  // Certificate view state
  const [activeCertificateData, setActiveCertificateData] = useState<{
    traineeName: string;
    courseTitle: string;
    score: number;
    completedDate: string;
    certificateId: string;
  } | null>(null);

  const completedCourses = courses.filter((c) => c.status === 'Completed').length;
  const inProgressCourses = courses.filter((c) => c.status === 'In Progress').length;
  const avgProgress = Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length);

  const handleStartAssessment = (assessmentId: string) => {
    setActiveAssessmentId(assessmentId);
  };

  const handleFinishQuiz = (result: QuizResult) => {
    // If completed assessment, update corresponding course progress
    const matchingCourse = courses.find((c) => c.assessmentId === result.assessmentId);
    if (matchingCourse && result.passed) {
      matchingCourse.progress = 100;
      matchingCourse.status = 'Completed';
    }
  };

  const handleOpenCertificate = (result: QuizResult) => {
    setActiveCertificateData({
      traineeName: result.traineeName,
      courseTitle: result.courseTitle,
      score: result.score,
      completedDate: result.completedAt,
      certificateId: result.certificateId || `MOES-CERT-${Date.now().toString().slice(-6)}`,
    });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto max-w-full overflow-x-hidden">
      
      {/* Overview Metric Cards with Liquid Glass */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active Modules</span>
            <BookOpen className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{inProgressCourses}</div>
          <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-1 font-medium">Under active study</p>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Scientific Lab Tasks</span>
            <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {effectiveAssignmentSubmissions.length} Tasks
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
            HPC auto-benchmarking
          </p>
        </div>

        <div 
          id="trainee-overview-karma-card"
          className="liquid-glass-card rounded-2xl p-4 sm:p-5 border border-amber-200/80 dark:border-amber-900/60 shadow-sm bg-amber-50/40 dark:bg-amber-950/20"
        >
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-2">
            <span className="text-xs font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
              iGOT Karma Points
            </span>
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-800 dark:text-amber-200 font-mono">
            {(currentUser.igotKarmaPoints ?? 1450).toLocaleString()} PTS
          </div>
          <div className="flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-medium">
            <span>{currentUser.certificates.length} Credentials</span>
            <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-amber-100/80 dark:bg-amber-900/60" title="National Competency Framework Identifier">
              NCF-ID: {currentUser.ncfId || 'NCF-MET-001'}
            </span>
          </div>
        </div>

        <div 
          id="trainee-overview-cbp-compliance-card"
          className="liquid-glass-card rounded-2xl p-4 sm:p-5 border border-emerald-200/80 dark:border-emerald-900/60 shadow-sm bg-emerald-50/40 dark:bg-emerald-950/20"
        >
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-2">
            <span className="text-xs font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              CBP Compliance
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
              iGOT SYNCED
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-800 dark:text-emerald-200 font-mono">
            100% On Track
          </div>
          <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
            <span>MoES CBC Plan</span>
            <span>Avg Progress: {avgProgress}%</span>
          </div>
        </div>
      </div>

      {/* Trainee Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 liquid-glass max-w-full overflow-x-auto pb-1">
        <button
          id="trainee-tab-courses"
          type="button"
          onClick={() => { setActiveTab('courses'); setActiveAssessmentId(null); }}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'courses' && !activeAssessmentId
              ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Competency Hub ({courses.length})</span>
        </button>

        <button
          id="trainee-tab-tasks"
          type="button"
          onClick={() => { setActiveTab('tasks'); setActiveAssessmentId(null); }}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'tasks' && !activeAssessmentId
              ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Scientific Lab Tasks & Datasets ({effectiveAssignmentSubmissions.length})</span>
        </button>

        <button
          id="trainee-tab-presentations"
          type="button"
          onClick={() => { setActiveTab('presentations'); setActiveAssessmentId(null); }}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'presentations' && !activeAssessmentId
              ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Presentations & Seminars ({effectivePresentationSubmissions.length})</span>
        </button>

        <button
          id="trainee-tab-assessments"
          type="button"
          onClick={() => { setActiveTab('assessments'); setActiveAssessmentId(null); }}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'assessments' && !activeAssessmentId
              ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Assessments & Quizzes</span>
        </button>

        <button
          id="trainee-tab-forums"
          type="button"
          onClick={() => { setActiveTab('forums'); setActiveAssessmentId(null); }}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'forums' && !activeAssessmentId
              ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Discussion Forums</span>
        </button>

        <button
          id="trainee-tab-profile"
          type="button"
          onClick={() => { setActiveTab('profile'); setActiveAssessmentId(null); }}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'profile' && !activeAssessmentId
              ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>My iGOT (Competencies)</span>
        </button>
      </div>

      {/* Main Tab Views */}
      {activeAssessmentId && assessments[activeAssessmentId] ? (
        <AssessmentPlayer
          assessment={assessments[activeAssessmentId]}
          traineeName={currentUser.fullName}
          onFinishQuiz={handleFinishQuiz}
          onOpenCertificate={handleOpenCertificate}
          onBack={() => setActiveAssessmentId(null)}
        />
      ) : activeTab === 'courses' ? (
        <CourseCenter
          courses={courses}
          onSelectCourse={(course) => setSelectedCourseForView(course)}
          onTakeAssessment={handleStartAssessment}
        />
      ) : activeTab === 'tasks' ? (
        <AssignmentUploadCenter
          traineeId={currentUser.id}
          traineeName={currentUser.fullName}
          submissions={effectiveAssignmentSubmissions}
          onNewSubmission={handleNewAssignment}
        />
      ) : activeTab === 'presentations' ? (
        <PresentationUploadCenter
          traineeId={currentUser.id}
          traineeName={currentUser.fullName}
          department={currentUser.specialization || currentUser.institute}
          submissions={effectivePresentationSubmissions}
          onNewPresentation={handleNewPresentation}
        />
      ) : activeTab === 'assessments' ? (
        /* Direct Assessments List */
        <div className="space-y-6">
          <div className="liquid-glass-accent rounded-3xl p-6 sm:p-8 space-y-2 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              National Examination & Certification Assessments
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl">
              Official subject-wise MCQ quizzes with timed countdowns, automated feedback, and downloadable MoES completion certificates upon achieving &gt; 70%.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(Object.values(assessments) as Assessment[]).map((asm) => (
              <div
                key={asm.id}
                className="liquid-glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 space-y-4 flex flex-col justify-between hover:border-rose-400 dark:hover:border-rose-500 transition shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                      {asm.subject}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {asm.durationMinutes} Mins
                    </span>
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                    {asm.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Course: <strong className="text-slate-800 dark:text-slate-200">{asm.courseTitle}</strong>
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Questions:</span>
                    <strong className="text-slate-900 dark:text-white">{asm.totalQuestions} MCQs</strong>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Passing Score:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">&ge; {asm.passingPercentage}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Deadline:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{asm.deadline}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartAssessment(asm.id)}
                    className="w-full py-2.5 rounded-xl bg-rose-700 dark:bg-rose-600 hover:bg-rose-800 dark:hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>Start Timed Assessment</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'forums' ? (
        <DiscussionForums currentUser={currentUser} />
      ) : (
        <TraineeProfile
          user={currentUser}
          onUpdateUser={onUpdateUser}
        />
      )}

      {/* Course Viewer Modal */}
      {selectedCourseForView && (
        <CourseViewerModal
          course={selectedCourseForView}
          onClose={() => setSelectedCourseForView(null)}
          onStartAssessment={handleStartAssessment}
        />
      )}

      {/* Certificate Viewer Modal */}
      {activeCertificateData && (
        <CertificateModal
          traineeName={activeCertificateData.traineeName}
          courseTitle={activeCertificateData.courseTitle}
          score={activeCertificateData.score}
          completedDate={activeCertificateData.completedDate}
          certificateId={activeCertificateData.certificateId}
          onClose={() => setActiveCertificateData(null)}
        />
      )}

      {/* Floating AI Trainee Co-Pilot Widget */}
      <AICoPilotWidget currentCourseTitle={selectedCourseForView?.title} />

    </div>
  );
};
