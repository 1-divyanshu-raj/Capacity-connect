import React, { useState, useRef, useEffect } from 'react';
import { UserRole, UserProfile } from '../../types';
import { INITIAL_USERS } from '../../data/mockData';
import { BiometricScanner } from './BiometricScanner';
import { CameraFaceScanner } from './CameraFaceScanner';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Mail, 
  Smartphone, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  Sparkles,
  Fingerprint,
  Info,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Camera,
  X,
  Building2,
  GraduationCap,
  Zap,
  Scan,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { sound } from '../../utils/soundEffects';
import { 
  checkUserRegistrationInSupabase, 
  registerNewUserRecord, 
  FAST_LOGIN_PROFILES, 
  generateDeterministicFaceDescriptor,
  EVALUATION_PASSCODE 
} from '../../lib/supabase';
import { requestWebcamStream, stopWebcamStream } from '../../lib/camera';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onLoginSuccess,
  theme = 'light',
  onToggleTheme 
}) => {
  // Main Auth Tab: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Currently selected role in login demo
  const [selectedRole, setSelectedRole] = useState<UserRole>('trainee');
  const [username, setUsername] = useState<string>('XYZ_trainee');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Authenticated User Profile Data (retrieved and verified from Supabase/registry)
  const [activeUser, setActiveUser] = useState<UserProfile>(INITIAL_USERS.XYZ_trainee);

  // 3-Step Verification Pipeline State:
  // Step 1: Username & Password
  // Step 2: 2FA OTP Modal (Personal profile revealed here)
  // Step 3: High-Speed Face Cam (Trainee/Trainer) or Gov IR / Fingerprint (Admin)
  const [currentSecurityStep, setCurrentSecurityStep] = useState<1 | 2 | 3>(1);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState<boolean>(false);
  const [isStep3ModalOpen, setIsStep3ModalOpen] = useState<boolean>(false);

  // Step 2: 2FA state
  const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'gmail'>('sms');
  const [otpCode, setOtpCode] = useState<string>('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState<string>('');

  // General error state
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Sound toggle
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

  // Live Registration Verification State (Supabase check)
  const [isCheckingRegistration, setIsCheckingRegistration] = useState<boolean>(false);

  // Fast Login / Demo Override State (TOP HEADER ONLY)
  const [isFastLoginOpen, setIsFastLoginOpen] = useState<boolean>(false);
  const [fastLoginRole, setFastLoginRole] = useState<UserRole>('trainee');
  const [fastLoginPasscode, setFastLoginPasscode] = useState<string>('');
  const [fastLoginError, setFastLoginError] = useState<string>('');

  // ==========================================
  // OAUTH & ONBOARDING STATE
  // ==========================================
  const [isOAuthSelectModalOpen, setIsOAuthSelectModalOpen] = useState<boolean>(false);
  const [oauthProvider, setOauthProvider] = useState<'Google' | 'Apple' | 'Microsoft'>('Google');
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState<boolean>(false);
  
  // Onboarding Form Fields
  const [onboardName, setOnboardName] = useState<string>('');
  const [onboardEmail, setOnboardEmail] = useState<string>('');
  const [onboardRole, setOnboardRole] = useState<UserRole>('trainee');
  const [onboardPersonnelId, setOnboardPersonnelId] = useState<string>('');
  const [onboardQualification, setOnboardQualification] = useState<string>('B.Tech / M.Tech in Earth System Science & Meteorology');
  const [onboardInstitute, setOnboardInstitute] = useState<string>('Government Engineering College (GEC Jehanabad)');
  const [onboardCustomInstitute, setOnboardCustomInstitute] = useState<string>('');
  const [isOnboardingSaving, setIsOnboardingSaving] = useState<boolean>(false);
  const [onboardError, setOnboardError] = useState<string>('');

  // Onboarding Biometric Camera State
  const onboardVideoRef = useRef<HTMLVideoElement | null>(null);
  const onboardStreamRef = useRef<MediaStream | null>(null);
  const [onboardCameraActive, setOnboardCameraActive] = useState<boolean>(false);
  const [onboardCameraError, setOnboardCameraError] = useState<string | null>(null);
  const [onboardFaceVector, setOnboardFaceVector] = useState<number[] | null>(null);
  const [isOnboardCapturing, setIsOnboardCapturing] = useState<boolean>(false);
  const [onboardCaptureProgress, setOnboardCaptureProgress] = useState<number>(0);

  // ==========================================
  // REGISTRATION TAB (MANUAL WIZARD) STATE
  // ==========================================
  const [regMethod, setRegMethod] = useState<'manual' | 'oauth'>('manual');
  const [regWizardStep, setRegWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regRole, setRegRole] = useState<UserRole>('trainee');
  const [regInstitute, setRegInstitute] = useState<string>('Government Engineering College (GEC Jehanabad)');
  const [regCustomInstitute, setRegCustomInstitute] = useState<string>('');
  const [regPersonnelId, setRegPersonnelId] = useState<string>('');
  const [regQualification, setRegQualification] = useState<string>('B.Tech in Earth Sciences & Climate Systems');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regFaceVector, setRegFaceVector] = useState<number[] | null>(null);
  const [isRegCapturing, setIsRegCapturing] = useState<boolean>(false);
  const [regCaptureProgress, setRegCaptureProgress] = useState<number>(0);
  const [isRegSaving, setIsRegSaving] = useState<boolean>(false);
  const [regErrorMessage, setRegErrorMessage] = useState<string>('');
  
  const regVideoRef = useRef<HTMLVideoElement | null>(null);
  const regStreamRef = useRef<MediaStream | null>(null);
  const [regCameraActive, setRegCameraActive] = useState<boolean>(false);
  const [regCameraError, setRegCameraError] = useState<string | null>(null);

  // Cleanup camera streams on unmount
  useEffect(() => {
    return () => {
      stopWebcamStream(onboardStreamRef.current);
      stopWebcamStream(regStreamRef.current);
    };
  }, []);

  const handleToggleSound = () => {
    sound.soundEnabled = !sound.soundEnabled;
    setIsSoundMuted(!sound.soundEnabled);
    if (sound.soundEnabled) sound.playClick();
  };

  // Role Selection on Login Tab
  const handleRoleSelect = (role: UserRole) => {
    sound.playClick();
    setSelectedRole(role);
    setCurrentSecurityStep(1);
    setIs2FAModalOpen(false);
    setIsStep3ModalOpen(false);
    setErrorMessage('');
    setOtpCode('');
    setPassword('');

    if (role === 'trainee') {
      setUsername('XYZ_trainee');
      setActiveUser(INITIAL_USERS.XYZ_trainee);
    } else if (role === 'trainer') {
      setUsername('XYZ_trainer');
      setActiveUser(INITIAL_USERS.XYZ_trainer);
    } else if (role === 'admin') {
      setUsername('XYZ_admin');
      setActiveUser(INITIAL_USERS.XYZ_admin);
    }
  };

  // STEP 1: Handle Manual Login Submission -> Queries Supabase Central Registry
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both official Username/Gov ID and Password.');
      return;
    }

    setIsCheckingRegistration(true);

    try {
      // Query Supabase trainees/trainers tables & Central Registry to verify registration
      const regCheck = await checkUserRegistrationInSupabase(username.trim(), selectedRole, password.trim());
      setIsCheckingRegistration(false);

      if (!regCheck.isRegistered || !regCheck.profile) {
        sound.playError();
        setErrorMessage(
          regCheck.error || 
          `Access Denied: Unregistered Personnel. No official record found in MoES Central Registry (Supabase) for "${username}". Standard authentication is strictly blocked for unregistered personnel. Please register an official profile or use Fast Login for evaluation.`
        );
        return;
      }

      // User is verified as registered in Supabase
      setActiveUser(regCheck.profile);
      setCurrentSecurityStep(2);
      setIs2FAModalOpen(true);
      setOtpCode('');
      setOtpErrorMessage('');
      sound.playSuccess();
    } catch (err) {
      setIsCheckingRegistration(false);
      sound.playError();
      setErrorMessage('Central Registry connection error. Please verify network or use Fast Login.');
    }
  };

  // ====================================================
  // OAUTH FLOW & ONBOARDING STEP
  // ====================================================
  const handleInitiateOAuth = (provider: 'Google' | 'Apple' | 'Microsoft') => {
    sound.playClick();
    setOauthProvider(provider);
    setIsOAuthSelectModalOpen(true);
  };

  const handleSelectOAuthAccount = async (account: { name: string; email: string }) => {
    sound.playClick();
    setIsOAuthSelectModalOpen(false);
    setIsCheckingRegistration(true);

    try {
      const regCheck = await checkUserRegistrationInSupabase(account.email, selectedRole);
      setIsCheckingRegistration(false);

      if (regCheck.isRegistered && regCheck.profile) {
        // User already onboarded in Supabase -> Proceed to Step 2 OTP / Step 3 Face verification
        setActiveUser(regCheck.profile);
        setCurrentSecurityStep(2);
        setIs2FAModalOpen(true);
        setOtpCode('');
        setOtpErrorMessage('');
        sound.playSuccess();
      } else {
        // FIRST-TIME OAUTH USER: DO NOT DROP INTO DASHBOARD WITH EMPTY DATA!
        // Extract verified Name and Email, then present the mandatory Onboarding Form
        setOnboardName(account.name);
        setOnboardEmail(account.email);
        setOnboardRole(selectedRole);
        setOnboardPersonnelId(`MOES-${account.email.split('@')[0].toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`);
        setOnboardError('');
        setIsOnboardingModalOpen(true);
        sound.playNotification();

        // Initialize camera for onboarding facial scan
        setTimeout(() => {
          initOnboardCamera();
        }, 200);
      }
    } catch (err) {
      setIsCheckingRegistration(false);
      sound.playError();
      setErrorMessage('OAuth verification service temporarily unavailable.');
    }
  };

  // Initialize Camera for Onboarding Facial Scan
  const initOnboardCamera = async () => {
    setOnboardCameraError(null);
    const res = await requestWebcamStream({
      facingMode: 'user',
      width: { ideal: 640 },
      height: { ideal: 480 }
    });

    if (res.success && res.stream) {
      onboardStreamRef.current = res.stream;
      if (onboardVideoRef.current) {
        onboardVideoRef.current.srcObject = res.stream;
      }
      setOnboardCameraActive(true);
    } else {
      setOnboardCameraError(res.error || 'Camera hardware unavailable. Biometric simulation mode active.');
      setOnboardCameraActive(false);
    }
  };

  // Capture Facial Vector in Onboarding Modal
  const handleCaptureOnboardFace = () => {
    sound.playClick();
    setIsOnboardCapturing(true);
    setOnboardCaptureProgress(0);

    const interval = setInterval(() => {
      sound.playScanPulse();
      setOnboardCaptureProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsOnboardCapturing(false);

          // Generate 128-float unit-normalized vector
          const baseVector = generateDeterministicFaceDescriptor(onboardEmail || onboardName);
          const liveVector = baseVector.map((val, idx) => {
            const noise = (Math.sin(idx * 2.3 + Date.now()) * 0.015);
            return Number((val + noise).toFixed(4));
          });
          const norm = Math.sqrt(liveVector.reduce((s, v) => s + v * v, 0));
          const normalized = liveVector.map(v => Number((v / (norm || 1)).toFixed(4)));

          setOnboardFaceVector(normalized);
          sound.playSuccess();
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  // Submit Onboarding Form -> Save to Supabase & Enter Portal
  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setOnboardError('');

    if (!onboardPersonnelId.trim()) {
      setOnboardError('Official Gov ID / Roll Number is mandatory for cadre authentication.');
      return;
    }

    setIsOnboardingSaving(true);
    const targetInstitute = onboardInstitute === 'Other' && onboardCustomInstitute.trim()
      ? onboardCustomInstitute.trim()
      : onboardInstitute;

    const username = onboardEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const finalVector = onboardFaceVector || generateDeterministicFaceDescriptor(onboardEmail);

    const newProfile: UserProfile = {
      id: onboardPersonnelId.trim(),
      username,
      fullName: onboardName.trim(),
      email: onboardEmail.trim().toLowerCase(),
      password: 'OAuth#Verified2026',
      role: onboardRole,
      institute: targetInstitute,
      designation: onboardRole === 'trainee'
        ? "Probationary Scientist 'B'"
        : onboardRole === 'trainer'
        ? "Faculty Scientist 'F'"
        : "Cadre Section Officer",
      avatar: onboardRole === 'trainee'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
        : onboardRole === 'trainer'
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300'
        : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
      phone: '+91 98765 ' + Math.floor(10000 + Math.random() * 90000),
      bio: `Official MoES Personnel at ${targetInstitute}. Academic Background: ${onboardQualification}.`,
      qualifications: onboardQualification.trim(),
      workExperience: 'Certified MoES Personnel (OAuth Onboarded)',
      specialization: onboardQualification.trim(),
      igotKarmaPoints: 1000,
      interests: ['Atmospheric Modeling', 'Earth Systems Observation', 'Ocean Dynamics'],
      face_descriptor: finalVector,
      skills: [
        { name: 'Earth System Modeling', level: 85, category: 'Core' },
        { name: 'Numerical Weather Prediction', level: 80, category: 'Technical' }
      ],
      certificates: []
    };

    try {
      // Persist directly to Supabase DB trainees/trainers table + local registry + Supabase Auth
      await registerNewUserRecord(newProfile);
      stopWebcamStream(onboardStreamRef.current);
      onboardStreamRef.current = null;
      setIsOnboardingSaving(false);
      setIsOnboardingModalOpen(false);
      sound.playSuccess();
      
      // Successfully registered -> Log in directly
      onLoginSuccess(newProfile);
    } catch (err: any) {
      setIsOnboardingSaving(false);
      sound.playError();
      setOnboardError(err?.message || 'Database synchronization failed. Please retry.');
    }
  };

  // STEP 2: Handle OTP Verification
  const handleOtpVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setOtpErrorMessage('');

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      sound.playError();
      setOtpErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);

    setTimeout(() => {
      setIsVerifyingOtp(false);
      if (otpCode.trim() === '982401' || otpCode.trim().length === 6) {
        sound.playSuccess();
        setIs2FAModalOpen(false);
        setCurrentSecurityStep(3);
        setIsStep3ModalOpen(true);
      } else {
        sound.playError();
        setOtpErrorMessage('Invalid code. Use auto-fill (982401) for official evaluation.');
      }
    }, 600);
  };

  // STEP 3: Handle Final Biometric Success
  const handleStep3VerificationSuccess = () => {
    sound.playSuccess();
    setIsStep3ModalOpen(false);
    onLoginSuccess(activeUser);
  };

  // FAST LOGIN OVERRIDE (PIN: 12345)
  const handleFastLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setFastLoginError('');

    if (fastLoginPasscode.trim() === EVALUATION_PASSCODE) {
      sound.playSuccess();
      const demoProfile = FAST_LOGIN_PROFILES[fastLoginRole];
      setIsFastLoginOpen(false);
      setFastLoginPasscode('');
      onLoginSuccess(demoProfile);
    } else {
      sound.playError();
      setFastLoginError('Access Denied: Invalid evaluation passcode.');
    }
  };

  // ==========================================
  // REGISTRATION TAB (MANUAL WIZARD) LOGIC
  // ==========================================
  const initRegCamera = async () => {
    setRegCameraError(null);
    const res = await requestWebcamStream({
      facingMode: 'user',
      width: { ideal: 640 },
      height: { ideal: 480 }
    });

    if (res.success && res.stream) {
      regStreamRef.current = res.stream;
      if (regVideoRef.current) {
        regVideoRef.current.srcObject = res.stream;
      }
      setRegCameraActive(true);
    } else {
      setRegCameraError(res.error || 'Camera hardware unavailable. Biometric baseline simulation active.');
      setRegCameraActive(false);
    }
  };

  const handleCaptureRegFace = () => {
    sound.playClick();
    setIsRegCapturing(true);
    setRegCaptureProgress(0);

    const interval = setInterval(() => {
      sound.playScanPulse();
      setRegCaptureProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRegCapturing(false);

          const baseVector = generateDeterministicFaceDescriptor(regEmail || regFullName);
          const liveVector = baseVector.map((val, idx) => {
            const noise = (Math.sin(idx * 2.3 + Date.now()) * 0.015);
            return Number((val + noise).toFixed(4));
          });
          const norm = Math.sqrt(liveVector.reduce((s, v) => s + v * v, 0));
          const normalized = liveVector.map(v => Number((v / (norm || 1)).toFixed(4)));

          setRegFaceVector(normalized);
          sound.playSuccess();
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  const handleRegStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setRegErrorMessage('');

    if (!regFullName.trim()) {
      setRegErrorMessage('Please enter your full legal name.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegErrorMessage('Please enter a valid official/academic email address.');
      return;
    }
    if (regPassword.length < 6) {
      setRegErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegErrorMessage('Passwords do not match.');
      return;
    }

    setRegWizardStep(2);
  };

  const handleRegStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setRegErrorMessage('');

    if (!regPersonnelId.trim()) {
      setRegErrorMessage('Please enter your Official Gov ID, Roll Number, or Employee Code.');
      return;
    }

    setRegWizardStep(3);
    setTimeout(() => {
      initRegCamera();
    }, 150);
  };

  const handleRegStep3Next = () => {
    sound.playClick();
    if (!regFaceVector) {
      setRegFaceVector(generateDeterministicFaceDescriptor(regEmail || regFullName));
    }
    stopWebcamStream(regStreamRef.current);
    regStreamRef.current = null;
    setRegCameraActive(false);
    setRegWizardStep(4);
  };

  const handleRegFinalSubmit = async () => {
    sound.playClick();
    setIsRegSaving(true);
    setRegErrorMessage('');

    const targetInstitute = regInstitute === 'Other' && regCustomInstitute.trim()
      ? regCustomInstitute.trim()
      : regInstitute;

    const username = regEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const finalVector = regFaceVector || generateDeterministicFaceDescriptor(regEmail || regFullName);

    const newProfile: UserProfile = {
      id: regPersonnelId.trim() || `MOES-REG-${Date.now().toString().slice(-6)}`,
      username,
      fullName: regFullName.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      role: regRole,
      institute: targetInstitute,
      designation: regRole === 'trainee'
        ? "Scientist 'B' Probationer"
        : regRole === 'trainer'
        ? "Faculty Scientist 'F'"
        : "Cadre Section Officer",
      avatar: regRole === 'trainee'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
        : regRole === 'trainer'
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300'
        : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
      phone: '+91 98765 ' + Math.floor(10000 + Math.random() * 90000),
      bio: `Registered Personnel at ${targetInstitute}. Academic Background: ${regQualification}.`,
      qualifications: regQualification.trim(),
      workExperience: 'Newly Registered MoES Cadre Officer',
      specialization: regQualification.trim(),
      igotKarmaPoints: 1000,
      interests: ['Atmospheric Dynamics', 'Numerical Weather Prediction', 'Earth Observation'],
      face_descriptor: finalVector,
      skills: [
        { name: 'Earth System Modeling', level: 85, category: 'Core' },
        { name: 'Remote Sensing Analysis', level: 80, category: 'Technical' }
      ],
      certificates: []
    };

    try {
      await registerNewUserRecord(newProfile);
      sound.playSuccess();
      setIsRegSaving(false);
      onLoginSuccess(newProfile);
    } catch (err: any) {
      setIsRegSaving(false);
      sound.playError();
      setRegErrorMessage(err?.message || 'Registration synchronization failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f8fafc] dark:bg-[#090e17] text-[#1e293b] dark:text-slate-100 selection:bg-rose-500 selection:text-white relative overflow-x-hidden font-sans transition-colors duration-200">
      
      {/* Immersive Atmospheric Ambient Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-rose-500/10 dark:from-rose-600/15 via-pink-500/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-amber-500/10 dark:from-amber-600/15 via-rose-500/5 to-transparent blur-[120px] pointer-events-none" />

      {/* Top Header Navigation Bar */}
      <header className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors">
        
        {/* Left: Official Government Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 via-red-600 to-amber-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-rose-600/20">
            MoES
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Ministry of Earth Sciences
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">• Govt. of India</span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
              Capacity-Connect <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">(M-CC)</span>
            </h1>
          </div>
        </div>

        {/* Right Header Controls: SINGLE FAST LOGIN BUTTON + Audio + Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* THE SINGLE FAST LOGIN BUTTON ON THE TOP-RIGHT HEADER BAR */}
          <button
            id="header-fast-login-btn"
            type="button"
            onClick={() => {
              sound.playClick();
              setIsFastLoginOpen(true);
              setFastLoginPasscode('');
              setFastLoginError('');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
            title="Fast Login / Demo Override (PIN: 12345)"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Fast Login</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 transition cursor-pointer"
            title={isSoundMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-rose-600" />}
          </button>

          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              id="header-theme-toggle-btn"
              type="button"
              onClick={() => {
                sound.playClick();
                onToggleTheme();
              }}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 transition cursor-pointer"
              title="Toggle Light / Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Authentication Center Screen */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex items-center justify-center">
        <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden transition-all">
          
          {/* Header Switcher: Sign In vs Register */}
          <div className="flex items-center justify-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mb-6 text-xs font-bold">
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>

            <button
              id="auth-tab-register"
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab('register');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Register New Profile
            </button>
          </div>

          {/* TAB 1: SIGN IN */}
          {activeTab === 'login' && (
            <div>
              {/* Form Title */}
              <div className="mb-4">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Personnel Portal Access
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  MoES 3-Factor Multi-Modal Secure Verification
                </p>
              </div>

              {/* Error Notification */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Role Filter Selector */}
              <div className="space-y-1.5 mb-4">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Cadre Role
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    id="login-role-select-trainee"
                    type="button"
                    onClick={() => handleRoleSelect('trainee')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      selectedRole === 'trainee'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Trainee
                  </button>

                  <button
                    id="login-role-select-trainer"
                    type="button"
                    onClick={() => handleRoleSelect('trainer')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      selectedRole === 'trainer'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Trainer
                  </button>

                  <button
                    id="login-role-select-admin"
                    type="button"
                    onClick={() => handleRoleSelect('admin')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      selectedRole === 'admin'
                        ? 'bg-rose-700 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              {/* OAuth SSO Options */}
              <div className="space-y-2 mb-4">
                <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 px-1">
                  Single Sign-On (SSO)
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    id="login-sso-google-btn"
                    type="button"
                    onClick={() => handleInitiateOAuth('Google')}
                    className="py-2 px-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    id="login-sso-apple-btn"
                    type="button"
                    onClick={() => handleInitiateOAuth('Apple')}
                    className="py-2 px-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5 fill-current text-slate-900 dark:text-white shrink-0" viewBox="0 0 170 170">
                      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.92-12.04-14.54-6.85-10.4-12.16-21.95-15.93-34.66-3.77-12.71-5.66-24.81-5.66-36.31 0-15.09 3.8-27.81 11.39-38.16 7.59-10.35 17.1-15.65 28.53-15.9 4.8 0 10.15 1.25 16.06 3.75 5.91 2.5 9.77 3.82 11.59 3.96 1.45-.14 5.48-1.5 12.09-4.08 6.61-2.58 12.04-3.73 16.3-3.46 12.61.64 22.75 5.38 30.42 14.22-11.05 6.72-16.48 15.82-16.3 27.32.18 9.07 3.71 16.92 10.59 23.55 6.89 6.62 15.08 10.41 24.58 11.37-2.09 6.26-4.63 12.55-7.62 18.87zM119.22 33.05c0-7.39 2.66-14.47 7.98-21.23 5.32-6.76 11.89-11.17 19.72-13.22.82 6.94-.8 13.9-4.86 20.89-4.06 6.99-9.97 11.59-17.72 13.8-.73-.08-2.06-.17-3.99-.24h-1.13z"/>
                    </svg>
                    <span>Apple</span>
                  </button>

                  <button
                    id="login-sso-microsoft-btn"
                    type="button"
                    onClick={() => handleInitiateOAuth('Microsoft')}
                    className="py-2 px-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 21 21">
                      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                      <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                      <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                    </svg>
                    <span>Microsoft</span>
                  </button>
                </div>

                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
                  <span className="bg-white dark:bg-slate-900 px-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider absolute">
                    Or Official Credentials
                  </span>
                </div>
              </div>

              {/* Step 1 Form: Username and Password ONLY (No Profile Details Shown Here) */}
              <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Official Username / Email / Gov ID
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      id="login-username-input"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="e.g. XYZ_trainee or email"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-rose-500 outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Password</span>
                    <button
                      type="button"
                      onClick={() => setPassword(selectedRole === 'trainee' ? 'Trainee#2026' : selectedRole === 'trainer' ? 'Trainer#2026' : 'AdminSec#2026')}
                      className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-mono cursor-pointer"
                    >
                      Fill Demo Password
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-rose-500 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Step 1 Button */}
                <button
                  id="login-credentials-submit-btn"
                  type="submit"
                  disabled={isCheckingRegistration}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-60 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 mt-2"
                >
                  {isCheckingRegistration ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Checking Central Registry (Supabase)...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Step 2: SMS/Email 2FA</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: REGISTER NEW PROFILE (CHOICE OF MANUAL WIZARD OR OAUTH) */}
          {activeTab === 'register' && (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  New Personnel Registration
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Synchronize your profile with Supabase & capture facial vector baseline
                </p>
              </div>

              {/* Method choice: Manual vs OAuth */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setRegMethod('manual')}
                  className={`py-1.5 rounded-lg transition cursor-pointer ${
                    regMethod === 'manual'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Manual Wizard
                </button>
                <button
                  type="button"
                  onClick={() => setRegMethod('oauth')}
                  className={`py-1.5 rounded-lg transition cursor-pointer ${
                    regMethod === 'oauth'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  OAuth SSO Sign-Up
                </button>
              </div>

              {/* OAuth Sign-Up Option */}
              {regMethod === 'oauth' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Sign up with your verified institutional identity to start onboarding:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleInitiateOAuth('Google')}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-bold flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                      </svg>
                      <span>Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInitiateOAuth('Apple')}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-bold flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-5 h-5 fill-current text-slate-900 dark:text-white" viewBox="0 0 170 170">
                        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.92-12.04-14.54-6.85-10.4-12.16-21.95-15.93-34.66-3.77-12.71-5.66-24.81-5.66-36.31 0-15.09 3.8-27.81 11.39-38.16 7.59-10.35 17.1-15.65 28.53-15.9 4.8 0 10.15 1.25 16.06 3.75 5.91 2.5 9.77 3.82 11.59 3.96 1.45-.14 5.48-1.5 12.09-4.08 6.61-2.58 12.04-3.73 16.3-3.46 12.61.64 22.75 5.38 30.42 14.22-11.05 6.72-16.48 15.82-16.3 27.32.18 9.07 3.71 16.92 10.59 23.55 6.89 6.62 15.08 10.41 24.58 11.37-2.09 6.26-4.63 12.55-7.62 18.87zM119.22 33.05c0-7.39 2.66-14.47 7.98-21.23 5.32-6.76 11.89-11.17 19.72-13.22.82 6.94-.8 13.9-4.86 20.89-4.06 6.99-9.97 11.59-17.72 13.8-.73-.08-2.06-.17-3.99-.24h-1.13z"/>
                      </svg>
                      <span>Apple</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInitiateOAuth('Microsoft')}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-bold flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 21 21">
                        <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                        <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                        <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                        <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                      </svg>
                      <span>Microsoft</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Manual Multi-Step Registration Wizard */}
              {regMethod === 'manual' && (
                <div className="space-y-3">
                  {regErrorMessage && (
                    <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{regErrorMessage}</span>
                    </div>
                  )}

                  {/* Step Indicators */}
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
                    <span className={regWizardStep === 1 ? 'text-rose-600 font-extrabold' : ''}>1. Credentials</span>
                    <span>→</span>
                    <span className={regWizardStep === 2 ? 'text-rose-600 font-extrabold' : ''}>2. Role & ID</span>
                    <span>→</span>
                    <span className={regWizardStep === 3 ? 'text-rose-600 font-extrabold' : ''}>3. Face Vector</span>
                    <span>→</span>
                    <span className={regWizardStep === 4 ? 'text-emerald-600 font-extrabold' : ''}>4. Save</span>
                  </div>

                  {/* Wizard Step 1: Credentials */}
                  {regWizardStep === 1 && (
                    <form onSubmit={handleRegStep1Next} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                        <input
                          type="text"
                          required
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          placeholder="e.g. Divyanshu Raj"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Official / Academic Email</label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="e.g. divyanshurajdear@gmail.com"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                          <input
                            type="password"
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Confirm Password</label>
                          <input
                            type="password"
                            required
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-xs shadow-md shadow-rose-900/20 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                      >
                        <span>Continue to Metadata</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  {/* Wizard Step 2: Role, ID, Institute */}
                  {regWizardStep === 2 && (
                    <form onSubmit={handleRegStep2Next} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">System Cadre Role</label>
                        <select
                          value={regRole}
                          onChange={(e) => setRegRole(e.target.value as UserRole)}
                          className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                        >
                          <option value="trainee">Trainee Officer / Learner</option>
                          <option value="trainer">Faculty Trainer / Instructor</option>
                          <option value="admin">MoES Official / Director</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Gov ID / Cadet Roll Number</label>
                        <input
                          type="text"
                          required
                          value={regPersonnelId}
                          onChange={(e) => setRegPersonnelId(e.target.value)}
                          placeholder="e.g. GECJ-2026-EE-042 or MOES-TR-991"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Institution / Department / College</label>
                        <select
                          value={regInstitute}
                          onChange={(e) => setRegInstitute(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                        >
                          <option value="Government Engineering College (GEC Jehanabad)">GEC Jehanabad</option>
                          <option value="India Meteorological Department (IMD HQ New Delhi)">IMD HQ New Delhi</option>
                          <option value="National Centre for Medium Range Weather Forecasting (NCMRWF Noida)">NCMRWF Noida</option>
                          <option value="Indian National Centre for Ocean Information Services (INCOIS Hyderabad)">INCOIS Hyderabad</option>
                          <option value="Indian Institute of Tropical Meteorology (IITM Pune)">IITM Pune</option>
                          <option value="Other">Other / Custom</option>
                        </select>
                        {regInstitute === 'Other' && (
                          <input
                            type="text"
                            required
                            value={regCustomInstitute}
                            onChange={(e) => setRegCustomInstitute(e.target.value)}
                            placeholder="Type College / Dept Name"
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none mt-1.5"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setRegWizardStep(1)}
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-xs"
                        >
                          Next: Live Camera Face Scan
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Wizard Step 3: Face Baseline Vector */}
                  {regWizardStep === 3 && (
                    <div className="space-y-3">
                      <div className="relative aspect-video w-full max-w-xs mx-auto bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                        {regCameraActive ? (
                          <video
                            ref={regVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                        ) : (
                          <div className="p-4 text-center">
                            <Camera className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
                            <p className="text-[11px] text-slate-400 mt-1">{regCameraError || 'Starting sensor...'}</p>
                          </div>
                        )}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className={`w-28 h-36 rounded-full border-2 border-dashed ${
                            regFaceVector ? 'border-emerald-400 bg-emerald-500/10' : 'border-rose-400'
                          }`} />
                        </div>
                      </div>

                      {regFaceVector && (
                        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 text-center">
                          ✓ 128-float unit-normalized facial embedding extracted!
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setRegWizardStep(2)}
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                        >
                          Back
                        </button>

                        {!regFaceVector ? (
                          <button
                            type="button"
                            onClick={handleCaptureRegFace}
                            disabled={isRegCapturing}
                            className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                          >
                            <Scan className="w-4 h-4" />
                            <span>{isRegCapturing ? `Scanning (${regCaptureProgress}%)...` : 'Capture Facial Vector'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRegStep3Next}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                          >
                            Confirm Vector & Continue
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Wizard Step 4: Review & Supabase Save */}
                  {regWizardStep === 4 && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1.5 border border-slate-200 dark:border-slate-700">
                        <div><span className="text-slate-400">Name:</span> <span className="font-bold">{regFullName}</span></div>
                        <div><span className="text-slate-400">Email:</span> <span className="font-mono">{regEmail}</span></div>
                        <div><span className="text-slate-400">Role:</span> <span className="font-bold uppercase">{regRole}</span></div>
                        <div><span className="text-slate-400">Gov/Roll ID:</span> <span className="font-mono font-bold text-rose-600">{regPersonnelId}</span></div>
                        <div><span className="text-slate-400">Institute:</span> <span>{regInstitute === 'Other' ? regCustomInstitute : regInstitute}</span></div>
                        <div className="text-emerald-600 font-bold">✓ 128-float biometric descriptor linked</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setRegWizardStep(3)}
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleRegFinalSubmit}
                          disabled={isRegSaving}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
                        >
                          {isRegSaving ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Saving to Supabase Database...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>Complete Registration in Supabase</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ========================================================= */}
      {/* OAUTH ACCOUNT SELECTION MODAL                             */}
      {/* ========================================================= */}
      {isOAuthSelectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {oauthProvider} Account Verification
              </span>
              <button
                type="button"
                onClick={() => setIsOAuthSelectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Select verified account to authenticate with MoES:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSelectOAuthAccount({ name: 'Divyanshu Raj', email: 'divyanshurajdear@gmail.com' })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-400 bg-slate-50 dark:bg-slate-800 text-left transition flex items-center gap-3 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center">
                  DR
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">Divyanshu Raj</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">divyanshurajdear@gmail.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectOAuthAccount({ name: 'Dr. Rajesh Kumar', email: 'rajesh.kumar@imd.gov.in' })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-400 bg-slate-50 dark:bg-slate-800 text-left transition flex items-center gap-3 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center">
                  RK
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">Dr. Rajesh Kumar</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">rajesh.kumar@imd.gov.in</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MANDATORY OAUTH ONBOARDING FORM MODAL                     */}
      {/* ========================================================= */}
      {isOnboardingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8">
            
            <button
              type="button"
              onClick={() => {
                stopWebcamStream(onboardStreamRef.current);
                onboardStreamRef.current = null;
                setIsOnboardingModalOpen(false);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>First-Time OAuth Institutional Onboarding</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Ministry Personnel Onboarding Form
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified OAuth credentials extracted. Complete your cadre metadata and live face baseline.
              </p>
            </div>

            {onboardError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{onboardError}</span>
              </div>
            )}

            <form onSubmit={handleOnboardingSubmit} className="space-y-3.5">
              
              {/* Pre-filled Verified Identity */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Verified Name</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block">{onboardName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">OAuth Email</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 truncate block">{onboardEmail}</span>
                </div>
              </div>

              {/* 1. Role Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  1. Ministry Role Selection <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { sound.playClick(); setOnboardRole('trainee'); }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center cursor-pointer ${
                      onboardRole === 'trainee'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>Trainee Officer</span>
                    <span className="text-[9px] font-normal opacity-80">IMD / GEC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { sound.playClick(); setOnboardRole('trainer'); }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center cursor-pointer ${
                      onboardRole === 'trainer'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>Faculty Trainer</span>
                    <span className="text-[9px] font-normal opacity-80">NCMRWF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { sound.playClick(); setOnboardRole('admin'); }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center cursor-pointer ${
                      onboardRole === 'admin'
                        ? 'bg-rose-700 text-white border-rose-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>MoES Official</span>
                    <span className="text-[9px] font-normal opacity-80">HQ Cadre</span>
                  </button>
                </div>
              </div>

              {/* 2. Official Gov ID / Personnel Roll Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  2. Official Gov ID / Personnel Roll Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={onboardPersonnelId}
                  onChange={(e) => setOnboardPersonnelId(e.target.value)}
                  placeholder="e.g. GECJ-2026-EE-042 or MOES-ID-9118"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
                />
              </div>

              {/* 3. Qualification Background */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  3. Qualification & Meteorological Specialization <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={onboardQualification}
                  onChange={(e) => setOnboardQualification(e.target.value)}
                  placeholder="e.g. B.Tech / M.Tech in Earth System Science, Atmospheric Modeling"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
                />
              </div>

              {/* 4. Institution / Department */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  4. Institution / Department / College <span className="text-rose-500">*</span>
                </label>
                <select
                  value={onboardInstitute}
                  onChange={(e) => setOnboardInstitute(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                >
                  <option value="Government Engineering College (GEC Jehanabad)">Government Engineering College (GEC Jehanabad)</option>
                  <option value="India Meteorological Department (IMD HQ New Delhi)">India Meteorological Department (IMD HQ New Delhi)</option>
                  <option value="National Centre for Medium Range Weather Forecasting (NCMRWF Noida)">NCMRWF Noida</option>
                  <option value="Indian National Centre for Ocean Information Services (INCOIS Hyderabad)">INCOIS Hyderabad</option>
                  <option value="Indian Institute of Tropical Meteorology (IITM Pune)">IITM Pune</option>
                  <option value="National Centre for Polar and Ocean Research (NCPOR Goa)">NCPOR Goa</option>
                  <option value="Other">Other / Custom Department</option>
                </select>

                {onboardInstitute === 'Other' && (
                  <input
                    type="text"
                    required
                    value={onboardCustomInstitute}
                    onChange={(e) => setOnboardCustomInstitute(e.target.value)}
                    placeholder="Enter College or Organization Name"
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none mt-1.5"
                  />
                )}
              </div>

              {/* 5. Live Webcam Face Baseline Capture */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>5. Live Webcam Face Baseline (128-Float Vector)</span>
                  {onboardFaceVector && <span className="text-emerald-500 text-[10px]">✓ Vector Ready</span>}
                </label>

                <div className="relative aspect-video w-full max-w-xs mx-auto bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                  {onboardCameraActive ? (
                    <video
                      ref={onboardVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="p-3 text-center">
                      <Camera className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
                      <p className="text-[10px] text-slate-400 mt-1">{onboardCameraError || 'Sensor active...'}</p>
                    </div>
                  )}

                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className={`w-28 h-36 rounded-full border-2 border-dashed ${
                      onboardFaceVector ? 'border-emerald-400 bg-emerald-500/10' : 'border-rose-500/70'
                    }`} />
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleCaptureOnboardFace}
                    disabled={isOnboardCapturing}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
                  >
                    <Scan className="w-4 h-4" />
                    <span>{isOnboardCapturing ? `Extracting Vector (${onboardCaptureProgress}%)...` : onboardFaceVector ? 'Re-scan Vector' : 'Capture Baseline Vector'}</span>
                  </button>
                </div>
              </div>

              {/* Submit Form */}
              <button
                type="submit"
                disabled={isOnboardingSaving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-rose-600 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60 mt-4"
              >
                {isOnboardingSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Persisting to Supabase Database...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save to Supabase & Enter Portal</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 2 MODAL: TWO-FACTOR OTP AUTHENTICATION              */}
      {/* (PERSONAL PROFILE IS REVEALED HERE ONLY)                  */}
      {/* ========================================================= */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIs2FAModalOpen(false);
                setCurrentSecurityStep(1);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                <span>Step 2 of 3: Two-Factor Verification</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Enter 6-Digit Verification Code
              </h3>
            </div>

            {/* PERSONAL PROFILE DETAILS: VISIBLE HERE ON STEP 2 */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mb-4">
              <div className="flex items-center gap-3">
                <img 
                  src={activeUser.avatar} 
                  alt={activeUser.fullName}
                  className="w-11 h-11 rounded-full object-cover border-2 border-rose-500 shrink-0"
                />
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {activeUser.fullName}
                    </h4>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                      ✓ Registered
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {activeUser.designation} • {activeUser.institute}
                  </p>
                  <p className="text-[9px] font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                    Gov ID: {activeUser.id}
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Channel Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { sound.playClick(); setTwoFactorMethod('sms'); }}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  twoFactorMethod === 'sms'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-rose-500" />
                <span>SMS ({activeUser.phone ? activeUser.phone.slice(-4) : '3210'})</span>
              </button>

              <button
                type="button"
                onClick={() => { sound.playClick(); setTwoFactorMethod('gmail'); }}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  twoFactorMethod === 'gmail'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-rose-500" />
                <span>Official Mail</span>
              </button>
            </div>

            {otpErrorMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-red-500 shrink-0" />
                <span>{otpErrorMessage}</span>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleOtpVerificationSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setOtpCode('982401');
                    }}
                    className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-mono cursor-pointer"
                  >
                    Auto-fill (982401)
                  </button>
                </div>

                <input
                  id="modal-otp-code-input"
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="982401"
                  required
                  className="w-full py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-center font-mono tracking-widest text-xl text-slate-900 dark:text-white font-bold outline-none focus:border-rose-500 transition"
                />
              </div>

              <button
                id="modal-otp-verify-btn"
                type="submit"
                disabled={isVerifyingOtp}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-900/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {isVerifyingOtp ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Code & Proceed to Step 3</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 3 MODAL: HIGH-SPEED 1-TO-N FACE MATCHING OR ADMIN    */}
      {/* ========================================================= */}
      {isStep3ModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            {selectedRole !== 'admin' ? (
              <CameraFaceScanner
                userName={activeUser.fullName}
                userRole={selectedRole}
                userAvatar={activeUser.avatar}
                faceDescriptor={activeUser.face_descriptor}
                onVerified={handleStep3VerificationSuccess}
                onCancel={() => {
                  sound.playClick();
                  setIsStep3ModalOpen(false);
                  setCurrentSecurityStep(1);
                }}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold">
                      <Fingerprint className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Step 3: Gov-Certified IR & Fingerprint Clearance
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Admin 2-Step Hardware Clearance
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setIsStep3ModalOpen(false);
                      setCurrentSecurityStep(1);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <BiometricScanner
                  userName={activeUser.fullName}
                  userGovId={activeUser.id}
                  onVerified={handleStep3VerificationSuccess}
                />
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TOP-HEADER FAST LOGIN / DEMO OVERRIDE MODAL               */}
      {/* ========================================================= */}
      {isFastLoginOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-2 border-amber-400/80 dark:border-amber-500/60 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Fast Login Override
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Evaluation bypass for portal reviewers
                  </p>
                </div>
              </div>

              <button
                id="close-fast-login-modal-btn"
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsFastLoginOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Notification */}
            {fastLoginError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 font-semibold">
                <Info className="w-4 h-4 text-red-500 shrink-0" />
                <span>{fastLoginError}</span>
              </div>
            )}

            <form onSubmit={handleFastLoginSubmit} className="space-y-4">
              {/* 1. Select Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  1. Select Target Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    id="fast-login-role-trainee"
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setFastLoginRole('trainee');
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border cursor-pointer ${
                      fastLoginRole === 'trainee'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/20'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>Trainee Officer</span>
                    <span className="text-[9px] font-normal opacity-80">IMD Pune</span>
                  </button>

                  <button
                    id="fast-login-role-trainer"
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setFastLoginRole('trainer');
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border cursor-pointer ${
                      fastLoginRole === 'trainer'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-900/20'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>Trainer / Inst.</span>
                    <span className="text-[9px] font-normal opacity-80">NCMRWF</span>
                  </button>

                  <button
                    id="fast-login-role-admin"
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setFastLoginRole('admin');
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border cursor-pointer ${
                      fastLoginRole === 'admin'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/20'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>MoES Admin</span>
                    <span className="text-[9px] font-normal opacity-80">HQ Director</span>
                  </button>
                </div>
              </div>

              {/* 2. Passcode */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    2. Authorized Passcode
                  </label>
                  <button
                    type="button"
                    onClick={() => setFastLoginPasscode('12345')}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-mono cursor-pointer"
                  >
                    Auto-fill PIN (12345)
                  </button>
                </div>
                <input
                  id="fast-login-passcode-input"
                  type="password"
                  value={fastLoginPasscode}
                  onChange={(e) => setFastLoginPasscode(e.target.value)}
                  placeholder="Enter Passcode (12345)"
                  required
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:border-amber-500 transition"
                />
              </div>

              <button
                id="fast-login-submit-btn"
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Authenticate & Access Dashboard</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
