/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  Course, 
  Assessment, 
  LibraryResource, 
  PendingApproval, 
  Announcement, 
  CompetencyMatch, 
  TraineeProgress,
  ScientificAssignmentSubmission,
  PresentationSubmission
} from './types';
import { 
  INITIAL_USERS, 
  MOCK_COURSES, 
  MOCK_ASSESSMENTS, 
  MOCK_LIBRARY_RESOURCES, 
  MOCK_PENDING_APPROVALS, 
  MOCK_ANNOUNCEMENTS, 
  MOCK_COMPETENCY_MATCHES, 
  MOCK_TRAINEE_PROGRESS 
} from './data/mockData';
import {
  INITIAL_ASSIGNMENT_SUBMISSIONS,
  INITIAL_PRESENTATION_SUBMISSIONS
} from './data/assignmentData';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/Navbar';
import { TraineeDashboard } from './components/trainee/TraineeDashboard';
import { TrainerDashboard } from './components/trainer/TrainerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { useTheme } from './hooks';
import { logout as endPortalSession } from './lib/authApi';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Light / Dark Theme Hook
  const { theme, toggleTheme } = useTheme();

  // Application Data States
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [assessments, setAssessments] = useState<Record<string, Assessment>>(MOCK_ASSESSMENTS);
  const [libraryResources, setLibraryResources] = useState<LibraryResource[]>(MOCK_LIBRARY_RESOURCES);
  const [approvals, setApprovals] = useState<PendingApproval[]>(MOCK_PENDING_APPROVALS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [competencies, setCompetencies] = useState<CompetencyMatch[]>(MOCK_COMPETENCY_MATCHES);
  const [traineeProgressList, setTraineeProgressList] = useState<TraineeProgress[]>(MOCK_TRAINEE_PROGRESS);

  // Scientific Assignments and Seminar Presentations Data State
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<ScientificAssignmentSubmission[]>(INITIAL_ASSIGNMENT_SUBMISSIONS);
  const [presentationSubmissions, setPresentationSubmissions] = useState<PresentationSubmission[]>(INITIAL_PRESENTATION_SUBMISSIONS);

  // User Profile Update (e.g. from Trainee Profile Editor or Certificate Upload)
  const handleUpdateUser = (updated: UserProfile) => {
    setCurrentUser(updated);
  };

  // Sign out handler (returns to Login Page where role switching is authorized)
  const handleSignOut = () => {
    setCurrentUser(null);
    // Destroy the server-side session too, so the HttpOnly cookie cannot be
    // replayed from this browser after the "sign out" click.
    endPortalSession();
  };

  // Trainee & Trainer: Assignment Actions
  const handleAddAssignmentSubmission = (sub: ScientificAssignmentSubmission) => {
    setAssignmentSubmissions((prev) => [sub, ...prev]);
  };

  const handleUpdateAssignmentSubmission = (updated: ScientificAssignmentSubmission) => {
    setAssignmentSubmissions((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  // Trainee & Trainer: Presentation Actions
  const handleAddPresentationSubmission = (pres: PresentationSubmission) => {
    setPresentationSubmissions((prev) => [pres, ...prev]);
  };

  const handleUpdatePresentationSubmission = (updated: PresentationSubmission) => {
    setPresentationSubmissions((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  // Trainer: Add Resource to Library
  const handleAddResource = (res: LibraryResource) => {
    setLibraryResources((prev) => [res, ...prev]);
  };

  // Trainer: Delete Resource
  const handleDeleteResource = (id: string) => {
    setLibraryResources((prev) => prev.filter((r) => r.id !== id));
  };

  // Trainer: Publish AI Generated Assessment
  const handlePublishAssessment = (newAsm: Assessment) => {
    setAssessments((prev) => ({
      ...prev,
      [newAsm.id]: newAsm,
    }));
  };

  // Admin: User Approvals
  const handleApproveUser = (id: string) => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Approved' } : item))
    );
  };

  const handleRejectUser = (id: string) => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Rejected' } : item))
    );
  };

  // Admin: Announcements
  const handleAddAnnouncement = (ann: Announcement) => {
    setAnnouncements((prev) => [ann, ...prev]);
  };

  const handleTogglePinAnnouncement = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isPinned: !a.isPinned } : a))
    );
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  // If not logged in, show Login Page (with interactive role switcher demo and sign-in options)
  if (!currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={(user) => setCurrentUser(user)} 
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#090e17] text-slate-900 dark:text-slate-100 selection:bg-rose-400 selection:text-white relative overflow-x-hidden transition-colors duration-200">
      {/* Immersive Atmospheric Ambient Glows */}
      <div className="immersive-ambient-rose" />
      <div className="immersive-ambient-red" />

      {/* Universal Portal Navigation Header */}
      <Navbar
        currentUser={currentUser}
        announcements={announcements}
        onSignOut={handleSignOut}
        onLogout={handleSignOut}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Role-Isolated Dashboard Content */}
      <main className="flex-1 relative z-10">
        {currentUser.role === 'trainee' && (
          <TraineeDashboard
            currentUser={currentUser}
            courses={courses}
            assessments={assessments}
            assignmentSubmissions={assignmentSubmissions}
            presentationSubmissions={presentationSubmissions}
            onAddAssignmentSubmission={handleAddAssignmentSubmission}
            onAddPresentationSubmission={handleAddPresentationSubmission}
            onUpdateUser={handleUpdateUser}
            onSignOut={handleSignOut}
          />
        )}

        {currentUser.role === 'trainer' && (
          <TrainerDashboard
            currentUser={currentUser}
            courses={courses}
            resources={libraryResources}
            competencies={competencies}
            traineeProgressList={traineeProgressList}
            assignmentSubmissions={assignmentSubmissions}
            presentationSubmissions={presentationSubmissions}
            onAddResource={handleAddResource}
            onDeleteResource={handleDeleteResource}
            onPublishAssessment={handlePublishAssessment}
            onUpdateAssignmentSubmission={handleUpdateAssignmentSubmission}
            onUpdatePresentationSubmission={handleUpdatePresentationSubmission}
            onSignOut={handleSignOut}
          />
        )}

        {currentUser.role === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            approvals={approvals}
            announcements={announcements}
            onApproveUser={handleApproveUser}
            onRejectUser={handleRejectUser}
            onAddAnnouncement={handleAddAnnouncement}
            onTogglePinAnnouncement={handleTogglePinAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            onSignOut={handleSignOut}
          />
        )}
      </main>

      {/* Immersive Portal Footer */}
      <footer className="relative z-10 py-3.5 border-t border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-[11px] text-slate-500 dark:text-slate-400 mt-auto transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200">CAPACITY CONNECT</span>
            <span>•</span>
            <span>Ministry of Earth Sciences | IMD - Training Division</span>
            <span>•</span>
            <span className="font-mono text-rose-700 dark:text-rose-400 font-medium">SIH26075</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
            <span className="hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">Security Standards</span>
            <span>•</span>
            <span>Helpdesk: 1800-MOES-CONNECT</span>
            <span>•</span>
            <span className="font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/70 dark:border-slate-700">
              ROLE: {currentUser.role.toUpperCase()}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
