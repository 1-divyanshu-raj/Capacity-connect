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
  signIn: (email: string, password: string) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  signUp: (email: string, password: string, profile: Partial<UserProfile>) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  verifyUserRegistration: (identifier: string, role?: UserRole) => Promise<{ isRegistered: boolean; profile?: UserProfile; error?: string }>;
  fastLoginWithBiometrics: (liveVector: number[]) => Promise<{ success: boolean; user?: UserProfile; error?: string; matchResult?: FaceMatchResult }>;
  fastLoginWithPasscode: (role: UserRole, passcode: string) => { success: boolean; user?: UserProfile; error?: string };
  verifyFaceDescriptor1ToN: (liveVector: number[], targetProfile: UserProfile) => Promise<FaceMatchResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';

function normalizeRole(value: unknown): UserRole {
  return value === 'admin' || value === 'trainer' || value === 'trainee' ? value : 'trainee';
}

async function loadProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    username: data.username || data.email?.split('@')[0] || data.id,
    fullName: data.full_name || data.email || 'MoES Personnel',
    email: data.email || '',
    role: normalizeRole(data.role),
    institute: data.institute || 'Ministry of Earth Sciences (MoES)',
    designation: data.designation || '',
    avatar: data.avatar_url || defaultAvatar,
    phone: data.phone || '',
    bio: data.bio || '',
    qualifications: data.qualifications || '',
    workExperience: data.work_experience || '',
    interests: Array.isArray(data.interests) ? data.interests : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    certificates: Array.isArray(data.certificates) ? data.certificates : [],
    igotKarmaPoints: data.igot_karma_points,
    ncfId: data.ncf_id,
    face_descriptor: Array.isArray(data.face_descriptor) ? data.face_descriptor : undefined,
    specialization: data.specialization,
    yearsOfExperience: data.years_of_experience,
    publishedMaterialsCount: data.published_materials_count,
    clearanceLevel: data.clearance_level,
    govSecurityId: data.gov_security_id
  } as UserProfile;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user && mounted) {
          const profile = await loadProfile(session.user.id);
          if (mounted) setCurrentUser(profile);
        } else if (mounted) {
          setCurrentUser(null);
        }
      } catch (error: any) {
        console.error('Supabase session restore failed:', error);
        if (mounted) setAuthError(error?.message || 'Unable to restore authentication session.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    restoreSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session?.user) {
        setCurrentUser(null);
        setAuthError(null);
        return;
      }

      try {
        const profile = await loadProfile(session.user.id);
        if (mounted) setCurrentUser(profile);
      } catch (error: any) {
        console.error('Unable to load authenticated profile:', error);
        if (mounted) setAuthError(error?.message || 'Authenticated, but profile could not be loaded.');
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) throw error;
      if (!data.user) throw new Error('Authentication succeeded but no user was returned.');

      const profile = await loadProfile(data.user.id);
      if (!profile) {
        await supabase.auth.signOut();
        throw new Error('Your account is authenticated, but no Capacity Connect profile exists.');
      }

      setCurrentUser(profile);
      return { success: true, user: profile };
    } catch (error: any) {
      const message = error?.message || 'Login failed.';
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, profileData: Partial<UserProfile>) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: profileData.fullName || '',
            role: profileData.role || 'trainee'
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('Registration did not return a user.');

      // Profile creation should be handled by the database trigger/policy. If the
      // project requires email confirmation, the user remains unauthenticated until
      // Supabase confirms the address.
      if (data.session) {
        const createdProfile = await loadProfile(data.user.id);
        if (createdProfile) setCurrentUser(createdProfile);
        return { success: true, user: createdProfile || undefined };
      }

      return { success: true, error: 'Registration successful. Check your email to confirm your account.' };
    } catch (error: any) {
      const message = error?.message || 'Registration failed.';
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

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

  // Legacy biometric verification remains available for the onboarding/biometric
  // feature, but it is deliberately NOT treated as a Supabase Auth session.
  const fastLoginWithBiometrics = async (
    liveVector: number[]
  ): Promise<{ success: boolean; user?: UserProfile; error?: string; matchResult?: FaceMatchResult }> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const candidates = await getAllRegisteredFaceCandidates();
      const result = matchFace1ToN(liveVector, candidates, 0.45);

      if (!result.matched || !result.bestMatchUser || result.bestDistance > 0.45) {
        const error = 'Biometric verification failed: no matching registered profile was found.';
        setAuthError(error);
        return { success: false, error, matchResult: result };
      }

      const localRegistry = getRegisteredPersonnelRegistry();
      const found = localRegistry.find(
        (u) => u.id === result.bestMatchUser!.id || u.email.toLowerCase() === (result.bestMatchUser!.email || '').toLowerCase()
      );

      if (!found) {
        const error = 'Biometric match found, but a local profile record is unavailable. Use normal authenticated login.';
        setAuthError(error);
        return { success: false, error, matchResult: result };
      }

      // Do not call setCurrentUser here: a face match alone is not a Supabase Auth session.
      return { success: true, user: found, matchResult: result };
    } catch (err: any) {
      const msg = err?.message || 'Biometric verification failed.';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const fastLoginWithPasscode = (
    _role: UserRole,
    _passcode: string
  ): { success: boolean; user?: UserProfile; error?: string } => {
    const error = 'Passcode bypass is disabled. Use authenticated email/password login or the labelled SIH evaluation flow.';
    setAuthError(error);
    return { success: false, error };
  };

  const verifyFaceDescriptor1ToN = async (
    liveVector: number[],
    _targetProfile: UserProfile
  ): Promise<FaceMatchResult> => {
    const candidates = await getAllRegisteredFaceCandidates();
    return matchFace1ToN(liveVector, candidates, 0.45);
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      setAuthError(error?.message || 'Logout failed.');
    } finally {
      setCurrentUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        authError,
        setCurrentUser,
        setAuthError,
        signIn,
        signUp,
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
