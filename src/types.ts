export type UserRole = 'trainee' | 'trainer' | 'admin';

export interface UserProfile {
  id: string;
  username: 'XYZ_trainee' | 'XYZ_trainer' | 'XYZ_admin' | 'Test_Trainee' | 'Test_Trainer' | 'Test_Admin' | string;
  fullName: string;
  email: string;
  role: UserRole;
  password?: string;
  institute: string;
  designation: string;
  avatar: string;
  phone: string;
  bio: string;
  qualifications: string;
  workExperience: string;
  interests: string[];
  skills: { name: string; level: number; category: string; ncfId?: string; karmaCredit?: number }[];
  certificates: ExtractedCertificate[];
  // iGOT Karmayogi & National Competency Framework Alignment
  igotKarmaPoints?: number;
  ncfId?: string;
  // Biometric & Face Descriptor Vector (128-d vector for face matching)
  face_descriptor?: number[];
  // Trainer specific
  specialization?: string;
  yearsOfExperience?: number;
  publishedMaterialsCount?: number;
  // Admin specific
  clearanceLevel?: string;
  govSecurityId?: string;
}

export interface ExtractedCertificate {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialId: string;
  verified: boolean;
  fileSize: string;
  autoExtractedDetails: {
    scoreOrGrade: string;
    specialization: string;
    accreditationBody: string;
  };
}

export interface CourseModule {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string;
  transcriptSnippet?: string;
  readingMaterial?: string;
}

