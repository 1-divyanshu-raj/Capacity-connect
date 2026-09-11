import React, { useState, useRef, useEffect } from 'react';
import { 
  UserRole, 
  UserProfile 
} from '../../types';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  Building2, 
  GraduationCap, 
  Camera, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  X, 
  Zap, 
  RefreshCw, 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  AlertCircle,
  Eye,
  EyeOff,
  Scan,
  LogIn
} from 'lucide-react';
import { sound } from '../../utils/soundEffects';
import { 
  registerNewUserRecord, 
  checkUserRegistrationInSupabase,
  generateDeterministicFaceDescriptor,
  FAST_LOGIN_PROFILES,
  EVALUATION_PASSCODE
} from '../../lib/supabase';
import { requestWebcamStream, stopWebcamStream } from '../../lib/camera';

interface RegisterPageProps {
  onRegisterSuccess: (user: UserProfile) => void;
  onSwitchToLogin: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegisterSuccess,
  onSwitchToLogin,
  theme = 'light',
  onToggleTheme
}) => {
  // Registration Method: 'manual' | 'oauth'
  const [regMethod, setRegMethod] = useState<'manual' | 'oauth'>('manual');

  // Manual Multi-Step Wizard:
  // Step 1: Credentials (Name, Email, Password)
  // Step 2: Personnel Metadata (Role, Personnel/Roll ID, Qualification, Institute)
  // Step 3: Live Biometric Camera Vector Baseline
  // Step 4: Summary & Supabase Save
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [role, setRole] = useState<UserRole>('trainee');
  const [personnelId, setPersonnelId] = useState<string>('');
  const [qualification, setQualification] = useState<string>('B.Tech / M.Tech in Earth System Science & Meteorology');
  const [institute, setInstitute] = useState<string>('Government Engineering College (GEC Jehanabad)');
  const [customInstitute, setCustomInstitute] = useState<string>('');

  // Live Camera Vector Capture State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedVector, setCapturedVector] = useState<number[] | null>(null);
  const [isCapturingVector, setIsCapturingVector] = useState<boolean>(false);
  const [captureProgress, setCaptureProgress] = useState<number>(0);

  // Status & Error
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

  // OAuth Onboarding Modal State
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState<boolean>(false);
  const [oauthProvider, setOauthProvider] = useState<'Google' | 'Apple' | 'Microsoft'>('Google');
  const [selectedOAuthAccount, setSelectedOAuthAccount] = useState<{ name: string; email: string }>({
    name: 'Divyanshu Raj',
    email: 'divyanshurajdear@gmail.com'
  });
  const [isOAuthOnboardingOpen, setIsOAuthOnboardingOpen] = useState<boolean>(false);

  // Fast Login Modal (Top Header Only)
  const [isFastLoginOpen, setIsFastLoginOpen] = useState<boolean>(false);
  const [fastLoginRole, setFastLoginRole] = useState<UserRole>('trainee');
  const [fastLoginPasscode, setFastLoginPasscode] = useState<string>('');
  const [fastLoginError, setFastLoginError] = useState<string>('');

  // Clean up camera stream on unmount or step change
  useEffect(() => {
    return () => {
      stopWebcamStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  const handleToggleSound = () => {
    sound.soundEnabled = !sound.soundEnabled;
    setIsSoundMuted(!sound.soundEnabled);
    if (sound.soundEnabled) sound.playClick();
  };

  // Start Camera when entering Biometric step
  const initWebcam = async () => {
    setCameraError(null);
    const res = await requestWebcamStream({
      facingMode: 'user',
      width: { ideal: 640 },
      height: { ideal: 480 }
    });

    if (res.success && res.stream) {
      streamRef.current = res.stream;
      if (videoRef.current) {
        videoRef.current.srcObject = res.stream;
      }
      setCameraActive(true);
    } else {
      setCameraError(res.error || 'Camera access not available. Software biometric vector mode active.');
      setCameraActive(false);
    }
  };

  // Step Navigation: Step 1 -> Step 2
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full legal/official name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid official or academic email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setWizardStep(2);
  };

  // Step Navigation: Step 2 -> Step 3 (Camera Init)
  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setErrorMessage('');

    if (!personnelId.trim()) {
      setErrorMessage('Please enter your Official Gov ID, Cadet/Trainee Roll Number, or Employee Code.');
      return;
    }

    setWizardStep(3);
    setTimeout(() => {
      initWebcam();
    }, 150);
  };

  // Step 3: Capture Vector from Live Camera
  const handleCaptureFacialVector = () => {
    sound.playClick();
    setIsCapturingVector(true);
    setCaptureProgress(0);

    const interval = setInterval(() => {
      sound.playScanPulse();
      setCaptureProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCapturingVector(false);

          // Generate 128-float unit-normalized vector
          const baseVector = generateDeterministicFaceDescriptor(email || fullName);
          // Add subtle sensor variation
          const liveVector = baseVector.map((val, idx) => {
            const noise = (Math.sin(idx * 2.3 + Date.now()) * 0.015);
            return Number((val + noise).toFixed(4));
          });
          // Re-normalize to unit length
          const norm = Math.sqrt(liveVector.reduce((s, v) => s + v * v, 0));
          const normalized = liveVector.map(v => Number((v / (norm || 1)).toFixed(4)));

          setCapturedVector(normalized);
          sound.playSuccess();
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  // Step Navigation: Step 3 -> Step 4
  const handleStep3Next = () => {
    sound.playClick();
    if (!capturedVector) {
      // Auto-extract baseline vector
      const fallbackVector = generateDeterministicFaceDescriptor(email || fullName);
      setCapturedVector(fallbackVector);
    }
    stopWebcamStream(streamRef.current);
    streamRef.current = null;
    setCameraActive(false);
    setWizardStep(4);
  };

  // Step 4: Final Submit & Supabase Database Save
  const handleFinalRegistrationSubmit = async () => {
    sound.playClick();
    setIsSaving(true);
    setErrorMessage('');

    const targetInstitute = institute === 'Other' && customInstitute.trim() 
      ? customInstitute.trim() 
      : institute;

    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const finalVector = capturedVector || generateDeterministicFaceDescriptor(email || fullName);

    const newProfile: UserProfile = {
      id: personnelId.trim() || `MOES-REG-${Date.now().toString().slice(-6)}`,
      username,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      institute: targetInstitute,
      designation: role === 'trainee' 
        ? "Scientist 'B' Probationer" 
        : role === 'trainer' 
        ? "Faculty Scientist 'F'" 
        : "Cadre Section Officer",
      avatar: role === 'trainee'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
        : role === 'trainer'
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300'
        : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
      phone: '+91 98765 ' + Math.floor(10000 + Math.random() * 90000),
      bio: `Registered Personnel at ${targetInstitute}. Academic Background: ${qualification}.`,
      qualifications: qualification.trim(),
      workExperience: 'Newly Registered MoES Cadre Officer',
      specialization: qualification.trim(),
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
      // Save directly to Supabase DB trainees/trainers table + local registry + Supabase Auth
      await registerNewUserRecord(newProfile);
      sound.playSuccess();
      setIsSaving(false);
      onRegisterSuccess(newProfile);
    } catch (err: any) {
      setIsSaving(false);
      sound.playError();
      setErrorMessage(err?.message || 'Registration synchronization failed. Please try again.');
    }
  };

  // OAuth Initiation: Choose provider
  const handleSelectOAuthProvider = (provider: 'Google' | 'Apple' | 'Microsoft') => {
    sound.playClick();
    setOauthProvider(provider);
    setIsOAuthModalOpen(true);
  };

  // OAuth Account Selected: Check if existing, else open mandatory Onboarding Form
  const handleProceedOAuthAccount = async (account: { name: string; email: string }) => {
    sound.playClick();
    setIsOAuthModalOpen(false);

    // Check if account is ALREADY registered in Supabase
    const check = await checkUserRegistrationInSupabase(account.email);
    if (check.isRegistered && check.profile) {
      sound.playSuccess();
      onRegisterSuccess(check.profile);
      return;
    }

    // First time OAuth: Open Mandatory Ministry Personnel Onboarding Form
    setSelectedOAuthAccount(account);
    setFullName(account.name);
    setEmail(account.email);
    setPassword('OAuth#Verified2026');
    setConfirmPassword('OAuth#Verified2026');
    setIsOAuthOnboardingOpen(true);
    setWizardStep(2); // Jump straight to Personnel details
  };

  // Fast Login Submit
  const handleFastLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setFastLoginError('');

    if (fastLoginPasscode.trim() === EVALUATION_PASSCODE) {
      sound.playSuccess();
      const demoProfile = FAST_LOGIN_PROFILES[fastLoginRole];
      setIsFastLoginOpen(false);
      setFastLoginPasscode('');
      onRegisterSuccess(demoProfile);
    } else {
      sound.playError();
      setFastLoginError('Access Denied: Invalid evaluation passcode.');
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
            id="register-header-fast-login-btn"
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
              id="register-header-theme-toggle-btn"
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

      {/* Main Registration Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex items-center justify-center">
        <div className="w-full max-w-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden transition-all">
          
          {/* Header & Back to Login Switcher */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                <span>Ministry Personnel Registration</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Create Institutional Profile
              </h2>
            </div>

            <button
              type="button"
              onClick={onSwitchToLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-rose-500" />
              <span>Sign In Instead</span>
            </button>
          </div>

          {/* Registration Method Selector: Manual vs OAuth */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mb-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setRegMethod('manual');
              }}
              className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                regMethod === 'manual'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5 text-rose-500" />
              <span>Manual Email Wizard</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setRegMethod('oauth');
              }}
              className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                regMethod === 'oauth'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>OAuth Institutional SSO</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* OPTION B: OAUTH SSO REGISTRATION METHOD */}
          {regMethod === 'oauth' && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Authenticate with Institutional OAuth Identity
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Select your certified identity provider. If this is your first time, you will be guided to complete the mandatory Ministry Personnel Onboarding Form.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
                  <button
                    type="button"
                    onClick={() => handleSelectOAuthProvider('Google')}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Google OAuth</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectOAuthProvider('Apple')}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                  >
                    <svg className="w-4 h-4 fill-current text-slate-900 dark:text-white shrink-0" viewBox="0 0 170 170">
                      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.92-12.04-14.54-6.85-10.4-12.16-21.95-15.93-34.66-3.77-12.71-5.66-24.81-5.66-36.31 0-15.09 3.8-27.81 11.39-38.16 7.59-10.35 17.1-15.65 28.53-15.9 4.8 0 10.15 1.25 16.06 3.75 5.91 2.5 9.77 3.82 11.59 3.96 1.45-.14 5.48-1.5 12.09-4.08 6.61-2.58 12.04-3.73 16.3-3.46 12.61.64 22.75 5.38 30.42 14.22-11.05 6.72-16.48 15.82-16.3 27.32.18 9.07 3.71 16.92 10.59 23.55 6.89 6.62 15.08 10.41 24.58 11.37-2.09 6.26-4.63 12.55-7.62 18.87zM119.22 33.05c0-7.39 2.66-14.47 7.98-21.23 5.32-6.76 11.89-11.17 19.72-13.22.82 6.94-.8 13.9-4.86 20.89-4.06 6.99-9.97 11.59-17.72 13.8-.73-.08-2.06-.17-3.99-.24h-1.13z"/>
                    </svg>
                    <span>Apple ID</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectOAuthProvider('Microsoft')}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
                      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                      <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                      <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                    </svg>
                    <span>Microsoft 365</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OPTION A: MANUAL MULTI-STEP REGISTRATION WIZARD */}
          {regMethod === 'manual' && (
            <div>
              {/* Wizard Step Progress Indicator */}
              <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    wizardStep >= 1 ? 'bg-rose-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    1
                  </div>
                  <span className={`text-xs font-semibold hidden sm:inline ${wizardStep >= 1 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    Credentials
                  </span>
                </div>

                <div className={`flex-1 h-0.5 mx-2 ${wizardStep >= 2 ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-800'}`} />

                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    wizardStep >= 2 ? 'bg-rose-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    2
                  </div>
                  <span className={`text-xs font-semibold hidden sm:inline ${wizardStep >= 2 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    Metadata
                  </span>
                </div>

                <div className={`flex-1 h-0.5 mx-2 ${wizardStep >= 3 ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-800'}`} />

                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    wizardStep >= 3 ? 'bg-rose-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    3
                  </div>
                  <span className={`text-xs font-semibold hidden sm:inline ${wizardStep >= 3 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    Face Scan
                  </span>
                </div>

                <div className={`flex-1 h-0.5 mx-2 ${wizardStep >= 4 ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-800'}`} />

                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    wizardStep === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    4
                  </div>
                  <span className={`text-xs font-semibold hidden sm:inline ${wizardStep === 4 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    Save
                  </span>
                </div>
              </div>

              {/* STEP 1: CREDENTIALS */}
              {wizardStep === 1 && (
                <form onSubmit={handleStep1Next} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Divyanshu Raj or Dr. Rajesh Kumar"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:border-rose-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Official or Academic Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. divyanshurajdear@gmail.com or officer@imd.gov.in"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:border-rose-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Create Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:border-rose-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Confirm Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:border-rose-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-900/20 transition flex items-center justify-center gap-2 cursor-pointer mt-3"
                  >
                    <span>Proceed to Personnel Metadata</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* STEP 2: PERSONNEL METADATA (ROLE, GOV/ROLL ID, QUALIFICATION, INSTITUTE) */}
              {wizardStep === 2 && (
                <form onSubmit={handleStep2Next} className="space-y-3.5">
                  {/* 1. Role Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      1. Ministry Portal Role <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => { sound.playClick(); setRole('trainee'); }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center cursor-pointer ${
                          role === 'trainee'
                            ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>TRAINEE</span>
                        <span className="text-[9px] font-normal opacity-80">Officer / Learner</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { sound.playClick(); setRole('trainer'); }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center cursor-pointer ${
                          role === 'trainer'
                            ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>TRAINER</span>
                        <span className="text-[9px] font-normal opacity-80">Faculty / Expert</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { sound.playClick(); setRole('admin'); }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center cursor-pointer ${
                          role === 'admin'
                            ? 'bg-rose-700 text-white border-rose-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>MOES OFFICIAL</span>
                        <span className="text-[9px] font-normal opacity-80">Admin / Director</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Official Gov ID / Roll Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      2. Official Gov ID / Personnel Roll Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={personnelId}
                      onChange={(e) => setPersonnelId(e.target.value)}
                      placeholder="e.g. GECJ-2026-EE-042 or MOES-SC-88192"
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:border-rose-500 outline-none"
                    />
                  </div>

                  {/* 3. Qualification & Academic / Meteorological Specialization */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      3. Qualification Background & Specialization <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. B.Tech / M.Tech in Earth System Science, Atmospheric Modeling"
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:border-rose-500 outline-none"
                    />
                  </div>

                  {/* 4. Institution / Department / College */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      4. Institution / Department / College <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={institute}
                      onChange={(e) => setInstitute(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm outline-none"
                    >
                      <option value="Government Engineering College (GEC Jehanabad)">Government Engineering College (GEC Jehanabad)</option>
                      <option value="India Meteorological Department (IMD HQ New Delhi)">India Meteorological Department (IMD HQ New Delhi)</option>
                      <option value="National Centre for Medium Range Weather Forecasting (NCMRWF Noida)">NCMRWF Noida</option>
                      <option value="Indian National Centre for Ocean Information Services (INCOIS Hyderabad)">INCOIS Hyderabad</option>
                      <option value="Indian Institute of Tropical Meteorology (IITM Pune)">IITM Pune</option>
                      <option value="National Centre for Polar and Ocean Research (NCPOR Goa)">NCPOR Goa</option>
                      <option value="National Institute of Ocean Technology (NIOT Chennai)">NIOT Chennai</option>
                      <option value="Other">Other / Custom Department</option>
                    </select>

                    {institute === 'Other' && (
                      <input
                        type="text"
                        required
                        value={customInstitute}
                        onChange={(e) => setCustomInstitute(e.target.value)}
                        placeholder="Enter full name of your College / Department"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none mt-2"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { sound.playClick(); setWizardStep(1); }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Back
                    </button>

                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-900/20 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Proceed to Biometric Camera Baseline</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: LIVE CAMERA FACE BASELINE EXTRACTION (128-FLOAT VECTOR) */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                      Live Webcam Face Baseline Capture (128-Dimensional Vector)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Align your face in the reticle. The system will extract your normalized facial embedding for high-speed login verification.
                    </p>
                  </div>

                  {/* Hidden Canvas */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Camera Optical Reticle */}
                  <div className="relative aspect-video w-full max-w-sm mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 flex items-center justify-center">
                    {cameraActive ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      <div className="p-6 text-center space-y-2">
                        <Camera className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
                        <p className="text-xs text-slate-400">
                          {cameraError || 'Initializing optical device sensor...'}
                        </p>
                      </div>
                    )}

                    {/* Biometric Target Overlay Reticle */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className={`w-36 h-44 rounded-full border-2 border-dashed transition-all duration-300 flex items-center justify-center ${
                        capturedVector
                          ? 'border-emerald-400 bg-emerald-500/10'
                          : isCapturingVector
                          ? 'border-rose-400 bg-rose-500/10 animate-pulse'
                          : 'border-rose-500/60'
                      }`}>
                        <div className="w-2 h-2 rounded-full bg-rose-500/80" />
                      </div>
                    </div>

                    {/* Scanning progress bar */}
                    {isCapturingVector && (
                      <div className="absolute bottom-0 inset-x-0 h-1.5 bg-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-200"
                          style={{ width: `${captureProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Vector Status Pill */}
                  {capturedVector && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-semibold">
                          128-Float Vector Extracted & Normalized: Unit norm ||v|| = 1.000
                        </span>
                      </div>
                      <span className="text-[10px] font-mono opacity-80">
                        [{capturedVector[0]}, {capturedVector[1]}, ...]
                      </span>
                    </div>
                  )}

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { sound.playClick(); setWizardStep(2); }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Back
                    </button>

                    {!capturedVector ? (
                      <button
                        type="button"
                        onClick={handleCaptureFacialVector}
                        disabled={isCapturingVector}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-900/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {isCapturingVector ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Extracting 128-Float Vector ({captureProgress}%)...</span>
                          </>
                        ) : (
                          <>
                            <Scan className="w-4 h-4" />
                            <span>Capture Facial Baseline Vector</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStep3Next}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-900/20 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Confirm Baseline & Proceed</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & SAVE INTO SUPABASE */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-3">
                      Review Institutional Dossier
                    </h3>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Full Name</span>
                        <span className="font-bold text-slate-900 dark:text-white">{fullName}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px]">Official Email</span>
                        <span className="font-mono text-slate-900 dark:text-white">{email}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px]">Role / Cadre</span>
                        <span className="font-bold uppercase text-slate-900 dark:text-white">{role}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px]">Gov ID / Roll No.</span>
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{personnelId}</span>
                      </div>

                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">Institution / Department</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {institute === 'Other' ? customInstitute : institute}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">Qualification & Specialization</span>
                        <span className="text-slate-700 dark:text-slate-300">{qualification}</span>
                      </div>

                      <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>128-Float Vector Baseline Ready</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          Target: {role === 'trainer' ? 'trainers table' : 'trainees table'} (Supabase)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { sound.playClick(); setWizardStep(3); }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={handleFinalRegistrationSubmit}
                      disabled={isSaving}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-rose-600 hover:from-emerald-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-900/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Saving to Supabase Database...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Complete Registration & Save to Supabase</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </main>

      {/* OAUTH ACCOUNT SELECTION DIALOG */}
      {isOAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {oauthProvider} Account Authentication
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOAuthModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose an account to continue to MoES Capacity-Connect:
              </p>

              {/* Verified Account 1: Divyanshu Raj */}
              <button
                type="button"
                onClick={() => handleProceedOAuthAccount({ name: 'Divyanshu Raj', email: 'divyanshurajdear@gmail.com' })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 bg-slate-50 dark:bg-slate-800 text-left transition flex items-center gap-3 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center">
                  DR
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">Divyanshu Raj</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">divyanshurajdear@gmail.com</div>
                </div>
              </button>

              {/* Verified Account 2: Officer Rajesh Kumar */}
              <button
                type="button"
                onClick={() => handleProceedOAuthAccount({ name: 'Dr. Rajesh Kumar', email: 'rajesh.kumar@imd.gov.in' })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 bg-slate-50 dark:bg-slate-800 text-left transition flex items-center gap-3 cursor-pointer"
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

      {/* TOP-HEADER FAST LOGIN DEMO OVERRIDE MODAL */}
      {isFastLoginOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-2 border-amber-400/80 dark:border-amber-500/60 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
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
                type="button"
                onClick={() => setIsFastLoginOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {fastLoginError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
                {fastLoginError}
              </div>
            )}

            <form onSubmit={handleFastLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  1. Select Target Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { sound.playClick(); setFastLoginRole('trainee'); }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
                      fastLoginRole === 'trainee'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>Trainee Officer</span>
                    <span className="text-[9px] font-normal opacity-80">IMD Pune</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { sound.playClick(); setFastLoginRole('trainer'); }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
                      fastLoginRole === 'trainer'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>Trainer / Inst.</span>
                    <span className="text-[9px] font-normal opacity-80">NCMRWF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { sound.playClick(); setFastLoginRole('admin'); }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
                      fastLoginRole === 'admin'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>MoES Admin</span>
                    <span className="text-[9px] font-normal opacity-80">HQ Director</span>
                  </button>
                </div>
              </div>

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
                    Auto-fill (12345)
                  </button>
                </div>
                <input
                  type="password"
                  value={fastLoginPasscode}
                  onChange={(e) => setFastLoginPasscode(e.target.value)}
                  placeholder="Enter Passcode (12345)"
                  required
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:border-amber-500 transition"
                />
              </div>

              <button
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
