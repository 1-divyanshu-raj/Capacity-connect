import React from 'react';
import { 
  UserProfile, 
  Course, 
  Assessment, 
  LibraryResource, 
  PendingApproval, 
  Announcement, 
  CompetencyMatch, 
  TraineeProgress 
} from '../types';
import { TraineeDashboard } from '../components/trainee/TraineeDashboard';
import { TrainerDashboard } from '../components/trainer/TrainerDashboard';
import { AdminDashboard } from '../components/admin/AdminDashboard';

export interface DashboardPageProps {
  currentUser: UserProfile;
  courses: Course[];
  assessments: Record<string, Assessment>;
  libraryResources: LibraryResource[];
  approvals: PendingApproval[];
  announcements: Announcement[];
  competencies: CompetencyMatch[];
  traineeProgressList: TraineeProgress[];
  onUpdateUser: (updated: UserProfile) => void;
  onSignOut: () => void;
  onAddResource: (res: LibraryResource) => void;
  onDeleteResource: (id: string) => void;
  onPublishAssessment: (ass: Assessment) => void;
  onApproveUser: (id: string) => void;
  onRejectUser: (id: string) => void;
  onAddAnnouncement: (ann: Announcement) => void;
  onTogglePinAnnouncement: (id: string) => void;
  onDeleteAnnouncement: (id: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentUser,
  courses,
  assessments,
  libraryResources,
  approvals,
  announcements,
  competencies,
  traineeProgressList,
  onUpdateUser,
  onSignOut,
  onAddResource,
  onDeleteResource,
  onPublishAssessment,
  onApproveUser,
  onRejectUser,
  onAddAnnouncement,
  onTogglePinAnnouncement,
  onDeleteAnnouncement,
}) => {
  if (currentUser.role === 'trainee') {
    return (
      <TraineeDashboard
        currentUser={currentUser}
        courses={courses}
        assessments={assessments}
        onUpdateUser={onUpdateUser}
        onSignOut={onSignOut}
      />
    );
  }

  if (currentUser.role === 'trainer') {
    return (
      <TrainerDashboard
        currentUser={currentUser}
        courses={courses}
        resources={libraryResources}
        competencies={competencies}
        traineeProgressList={traineeProgressList}
        onAddResource={onAddResource}
        onDeleteResource={onDeleteResource}
        onPublishAssessment={onPublishAssessment}
        onSignOut={onSignOut}
      />
    );
  }

  if (currentUser.role === 'admin') {
    return (
      <AdminDashboard
        currentUser={currentUser}
        approvals={approvals}
        announcements={announcements}
        onApproveUser={onApproveUser}
        onRejectUser={onRejectUser}
        onAddAnnouncement={onAddAnnouncement}
        onTogglePinAnnouncement={onTogglePinAnnouncement}
        onDeleteAnnouncement={onDeleteAnnouncement}
        onSignOut={onSignOut}
      />
    );
  }

  return null;
};