export interface Course {
  id: string;
  title: string;
  category: 'Radar Meteorology' | 'Seismology & Tsunami' | 'NWP Modeling' | 'Ocean-Atmosphere' | 'Agrometeorology' | 'Polar Sciences';
  department: string; // e.g. IMD, NCMRWF, INCOIS, IITM, NCPOR
  instructor: string;
  durationWeeks: number;
  totalLectures: number;
  level: 'Foundational' | 'Intermediate' | 'Advanced' | 'Executive';
  rating: number;
  enrolledCount: number;
  progress: number; // 0 to 100 for current trainee
  status: 'Not Started' | 'In Progress' | 'Completed';
  description: string;
  thumbnail: string;
  modules: CourseModule[];
  assessmentId?: string;
  // iGOT Karmayogi & NCF-ID
  ncfId?: string;
  igotKarmaPoints?: number;
  igotAligned?: boolean;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface Assessment {
  id: string;
  courseId: string;
  courseTitle: string;
  subject: string;
  title: string;
  durationMinutes: number;
  passingPercentage: number;
  deadline: string;
  questions: MCQQuestion[];
  totalQuestions: number;
  status?: 'Active' | 'Draft' | 'Archived';
}

export interface QuizResult {
  assessmentId: string;
  courseTitle: string;
  traineeName: string;
  score: number; // percentage
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  completedAt: string;
  answers: { questionId: string; selectedIndex: number; isCorrect: boolean }[];
  certificateId?: string;
}

export interface LibraryResource {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'slides' | 'dataset';
  subject: string;
  author: string;
  authorInstitute: string;
  uploadDate: string;
  fileSize: string;
  downloadCount: number;
  description: string;
  tags: string[];
  isApproved: boolean;
}

export interface CompetencyMapping {
  id: string;
  subjectName: string;
  department: string;
  location: string;
  requiredSkills: string[];
  trainerSkillsMatched: string[];
  matchScore: number; // 0-100%
  status: 'Open for Deputation' | 'Assigned' | 'Under Review';
  estimatedHours: number;
  targetAudience: string;
  prerequisites: string;
}

export interface TraineeProgressRecord {
  id: string;
  traineeName: string;
  username: string;
  email: string;
  department: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  avgQuizScore: number;
  lastActive: string;
  status: 'Exemplary' | 'On Track' | 'Needs Attention';
  completedAssessments: number;
}

export interface PendingUserApproval {
  id: string;
  applicantName: string;
  email: string;
  appliedRole: 'Trainee' | 'Trainer';
  department: string;
  designation: string;
  qualification: string;
  idProof: string;
  appliedDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface GlobalAnnouncement {
  id: string;
  title: string;
  category: 'urgent' | 'course' | 'achievement' | 'policy' | 'low' | 'medium' | 'high';
  content: string;
  date: string;
  publisher: string;
  isPinned: boolean;
  priority?: 'urgent' | 'course' | 'achievement' | 'policy' | 'low' | 'medium' | 'high';
  publishedDate?: string;
  author?: string;
}

export interface RegionalSkillGap {
  region: string; // North, South, East, West, North-East, Central, Islands
  statesCovered: string;
  trainedPersonnel: number;
  targetPersonnel: number;
  criticalSkillNeeded: string;
  gapSeverity: 'Low' | 'Moderate' | 'High';
  completionRate: number;
}

export interface InstituteMetric {
  code: string;
  name: string;
  readinessIndex: number;
  trained: number;
  igotSyncStatus: 'Synced' | 'Pending';
  lastSyncTimestamp?: string;
  activeCoursesCount?: number;
  headFaculty?: string;
  location?: string;
  leadDomain?: string;
  theses?: number;
  activeFellows?: number;
}

// Aliases for component convenience
export type Announcement = GlobalAnnouncement;
export type CompetencyMatch = {
  id: string;
  subject: string;
  department: string;
  matchScore: number;
  skillsMatched: string[];
  openTraineeSlots: number;
  recommendedDate: string;
  analysisSnippet: string;
};
export type TraineeProgress = {
  id: string;
  traineeName: string;
  traineeId: string;
  institute: string;
  activeCourse: string;
  overallProgress: number;
  averageQuizScore: number;
  lastActive: string;
  completedModules: number;
  ncfId?: string;
  igotKarmaPoints?: number;
  igotSyncStatus?: 'Synced' | 'Pending';
};
export type PendingApproval = {
  id: string;
  fullName: string;
  email: string;
  role: 'trainee' | 'trainer';
  institute: string;
  designation: string;
  submittedDocs: string;
  requestedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  ncfId?: string;
  igotKarmaPoints?: number;
  igotSyncStatus?: 'Synced' | 'Pending';
};

export interface PersonnelDirectoryItem {
  id: string;
  fullName: string;
  username: string;
  role: 'trainer' | 'trainee';
  institute: string;
  department: string;
  designation: string;
  email: string;
  phone: string;
  avatar: string;
  clearanceLevel: string;
  nicUid: string;
  qualification?: string;
  thesesSupervisedCount?: number;
  thesesDetails?: string[];
  studentsMentoredCount?: number;
  researchPapersCount?: number;
  citationsCount?: number;
  coursesConductedCount?: number;
  activeCourses?: string[];
  keyExpertise?: string[];
  status?: string;
  thesisTitle?: string;
  thesisSupervisor?: string;
  thesisStatus?: string;
  papersList?: string[];
  coursesEnrolledCount?: number;
  coursesCompletedCount?: number;
  averageGrade?: string;
  keySkills?: string[];
  ncfId?: string;
  igotKarmaPoints?: number;
}

// Trainee & Trainer Scientific Task Submissions
export type ScientificSubmissionStatus = 'Pending Auto-Grade' | 'Graded' | 'Requires Resubmission';

export interface ScoreBreakdown {
  schemaIntegrity: number; // Max 25
  algorithmicPrecision: number; // Max 35
  errorResilience: number; // Max 20
  documentationStandards: number; // Max 20
  totalScore: number; // Out of 100
}

export interface AutomatedTestCaseLog {
  testId: string;
  name: string;
  category: 'schema' | 'accuracy' | 'performance' | 'assertions';
  passed: boolean;
  runtimeMs: number;
  outputLog: string;
}

export interface ScientificAssignmentSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  courseTitle: string;
  department: string;
  traineeName: string;
  traineeId: string;
  submittedAt: string;
  fileName: string;
  fileSize: string;
  fileType: '.pdf' | '.csv' | '.json' | '.py' | '.ipynb';
  status: ScientificSubmissionStatus;
  scoreBreakdown?: ScoreBreakdown;
  testCaseLogs?: AutomatedTestCaseLog[];
  feedbackNotes?: string;
  datasetBenchmarkTarget?: string;
  resubmissionCount: number;
}

// Trainee & Trainer Presentation Submissions
export type PresentationStatus = 'Submitted - In Review' | 'Graded' | 'Requires Resubmission';

export interface PresentationRubricScore {
  communicationSkill: number; // Max 30
  technicalDepth: number; // Max 40
  domainAccuracy: number; // Max 30
  totalScore: number; // Out of 100
  evaluatedBy?: string;
  evaluationDate?: string;
  detailedComments?: string;
}

export interface PresentationSubmission {
  id: string;
  title: string;
  seminarTopic: string;
  courseTitle: string;
  traineeName: string;
  traineeId: string;
  department: string;
  submittedAt: string;
  format: 'MP4' | 'WebM' | 'PDF/PPTX';
  mediaUrl: string;
  durationOrPages: string;
  fileSize: string;
  status: PresentationStatus;
  rubricScore?: PresentationRubricScore;
  summary: string;
}

// Admin Live Presence HUD
export interface InstitutePresence {
  id: string;
  code: string;
  name: string;
  city: string;
  activeUsersCount: number;
  activeTrainees: number;
  activeTrainers: number;
  avgEngagementScore: number;
  systemLoadStatus: 'Optimal' | 'Heavy' | 'Elevated';
  primaryFocusArea: string;
}

export interface ActiveLearningSession {
  id: string;
  officerName: string;
  designation: string;
  instituteCode: 'IMD' | 'INCOIS' | 'IITM' | 'NCMRWF' | 'NCPOR';
  activity: string;
  courseOrModule: string;
  timestamp: string;
  engagementVerified: boolean;
}

// iGOT Karmayogi Discussion Forums & Academic Exchange
export interface DiscussionReply {
  id: string;
  author: string;
  authorRole: UserRole;
  authorInstitute: string;
  content: string;
  createdAt: string;
  isFacultyVerified?: boolean;
  karmaPointsAwarded?: number;
}

export interface DiscussionTopic {
  id: string;
  title: string;
  author: string;
  authorRole: UserRole;
  authorInstitute: string;
  category: 'Radar Meteorology' | 'NWP Modeling' | 'Ocean Telemetry & Tsunamis' | 'Seismology' | 'iGOT Karma Points & CBP';
  content: string;
  createdAt: string;
  repliesCount: number;
  isResolved: boolean;
  ncfCompetencyCode?: string;
  karmaPointsReward?: number;
  replies: DiscussionReply[];
}

// Supabase Database Models
export interface SupabaseTrainee {
  id: string;
  name: string;
  department: string;
  baseline_skill: number;
  days_unpracticed: number;
  created_at?: string;
}

export interface SupabaseTrainer {
  id: string;
  name: string;
  specialization: string;
  competency_score: number;
  rating: number;
  workload_hours: number;
  created_at?: string;
}

// Dynamic Competency Intelligence (Skill Decay)
// C_k(t) = C_0 * e^(-lambda * t)
export interface SkillDecayModel {
  skillName: string;
  domain: string;
  baselineSkill: number; // C_0 (0-100)
  daysUnpracticed: number; // t
  decayConstant: number; // lambda
  currentScore: number; // C_k(t)
  retentionCategory: 'Mastery' | 'Competent' | 'Degrading' | 'Critical Gap';
  halfLifeDays: number;
  recommendedRefresher: string;
  recommendedModuleId?: string;
  microDrillTitle: string;
}

// Explainable Trainer Matching Multi-Criteria Scoring Model
// S_p = alpha * C_p + beta * E_p - gamma * W_p
export interface TrainerMatchScore {
  trainer: SupabaseTrainer;
  competencyScore: number; // C_p
  pedagogicalRating: number; // E_p
  pedagogicalNormalized: number; // E_p scaled 0-100
  workloadHours: number; // W_p
  compositeScore: number; // S_p
  rank: number;
  isOptimal: boolean;
  matchRationale: string;
}

// Mission Karmayogi & FRAC Taxonomy Sync
export interface FracCompetencyItem {
  id: string;
  code: string;
  competencyArea: string;
  roleMapping: string;
  activityDescription: string;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5;
  iGotCreditPoints: number;
  xApiVerb: string;
  lastSyncedTimestamp: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'VALIDATING';
  moesCadre: string;
}

export interface XApiStatementRecord {
  id: string;
  actorEmail: string;
  actorName: string;
  verbId: string;
  verbDisplay: string;
  activityId: string;
  activityName: string;
  scoreRaw: number;
  scoreScaled: number;
  success: boolean;
  timestamp: string;
  authority: string;
  checksum: string;
}

