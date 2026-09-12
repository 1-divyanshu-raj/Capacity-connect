import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { 
  supabase, 
  checkUserRegistrationInSupabase, 
  getAllRegisteredFaceCandidates,
  matchFace1ToN,
  FaceMatchResult,
  getRegisteredPersonnelRegistry
} from '../lib/supabase';

export interface AuthContextType {
  currentUser: UserProfile | null;
  isLoading: boolean;
  authError: string | null;
  setCurrentUser: (user: UserProfile | null) => void;
  setAuthError: (error: string | null) => void;
  verifyUserRegistration: (identifier: string, role?: UserRole) => Promise<{ isRegistered: boolean; profile?: UserProfile; error?: string }>;
  fastLoginWithBiometrics: (liveVector: number[]) => Promise<{ success: boolean; user?: UserProfile; error?: string; matchResult?: FaceMatchResult }>;
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

  // Passwordless Fast Login via Live Face Vector against Supabase public.profiles (d <= 0.450)
  const fastLoginWithBiometrics = async (
    liveVector: number[]
  ): Promise<{ success: boolean; user?: UserProfile; error?: string; matchResult?: FaceMatchResult }> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const candidates = await getAllRegisteredFaceCandidates();
      const result = matchFace1ToN(liveVector, candidates, 0.45);

      if (result.matched && result.bestMatchUser && result.bestDistance <= 0.45) {
        const localRegistry = getRegisteredPersonnelRegistry();
        const found = localRegistry.find(
          (u) => u.id === result.bestMatchUser!.id || u.email.toLowerCase() === (result.bestMatchUser!.email || '').toLowerCase()
        );

        const profile: UserProfile = found || {
          id: result.bestMatchUser.id,
          username: (result.bestMatchUser.email || result.bestMatchUser.name).toLowerCase().replace(/[@\s.]+/g, '_'),
          fullName: result.bestMatchUser.name,
          email: result.bestMatchUser.email || `${result.bestMatchUser.name.toLowerCase().replace(/\s+/g, '.')}@moes.gov.in`,
          role: (result.bestMatchUser.role as any) || 'trainee',
          institute: 'Ministry of Earth Sciences (MoES)',
          designation: result.bestMatchUser.role === 'trainer' ? "Senior Faculty / Scientist 'G'" : "Probationer / Scientist 'B'",
          avatar: result.bestMatchUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
          phone: '+91 98765 00000',
          bio: 'Verified Ministry Personnel authenticated via Supabase public.profiles.',
          qualifications: 'Earth System Science',
          workExperience: 'MoES Official Cadre',
          igotKarmaPoints: 1200,
          face_descriptor: result.bestMatchUser.face_descriptor,
          interests: ['Meteorology', 'Oceanography'],
          skills: [],
          certificates: []
        };

        setCurrentUser(profile);
        setAuthError(null);
        return { success: true, user: profile, matchResult: result };
      } else {
        const err = 'User Not Registered: Scanned face does not match any profile in Supabase public.profiles (d > 0.450).';
        setAuthError(err);
        return { success: false, error: err, matchResult: result };
      }
    } catch (err: any) {
      const msg = err?.message || 'Biometric authentication failed.';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // Fast Login / Passcode compatibility stub
  const fastLoginWithPasscode = (
    role: UserRole, 
    passcode: string
  ): { success: boolean; user?: UserProfile; error?: string } => {
    const err = 'Passcode bypass is deprecated. Please use passwordless Face Biometric Verification.';
    setAuthError(err);
    return { success: false, error: err };
  };

  // High-Speed 1-to-N Face Vector Verification with Strict Euclidean Threshold (< 0.45)
  const verifyFaceDescriptor1ToN = async (
    liveVector: number[],
    targetProfile: UserProfile
  ): Promise<FaceMatchResult> => {
    const candidates = await getAllRegisteredFaceCandidates();
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
        fastLoginWithBiometrics,
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
