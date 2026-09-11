import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { 
  supabase, 
  checkUserRegistrationInSupabase, 
  FAST_LOGIN_PROFILES, 
  EVALUATION_PASSCODE,
  getAllRegisteredFaceCandidates,
  matchFace1ToN,
  FaceMatchResult,
  generateDeterministicFaceDescriptor
} from '../lib/supabase';

export interface AuthContextType {
  currentUser: UserProfile | null;
  isLoading: boolean;
  authError: string | null;
  setCurrentUser: (user: UserProfile | null) => void;
  setAuthError: (error: string | null) => void;
  verifyUserRegistration: (identifier: string, role?: UserRole) => Promise<{ isRegistered: boolean; profile?: UserProfile; error?: string }>;
  fastLoginWithPasscode: (role: UserRole, passcode: string) => { success: boolean; user?: UserProfile; error?: string };
  verifyFaceDescriptor1ToN: (liveVector: number[], targetProfile: UserProfile) => Promise<FaceMatchResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('moes_portal_active_user_session');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id && parsed.role) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error restoring cached auth session:', e);
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Synchronize session storage and Supabase auth events
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('moes_portal_active_user_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('moes_portal_active_user_session');
    }
  }, [currentUser]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('moes_portal_active_user_session');
        setCurrentUser(null);
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Strict check against Supabase central registry
  const verifyUserRegistration = async (
    identifier: string,
    role?: UserRole
  ): Promise<{ isRegistered: boolean; profile?: UserProfile; error?: string }> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await checkUserRegistrationInSupabase(identifier, role);
      if (!res.isRegistered) {
        setAuthError(res.error || 'Access Denied: Unregistered Officer/Personnel.');
      }
      return res;
    } catch (err: any) {
      const errorMsg = err.message || 'Supabase central registry connection error.';
      setAuthError(errorMsg);
      return { isRegistered: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Fast Login / Evaluator Passcode Override ('12345')
  const fastLoginWithPasscode = (
    role: UserRole, 
    passcode: string
  ): { success: boolean; user?: UserProfile; error?: string } => {
    if (passcode.trim() === EVALUATION_PASSCODE) {
      const demoProfile = FAST_LOGIN_PROFILES[role];
      setCurrentUser(demoProfile);
      setAuthError(null);
      return { success: true, user: demoProfile };
    } else {
      const err = 'Access Denied: Invalid Passcode. Access denied.';
      setAuthError(err);
      return { success: false, error: err };
    }
  };

  // High-Speed 1-to-N Face Vector Verification with Strict Euclidean Threshold (< 0.45)
  const verifyFaceDescriptor1ToN = async (
    liveVector: number[],
    targetProfile: UserProfile
  ): Promise<FaceMatchResult> => {
    const candidates = await getAllRegisteredFaceCandidates();
    // Ensure target profile is in candidates list
    if (!candidates.some(c => c.name.toLowerCase() === targetProfile.fullName.toLowerCase())) {
      candidates.push({
        id: targetProfile.id,
        name: targetProfile.fullName,
        role: targetProfile.role,
        face_descriptor: targetProfile.face_descriptor || generateDeterministicFaceDescriptor(targetProfile.fullName),
        avatar: targetProfile.avatar
      });
    }

    return matchFace1ToN(liveVector, candidates, 0.45);
  };

  const signOut = async () => {
    localStorage.removeItem('moes_portal_active_user_session');
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        authError,
        setCurrentUser,
        setAuthError,
        verifyUserRegistration,
        fastLoginWithPasscode,
        verifyFaceDescriptor1ToN,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
