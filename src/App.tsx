import React, { useEffect, useState } from 'react';
import { UserProfile, Course, Assessment, LibraryResource, PendingApproval, Announcement, CompetencyMatch, TraineeProgress, ScientificAssignmentSubmission, PresentationSubmission } from './types';
import { MOCK_COURSES, MOCK_ASSESSMENTS, MOCK_LIBRARY_RESOURCES, MOCK_PENDING_APPROVALS, MOCK_ANNOUNCEMENTS, MOCK_COMPETENCY_MATCHES, MOCK_TRAINEE_PROGRESS } from './data/mockData';
import { INITIAL_ASSIGNMENT_SUBMISSIONS, INITIAL_PRESENTATION_SUBMISSIONS } from './data/assignmentData';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/Navbar';
import { TraineeDashboard } from './components/trainee/TraineeDashboard';
import { TrainerDashboard } from './components/trainer/TrainerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { useTheme } from './hooks';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';

function mapPendingProfile(profile: any): PendingApproval {
  return { id: `profile:${profile.id}`, fullName: profile.full_name || profile.email || 'Pending applicant', email: profile.email || '', role: profile.role === 'admin' || profile.role === 'trainer' ? profile.role : 'trainee', institute: profile.institute || '', designation: profile.designation || '', submittedDocs: profile.qualifications || 'Profile registration submitted', requestedDate: profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Pending', status: profile.account_status === 'rejected' ? 'Rejected' : profile.account_status === 'active' ? 'Approved' : 'Pending', ncfId: profile.ncf_id, igotKarmaPoints: profile.igot_karma_points, igotSyncStatus: 'Pending' };
}

export default function App() {
  const { currentUser, isLoading: authLoading, signOut, setCurrentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [courses] = useState<Course[]>(MOCK_COURSES);
  const [assessments, setAssessments] = useState<Record<string, Assessment>>(MOCK_ASSESSMENTS);
  const [libraryResources, setLibraryResources] = useState<LibraryResource[]>(MOCK_LIBRARY_RESOURCES);
  const [approvals, setApprovals] = useState<PendingApproval[]>(MOCK_PENDING_APPROVALS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [competencies] = useState<CompetencyMatch[]>(MOCK_COMPETENCY_MATCHES);
  const [traineeProgressList] = useState<TraineeProgress[]>(MOCK_TRAINEE_PROGRESS);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<ScientificAssignmentSubmission[]>(INITIAL_ASSIGNMENT_SUBMISSIONS);
  const [presentationSubmissions, setPresentationSubmissions] = useState<PresentationSubmission[]>(INITIAL_PRESENTATION_SUBMISSIONS);

  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    let cancelled = false;
    const loadPendingApprovals = async () => {
      const { data, error } = await supabase.rpc('list_pending_profiles');
      if (cancelled || error || !Array.isArray(data)) return;
      setApprovals(prev => [...data.map(mapPendingProfile), ...prev.filter(item => !item.id.startsWith('profile:'))]);
    };
    void loadPendingApprovals();
    return () => { cancelled = true; };
  }, [currentUser?.role]);

  const handleUpdateUser = (updated: UserProfile) => setCurrentUser(updated);
  const handleSignOut = () => { void signOut(); };
  const handleAddAssignmentSubmission = (sub: ScientificAssignmentSubmission) => setAssignmentSubmissions(prev => [sub, ...prev]);
  const handleUpdateAssignmentSubmission = (updated: ScientificAssignmentSubmission) => setAssignmentSubmissions(prev => prev.map(s => s.id === updated.id ? updated : s));
  const handleAddPresentationSubmission = (pres: PresentationSubmission) => setPresentationSubmissions(prev => [pres, ...prev]);
  const handleUpdatePresentationSubmission = (updated: PresentationSubmission) => setPresentationSubmissions(prev => prev.map(p => p.id === updated.id ? updated : p));
  const handleAddResource = (res: LibraryResource) => setLibraryResources(prev => [res, ...prev]);
  const handleDeleteResource = (id: string) => setLibraryResources(prev => prev.filter(r => r.id !== id));
  const handlePublishAssessment = (newAsm: Assessment) => setAssessments(prev => ({ ...prev, [newAsm.id]: newAsm }));

  const handleReviewUser = (id: string, decision: 'approve' | 'reject') => {
    void (async () => {
      if (id.startsWith('profile:')) {
        const targetProfileId = id.slice('profile:'.length);
        const { data, error } = await supabase.rpc('review_profile', { target_profile_id: targetProfileId, decision });
        if (error || data !== true) return;
      }
      setApprovals(prev => prev.map(item => item.id === id ? { ...item, status: decision === 'approve' ? 'Approved' : 'Rejected' } : item));
    })();
  };
  const handleApproveUser = (id: string) => handleReviewUser(id, 'approve');
  const handleRejectUser = (id: string) => handleReviewUser(id, 'reject');
  const handleAddAnnouncement = (ann: Announcement) => setAnnouncements(prev => [ann, ...prev]);
  const handleTogglePinAnnouncement = (id: string) => setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isPinned: !a.isPinned } : a));
  const handleDeleteAnnouncement = (id: string) => setAnnouncements(prev => prev.filter(a => a.id !== id));

  if (authLoading && !currentUser) return <div className="min-h-screen grid place-items-center bg-[#f8fafc] dark:bg-[#090e17] text-slate-600 dark:text-slate-300"><div className="text-center"><div className="animate-spin h-8 w-8 rounded-full border-2 border-rose-500 border-t-transparent mx-auto mb-3" /><p>Restoring secure session…</p></div></div>;
  if (!currentUser) return <LoginPage theme={theme} onToggleTheme={toggleTheme} />;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#090e17] text-slate-900 dark:text-slate-100 selection:bg-rose-400 selection:text-white relative overflow-x-hidden transition-colors duration-200">
      <div className="immersive-ambient-rose" /><div className="immersive-ambient-red" />
      <Navbar currentUser={currentUser} announcements={announcements} onSignOut={handleSignOut} onLogout={handleSignOut} theme={theme} onToggleTheme={toggleTheme} />
      <main className="flex-1 relative z-10">
        {currentUser.role === 'trainee' && <TraineeDashboard currentUser={currentUser} courses={courses} assessments={assessments} assignmentSubmissions={assignmentSubmissions} presentationSubmissions={presentationSubmissions} onAddAssignmentSubmission={handleAddAssignmentSubmission} onAddPresentationSubmission={handleAddPresentationSubmission} onUpdateUser={handleUpdateUser} onSignOut={handleSignOut} />}
        {currentUser.role === 'trainer' && <TrainerDashboard currentUser={currentUser} courses={courses} resources={libraryResources} competencies={competencies} traineeProgressList={traineeProgressList} assignmentSubmissions={assignmentSubmissions} presentationSubmissions={presentationSubmissions} onAddResource={handleAddResource} onDeleteResource={handleDeleteResource} onPublishAssessment={handlePublishAssessment} onUpdateAssignmentSubmission={handleUpdateAssignmentSubmission} onUpdatePresentationSubmission={handleUpdatePresentationSubmission} onSignOut={handleSignOut} />}
        {currentUser.role === 'admin' && <AdminDashboard currentUser={currentUser} approvals={approvals} announcements={announcements} onApproveUser={handleApproveUser} onRejectUser={handleRejectUser} onAddAnnouncement={handleAddAnnouncement} onTogglePinAnnouncement={handleTogglePinAnnouncement} onDeleteAnnouncement={handleDeleteAnnouncement} onSignOut={handleSignOut} />}
      </main>
      <footer className="relative z-10 py-3.5 border-t border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-[11px] text-slate-500 dark:text-slate-400 mt-auto transition-colors duration-200"><div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="font-semibold text-slate-700 dark:text-slate-200">CAPACITY CONNECT</span><span>•</span><span>Ministry of Earth Sciences | IMD - Training Division</span><span>•</span><span className="font-mono text-rose-700 dark:text-rose-400 font-medium">Govt. of India</span></div><div className="flex items-center gap-4 text-slate-400 dark:text-slate-500"><span>Security Standards</span><span>•</span><span>Helpdesk: 1800-MOES-CONNECT</span><span>•</span><span className="font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/70 dark:border-slate-700">ROLE: {currentUser.role.toUpperCase()}</span></div></div></footer>
    </div>
  );
}
