import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase, checkUserRegistrationInSupabase, getAllRegisteredFaceCandidates, FaceMatchResult, getRegisteredPersonnelRegistry } from '../lib/supabase';

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
  let lastError: any = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (!error && data) {
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
        govSecurityId: data.gov_security_id,
        accountStatus: data.account_status
      } as UserProfile;
    }
    lastError = error;
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
  }
  if (lastError) throw lastError;
  return null;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const explicitSignOutRef = useRef(false);
  const currentUserRef = useRef<UserProfile | null>(null);
  const mountedRef = useRef(true);

  const updateCurrentUser = (user: UserProfile | null) => {
    currentUserRef.current = user;
    if (mountedRef.current) setCurrentUser(user);
  };

  const activateAuthenticatedProfile = async (userId: string): Promise<UserProfile | null> => {
    const profile = await loadProfile(userId);
    if (!profile) throw new Error('Your account is authenticated, but no Capacity Connect profile exists.');
    if (profile.accountStatus === 'pending') throw new Error('Your administrator account is pending approval. An existing Capacity Connect administrator must approve it before you can sign in.');
    if (profile.accountStatus === 'rejected') throw new Error('Your account registration was not approved. Please contact Capacity Connect administration.');
    updateCurrentUser(profile);
    setAuthError(null);
    return profile;
  };

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const restoreSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session?.user && !cancelled) await activateAuthenticatedProfile(session.user.id);
      } catch (error: any) {
        if (!cancelled) setAuthError(error?.message || 'Unable to restore authentication session.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void restoreSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_OUT') {
        if (explicitSignOutRef.current) {
          currentUserRef.current = null;
          setCurrentUser(null);
          setAuthError(null);
          explicitSignOutRef.current = false;
          return;
        }

        // Never bounce an authenticated UI back to LoginPage because of a transient
        // auth event. Only an explicit logout is allowed to clear the local user.
        if (currentUserRef.current) return;
      }
    });

    return () => {
      cancelled = true;
      mountedRef.current = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    explicitSignOutRef.current = false;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw error;
      if (!data.user) throw new Error('Authentication succeeded but no user was returned.');

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session?.user) throw new Error('Login succeeded, but the secure session was not established. Please try again.');

      const profile = await activateAuthenticatedProfile(data.user.id);
      return { success: true, user: profile || undefined };
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
      const role = profileData.role === 'trainer' || profileData.role === 'admin' ? profileData.role : 'trainee';
      const metadata = {
        full_name: profileData.fullName || '', phone: profileData.phone || '', role,
        institute: profileData.institute || '', designation: profileData.designation || '', qualifications: profileData.qualifications || '',
        work_experience: profileData.workExperience || '', bio: profileData.bio || '', specialization: profileData.specialization || '',
        years_of_experience: profileData.yearsOfExperience?.toString() || '', interests: profileData.interests || [], skills: profileData.skills || []
      };
      const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: metadata } });
      if (error) throw error;
      if (!data.user) throw new Error('Registration did not return a user.');
      if (role === 'admin') return { success: true, error: 'Admin registration submitted. Your account will be available after approval by an existing administrator.' };
      if (data.session) {
        const createdProfile = await loadProfile(data.user.id);
        if (createdProfile) updateCurrentUser(createdProfile);
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

  const verifyUserRegistration = async (identifier: string, role?: UserRole) => {
    setIsLoading(true); setAuthError(null);
    try {
      const res = await checkUserRegistrationInSupabase(identifier, role);
      if (!res.isRegistered) setAuthError(res.error || 'Access Denied: Unregistered Officer/Personnel.');
      return res;
    } catch (err: any) {
      const errorMsg = err.message || 'Supabase central registry connection error.';
      setAuthError(errorMsg); return { isRegistered: false, error: errorMsg };
    } finally { setIsLoading(false); }
  };

  const fastLoginWithBiometrics = async (liveVector: number[]) => {
    setIsLoading(true); setAuthError(null);
    try {
      const candidates = await getAllRegisteredFaceCandidates();
      const result = (await import('../lib/supabase')).matchFace1ToN(liveVector, candidates, 0.45);
      if (!result.matched || !result.bestMatchUser || result.bestDistance > 0.45) {
        const error = 'Biometric verification failed: no matching registered profile was found.';
        setAuthError(error); return { success: false, error, matchResult: result };
      }
      const found = getRegisteredPersonnelRegistry().find(u => u.id === result.bestMatchUser!.id || u.email.toLowerCase() === (result.bestMatchUser!.email || '').toLowerCase());
      if (!found) {
        const error = 'Biometric match found, but a local profile record is unavailable. Use normal authenticated login.';
        setAuthError(error); return { success: false, error, matchResult: result };
      }
      return { success: true, user: found, matchResult: result };
    } catch (err: any) {
      const msg = err?.message || 'Biometric verification failed.';
      setAuthError(msg); return { success: false, error: msg };
    } finally { setIsLoading(false); }
  };

  const fastLoginWithPasscode = (_role: UserRole, _passcode: string) => {
    const error = 'Passcode bypass is disabled. Use authenticated email/password login or the labelled SIH evaluation flow.';
    setAuthError(error); return { success: false, error };
  };

  const verifyFaceDescriptor1ToN = async (liveVector: number[], _targetProfile: UserProfile) => {
    const candidates = await getAllRegisteredFaceCandidates();
    return (await import('../lib/supabase')).matchFace1ToN(liveVector, candidates, 0.45);
  };

  const signOut = async () => {
    setIsLoading(true);
    explicitSignOutRef.current = true;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      explicitSignOutRef.current = false;
      setAuthError(error?.message || 'Logout failed.');
    } finally {
      updateCurrentUser(null);
      setIsLoading(false);
    }
  };

  return <AuthContext.Provider value={{ currentUser, isLoading, authError, setCurrentUser: updateCurrentUser, setAuthError, signIn, signUp, verifyUserRegistration, fastLoginWithBiometrics, fastLoginWithPasscode, verifyFaceDescriptor1ToN, signOut }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
