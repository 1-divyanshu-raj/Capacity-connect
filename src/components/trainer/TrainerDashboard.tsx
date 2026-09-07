import React, { useState } from 'react';
import { 
  UserProfile, 
  LibraryResource, 
  Assessment, 
  CompetencyMatch, 
  TraineeProgress, 
  Course,
  ScientificAssignmentSubmission,
  PresentationSubmission
} from '../../types';
import {
  INITIAL_ASSIGNMENT_SUBMISSIONS,
  INITIAL_PRESENTATION_SUBMISSIONS
} from '../../data/assignmentData';
import { TrainerLibrary } from './TrainerLibrary';
import { AIAssessmentGenerator } from './AIAssessmentGenerator';
import { CompetencyMapping } from './CompetencyMapping';
import { TraineeAnalytics } from './TraineeAnalytics';
import { TrainerCoursesView } from './TrainerCoursesView';
import { PresentationReviewSuite } from './PresentationReviewSuite';
import { AssignmentAutoGradingEngine } from './AssignmentAutoGradingEngine';
import { 
  FolderGit2, 
  Sparkles, 
  Target, 
  BarChart3, 
  BookOpen, 
  Award, 
  Users,
  Compass,
  Video,
  Cpu
} from 'lucide-react';

interface TrainerDashboardProps {
  currentUser: UserProfile;
  courses: Course[];
  resources: LibraryResource[];
  competencies: CompetencyMatch[];
  traineeProgressList: TraineeProgress[];
  assignmentSubmissions?: ScientificAssignmentSubmission[];
  presentationSubmissions?: PresentationSubmission[];
  onAddResource: (res: LibraryResource) => void;
  onDeleteResource: (id: string) => void;
  onPublishAssessment: (asm: Assessment) => void;
  onUpdateAssignmentSubmission?: (updated: ScientificAssignmentSubmission) => void;
  onUpdatePresentationSubmission?: (updated: PresentationSubmission) => void;
  onSignOut?: () => void;
}

export const TrainerDashboard: React.FC<TrainerDashboardProps> = ({
  currentUser,
  courses,
  resources,
  competencies,
  traineeProgressList,
  assignmentSubmissions = INITIAL_ASSIGNMENT_SUBMISSIONS,
  presentationSubmissions = INITIAL_PRESENTATION_SUBMISSIONS,
  onAddResource,
  onDeleteResource,
  onPublishAssessment,
  onUpdateAssignmentSubmission = () => {},
  onUpdatePresentationSubmission = () => {},
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<'presentations' | 'autograde' | 'courses' | 'library' | 'generator' | 'competency' | 'analytics'>('presentations');

  const totalEnrolledInCourses = courses.reduce((sum, c) => sum + c.enrolledCount, 0);
  const pendingPresentations = presentationSubmissions.filter((p) => p.status === 'Submitted - In Review').length;
  const pendingAssignments = assignmentSubmissions.filter((a) => a.status === 'Pending Auto-Grade').length;

  return (
    <div className="min-h-[calc(100vh-80px)] p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto max-w-full overflow-x-hidden">
      
      {/* Overview Stat Cards with High Organizational Scaling */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Instructional Courses</span>
            <BookOpen className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{courses.length} Modules</div>
          <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-1 font-medium">{totalEnrolledInCourses.toLocaleString()} enrolled scientists</p>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Presentation Reviews</span>
            <Video className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{presentationSubmissions.length} Seminars</div>
          <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-1 font-medium">{pendingPresentations} pending rubric evaluation</p>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">HPC Auto-Grading</span>
            <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{assignmentSubmissions.length} Tasks</div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">{pendingAssignments} queued on PARAM Mihir</p>
        </div>
      </div>

      {/* Trainer Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 liquid-glass max-w-full overflow-x-auto pb-1">
        <button
          id="trainer-tab-presentations"
          type="button"
          onClick={() => setActiveTab('presentations')}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'presentations'
              ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Presentation Review Suite ({presentationSubmissions.length})</span>
          {pendingPresentations > 0 && (
            <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-mono font-bold">
              {pendingPresentations}
            </span>
          )}
        </button>

        <button
          id="trainer-tab-autograde"
          type="button"
          onClick={() => setActiveTab('autograde')}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'autograde'
              ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Assignment Auto-Grading ({assignmentSubmissions.length})</span>
        </button>

        <button
          id="trainer-tab-courses"
          type="button"
          onClick={() => setActiveTab('courses')}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'courses'
              ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Courses ({courses.length})</span>
        </button>

        <button
          id="trainer-tab-library"
          type="button"
          onClick={() => setActiveTab('library')}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'library'
              ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Library ({resources.length})</span>
        </button>

        <button
          id="trainer-tab-generator"
          type="button"
          onClick={() => setActiveTab('generator')}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'generator'
              ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span>AI Generator</span>
        </button>

        <button
          id="trainer-tab-competency"
          type="button"
          onClick={() => setActiveTab('competency')}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'competency'
              ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Competency</span>
        </button>

        <button
          id="trainer-tab-analytics"
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'presentations' && (
        <PresentationReviewSuite
          trainerName={currentUser.fullName}
          trainerInstitute={currentUser.institute}
          submissions={presentationSubmissions}
          onUpdateSubmission={onUpdatePresentationSubmission}
        />
      )}

      {activeTab === 'autograde' && (
        <AssignmentAutoGradingEngine
          trainerName={currentUser.fullName}
          submissions={assignmentSubmissions}
          onUpdateSubmission={onUpdateAssignmentSubmission}
        />
      )}

      {activeTab === 'courses' && (
        <TrainerCoursesView courses={courses} />
      )}

      {activeTab === 'library' && (
        <TrainerLibrary
          resources={resources}
          onAddResource={onAddResource}
          onDeleteResource={onDeleteResource}
        />
      )}

      {activeTab === 'generator' && (
        <AIAssessmentGenerator
          onPublishAssessment={onPublishAssessment}
        />
      )}

      {activeTab === 'competency' && (
        <CompetencyMapping
          competencies={competencies}
        />
      )}

      {activeTab === 'analytics' && (
        <TraineeAnalytics
          trainees={traineeProgressList}
        />
      )}

    </div>
  );
};
