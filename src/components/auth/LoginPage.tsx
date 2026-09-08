import React, { useState } from 'react';
import { UserRole, UserProfile } from '../../types';
import { INITIAL_USERS } from '../../data/mockData';
import { BiometricScanner } from './BiometricScanner';
import { CameraFaceScanner } from './CameraFaceScanner';
import { generateRandomProfile, RandomProfileData } from '../../utils/randomProfiles';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  UserCheck,
  Mail, 
  Smartphone, 
  ArrowRight, 
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
  Radio,
  Dices,
  Camera,
  KeyRound,
  X,
  Send,
  Building2,
  UserPlus,
  LogIn
} from 'lucide-react';
import { sound } from '../../utils/soundEffects';

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

  // Active User Profile Data (default XYZ_roles profiles)
  const [activeUser, setActiveUser] = useState<UserProfile>(INITIAL_USERS.XYZ_trainee);

  // 3-Step Verification Pipeline State:
  // Step 1: Initial Password Method (on main form)
  // Step 2: 2FA Modal (SMS or Gmail 6-digit code)
  // Step 3: Biometric (Admin) or Face Recognition (Trainee/Trainer)
  const [currentSecurityStep, setCurrentSecurityStep] = useState<1 | 2 | 3>(1);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState<boolean>(false);
  const [isStep3ModalOpen, setIsStep3ModalOpen] = useState<boolean>(false);

  // Step 2: 2FA state
  const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'gmail'>('sms');
  const [otpCode, setOtpCode] = useState<string>('');
  const [resendCountdown, setResendCountdown] = useState<number>(45);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState<string>('');

  // Step 3 verification flag
  const [step3Passed, setStep3Passed] = useState<boolean>(false);

  // General error state
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Sound toggle
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

  // Mobile responsive section switcher ('auth' | 'insights' | 'announcements')
  const [mobileActiveSection, setMobileActiveSection] = useState<'auth' | 'insights' | 'announcements'>('auth');

  // Registration Form State
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regRole, setRegRole] = useState<UserRole>('trainee');
  const [regInstitute, setRegInstitute] = useState<string>('India Meteorological Department (IMD HQ)');
  const [regPassword, setRegPassword] = useState<string>('');

  // Handle Quick Role Select - assigns XYZ_<role> as default profile
  const handleRoleSelect = (role: UserRole) => {
    sound.playClick();
    setSelectedRole(role);
    setCurrentSecurityStep(1);
    setIs2FAModalOpen(false);
    setIsStep3ModalOpen(false);
    setStep3Passed(false);
    setErrorMessage('');
    setOtpCode('');

    setPassword(''); // Strictly ensure password is empty on role switch so no profile is mentioned!

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

  // Helper to unlock demo profile by setting the required password
  const handleUnlockDemoProfile = () => {
    sound.playClick();
    const demoPassword = selectedRole === 'admin' ? 'AdminSec#2026' : selectedRole === 'trainer' ? 'Trainer#2026' : 'Trainee#2026';
    setPassword(demoPassword);
    setErrorMessage('');
  };

  const handleToggleSound = () => {
    sound.soundEnabled = !sound.soundEnabled;
    setIsSoundMuted(!sound.soundEnabled);
    if (sound.soundEnabled) sound.playClick();
  };

  // STEP 1: Handle Initial Password Submission -> Triggers Step 2: 2FA Modal
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Please enter your official username or government ID.');
      return;
    }

    if (!password) {
      setErrorMessage('Please provide your account password.');
      return;
    }

    // Advance to Step 2: Open 2FA Verification Modal!
    setCurrentSecurityStep(2);
    setOtpCode('982401'); // Pre-fill demo hint for evaluation
    setIs2FAModalOpen(true);
  };

  // STEP 2: Handle 2FA OTP Submission -> Advances to Step 3 (Camera Face Recognition or Admin Biometric)
  const handleOtpVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setOtpErrorMessage('');

    if (!otpCode || otpCode.trim().length < 6) {
      setOtpErrorMessage('Please provide the full 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    setTimeout(() => {
      sound.playSuccess();
      setIsVerifyingOtp(false);
      setIs2FAModalOpen(false);

      // Transition to Step 3: Face Recognition (Trainee/Trainer) or Gov Biometric (Admin)
      setCurrentSecurityStep(3);
      setIsStep3ModalOpen(true);
    }, 500);
  };

  // STEP 3: Handle Final Biometric / Face Recognition Success -> Logs user into portal
  const handleStep3VerificationSuccess = () => {
    setStep3Passed(true);
    setIsStep3ModalOpen(false);
    sound.playSuccess();

    // Log the user into their role-isolated portal
    setTimeout(() => {
      onLoginSuccess(activeUser);
    }, 400);
  };

  // Handle Register Form Submission
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (!regFullName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage('Please fill out all required registration fields.');
      return;
    }

    // Create a new registered profile with randomized avatar and Gov ID
    const random = generateRandomProfile(regRole);
    const newUser: UserProfile = {
      id: random.govId,
      username: regEmail.split('@')[0],
      fullName: regFullName,
      email: regEmail,
      phone: random.phone,
      bio: `Registered Personnel at ${regInstitute}.`,
      role: regRole,
      designation: random.designation,
      institute: regInstitute,
      avatar: random.avatar,
      qualifications: 'MoES Certified Scientist Program',
      workExperience: `Researcher at ${regInstitute}`,
      interests: ['Numerical Weather Prediction', 'Radar Meteorology'],
      skills: [
        { name: 'Climate Data', level: 85, category: 'Research' },
        { name: 'Satellite Telemetry', level: 80, category: 'Technical' }
      ],
      certificates: []
    };

    setActiveUser(newUser);
    setSelectedRole(regRole);
    setUsername(newUser.username);
    setPassword(regPassword);
    setActiveTab('login');

    // Automatically trigger Step 2 (2FA Verification)
    setCurrentSecurityStep(2);
    setOtpCode('982401');
    setIs2FAModalOpen(true);
  };

  // Handle SSO Sign-in (Google, Apple, Microsoft)
  const handleSSOSignIn = (provider: 'Google' | 'Apple' | 'Microsoft') => {
    sound.playClick();
    const random = generateRandomProfile(selectedRole);
    const ssoUser: UserProfile = {
      id: random.govId,
      username: `${provider.toLowerCase()}_${random.username}`,
      fullName: random.fullName,
      email: `${random.username}@${provider.toLowerCase()}.com`,
      phone: random.phone,
      bio: `${provider} SSO Verified MoES Researcher.`,
      role: selectedRole,
      designation: random.designation,
      institute: random.institute,
      avatar: random.avatar,
      qualifications: `${provider} Single-Sign-On Verified Scientist`,
      workExperience: 'Government Science Integration',
      interests: ['Earth Systems Modeling', 'Radar Analysis'],
      skills: [
        { name: 'Cloud Compute', level: 88, category: 'Computing' },
        { name: 'Geospatial Analytics', level: 82, category: 'Technical' }
      ],
      certificates: []
    };

    setActiveUser(ssoUser);
    // Proceed directly to Step 2 2FA verification modal
    setCurrentSecurityStep(2);
    setOtpCode('982401');
    setIs2FAModalOpen(true);
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between bg-[#f8fafc] dark:bg-[#090e17] text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-rose-400 selection:text-white font-sans transition-colors duration-200">
      
      {/* Immersive Atmospheric Ambient Glows */}
      <div className="absolute -top-24 -left-24 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.14)_0%,rgba(255,255,255,0)_70%)] dark:bg-[radial-gradient(circle,rgba(244,63,94,0.22)_0%,rgba(9,14,23,0)_70%)] pointer-events-none z-0" />
      <div className="absolute -bottom-24 -right-24 w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.08)_0%,rgba(255,255,255,0)_70%)] dark:bg-[radial-gradient(circle,rgba(239,68,68,0.18)_0%,rgba(9,14,23,0)_70%)] pointer-events-none z-0" />

      {/* Immersive Top Header */}
      <header className="h-[70px] border-b border-[#e2e8f0] dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-[12px] flex items-center justify-between px-4 sm:px-8 lg:px-10 z-20 relative transition-colors duration-200">
        
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md shadow-rose-500/25 shrink-0">
            CC
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-[#1e293b] dark:text-white m-0 tracking-tight leading-tight flex items-center gap-2">
              CAPACITY <span className="text-rose-500 dark:text-rose-400">CONNECT</span>
            </h1>
            <p className="text-[10px] text-[#64748b] dark:text-slate-400 m-0 uppercase tracking-wider font-semibold">
              Ministry of Earth Sciences | IMD
            </p>
          </div>
        </div>

        {/* Header Controls: Theme Toggle & Sound */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleTheme && (
            <button
              id="login-theme-toggle-btn"
              type="button"
              onClick={() => {
                sound.playToggle();
                onToggleTheme();
              }}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold bg-white/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-4 h-4 text-rose-500" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Light Mode</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleSound}
            title={isSoundMuted ? 'Sound Disabled (Click to Enable)' : 'Audio Feedback Enabled (Click to Mute)'}
            className="p-1.5 sm:px-2 sm:py-1.5 rounded-xl border text-xs bg-white/80 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95"
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-rose-500 dark:text-rose-400" />}
          </button>

          <div className="hidden md:flex items-center gap-1.5 text-[11px] bg-[#f1f5f9] dark:bg-slate-800 px-3 py-1 rounded-full text-[#475569] dark:text-slate-300 font-semibold border border-slate-200/60 dark:border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>THREE-STEP-SECURITY</span>
          </div>
        </div>
      </header>

      {/* Mobile Responsive Navigation Switcher */}
      <div className="lg:hidden flex items-center justify-center p-2 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 gap-2 z-10">
        <button
          type="button"
          onClick={() => setMobileActiveSection('auth')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            mobileActiveSection === 'auth'
              ? 'bg-[#1e293b] dark:bg-rose-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          🔐 Sign In / Register
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveSection('insights')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            mobileActiveSection === 'insights'
              ? 'bg-[#1e293b] dark:bg-rose-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          📊 Insights
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveSection('announcements')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            mobileActiveSection === 'announcements'
              ? 'bg-[#1e293b] dark:bg-rose-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          📢 Updates
        </button>
      </div>

      {/* Main 3-Column Content Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-[290px_1fr_290px] gap-6 items-center z-10 relative">
        
        {/* Left Column: Platform Insights */}
        <aside className={`${mobileActiveSection === 'insights' ? 'flex' : 'hidden'} lg:flex flex-col gap-5 h-full justify-center`}>
          <div className="immersive-side-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs text-[#ef4444] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Platform Insights
              </h3>
              <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-bold">LIVE</span>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[11px] text-[#64748b] dark:text-slate-400 mb-0.5 font-medium">Active Trainees</p>
                <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">1,284</div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Scientists & Forecasters</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-[#64748b] dark:text-slate-400 font-medium">Skill Gap Analysis</p>
                  <span className="text-[10px] font-bold text-[#ef4444]">65% Closed</span>
                </div>
                <div className="h-2 bg-[#e2e8f0] dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[65%] h-full bg-gradient-to-r from-[#fb7185] to-[#ef4444] rounded-full" />
                </div>
                <p className="text-[10px] text-[#64748b] dark:text-slate-400 mt-1.5 font-medium">
                  Priority Gap: <span className="text-rose-700 dark:text-rose-400 font-semibold">Radar Meteorology</span>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">National Batches</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">18 Active Cohorts</span>
              </div>
            </div>
          </div>

          <div className="immersive-side-card p-5 flex flex-col justify-center text-center">
            <div className="text-3xl mb-1.5 animate-bounce">🤖</div>
            <h4 className="text-sm font-bold text-[#1e293b] dark:text-white mb-1">AI Co-Pilot Active</h4>
            <p className="text-[11px] text-[#64748b] dark:text-slate-400 leading-relaxed italic">
              "Three-Step Verification is active: Passwords, SMS/Email OTP, and Device Camera Face Recognition / IR Biometrics."
            </p>
            <div className="mt-3 inline-flex items-center justify-center gap-1.5 text-[10px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 py-1 px-3 rounded-full mx-auto border border-rose-200/80 dark:border-rose-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Gemini 2.5 Security Engine</span>
            </div>
          </div>
        </aside>

        {/* Center Column: Focal Authentication Card with Three-Step Flow */}
        <section className={`${mobileActiveSection === 'auth' ? 'flex' : 'hidden'} lg:flex items-center justify-center w-full`}>
          <div className="w-full max-w-[500px] bg-white/75 dark:bg-slate-900/80 backdrop-blur-[40px] border border-white/90 dark:border-slate-700/80 rounded-[32px] sm:rounded-[40px] p-5 sm:p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden transition-all">
            
            {/* Top Right Ambient Glow Accent */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-rose-500/15 dark:from-rose-400/15 to-transparent rounded-bl-[100px] pointer-events-none" />

            {/* Top Auth Tab Switcher: [ Sign In ] vs [ Register / New Account ] */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 mb-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { sound.playClick(); setActiveTab('login'); }}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white dark:bg-slate-700 text-[#1e293b] dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                <span>Government Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => { sound.playClick(); setActiveTab('register'); }}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white dark:bg-slate-700 text-[#1e293b] dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Register / New Account</span>
              </button>
            </div>

            {/* Three-Step Verification Visual Tracker */}
            <div className="mb-5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                <span>Three-Step Verification</span>
                <span className="text-rose-600 dark:text-rose-400">Step {currentSecurityStep} of 3</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center">
                {/* Step 1 Pill */}
                <div className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold border flex flex-col items-center justify-center transition-all ${
                  currentSecurityStep === 1
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-800 dark:text-rose-300 font-bold'
                    : currentSecurityStep > 1
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}>
                  <span>1. Password</span>
                  <span className="text-[9px] opacity-75">{currentSecurityStep > 1 ? '✓ Passed' : 'Credentials'}</span>
                </div>

                {/* Step 2 Pill */}
                <div className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold border flex flex-col items-center justify-center transition-all ${
                  currentSecurityStep === 2
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-800 dark:text-rose-300 font-bold'
                    : currentSecurityStep > 2
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}>
                  <span>2. SMS / Email</span>
                  <span className="text-[9px] opacity-75">{currentSecurityStep > 2 ? '✓ 6-Digit OTP' : '2FA Code'}</span>
                </div>

                {/* Step 3 Pill */}
                <div className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold border flex flex-col items-center justify-center transition-all ${
                  currentSecurityStep === 3
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-800 dark:text-rose-300 font-bold'
                    : step3Passed
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}>
                  <span>3. {selectedRole === 'admin' ? 'Gov IR/Print' : 'Face Cam'}</span>
                  <span className="text-[9px] opacity-75">{selectedRole === 'admin' ? 'Biometric' : 'Recognition'}</span>
                </div>
              </div>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN FLOW */}
            {activeTab === 'login' && (
              <>
                {/* Role Switcher Demo Buttons (TRAINEE / TRAINER / ADMIN) */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between px-1">
                    <span>Target Personnel Role</span>
                    <button
                      type="button"
                      onClick={handleUnlockDemoProfile}
                      className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      title="Auto-fill official demo password to decrypt profile"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{password ? 'Password Active' : 'Auto-fill Demo Password'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      id="role-btn-trainee"
                      type="button"
                      onClick={() => handleRoleSelect('trainee')}
                      className={`py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border cursor-pointer ${
                        selectedRole === 'trainee'
                          ? 'bg-[#1e293b] dark:bg-rose-700 text-white border-[#1e293b] dark:border-rose-600 shadow-sm scale-[1.02]'
                          : 'bg-white dark:bg-slate-800 border-[#e2e8f0] dark:border-slate-700 text-[#475569] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-[11px] sm:text-xs">TRAINEE</span>
                      <span className="text-[9px] font-normal opacity-75">Face Cam Required</span>
                    </button>

                    <button
                      id="role-btn-trainer"
                      type="button"
                      onClick={() => handleRoleSelect('trainer')}
                      className={`py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border cursor-pointer ${
                        selectedRole === 'trainer'
                          ? 'bg-[#1e293b] dark:bg-amber-700 text-white border-[#1e293b] dark:border-amber-600 shadow-sm scale-[1.02]'
                          : 'bg-white dark:bg-slate-800 border-[#e2e8f0] dark:border-slate-700 text-[#475569] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-[11px] sm:text-xs">TRAINER</span>
                      <span className="text-[9px] font-normal opacity-75">Face Cam Required</span>
                    </button>

                    <button
                      id="role-btn-admin"
                      type="button"
                      onClick={() => handleRoleSelect('admin')}
                      className={`py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border cursor-pointer ${
                        selectedRole === 'admin'
                          ? 'bg-[#1e293b] dark:bg-rose-700 text-white border-[#1e293b] dark:border-rose-600 shadow-sm scale-[1.02]'
                          : 'bg-white dark:bg-slate-800 border-[#e2e8f0] dark:border-slate-700 text-[#475569] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-[11px] sm:text-xs">ADMIN</span>
                      <span className="text-[9px] font-normal opacity-75">Gov IR / Print</span>
                    </button>
                  </div>
                </div>

                {/* Password-Dependent Profile Vault Section: NO PROFILE MENTIONED WHEN PASSWORD IS EMPTY */}
                {!password.trim() ? (
                  <div className="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-dashed border-slate-300 dark:border-slate-700 mb-4 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400">
                        <Lock className="w-5 h-5 animate-pulse text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Personnel Profile Encrypted & Concealed
                          </h4>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shrink-0">
                            Password Required
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          Identity and clearances are hidden. Fill official password below to authenticate and reveal dossier.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/70 mb-4 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img 
                          src={activeUser.avatar} 
                          alt={activeUser.fullName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 dark:border-emerald-400 shrink-0"
                        />
                        <div className="text-left min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                              {activeUser.fullName}
                            </h4>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shrink-0">
                              ✓ Decrypted
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium truncate max-w-[210px]">
                            {activeUser.designation} • {activeUser.institute}
                          </p>
                        </div>
                      </div>

                      <span className="text-[9px] font-mono font-semibold px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                        {activeUser.role.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Form: Step 1 Password Method */}
                <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#475569] dark:text-slate-300 flex items-center justify-between">
                      <span>Step 1: Official Username / Gov ID</span>
                      <span className="text-[10px] text-[#94a3b8] dark:text-slate-500">Government Portal</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3 text-[#94a3b8] dark:text-slate-500" />
                      <input
                        id="login-username-input"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder="Official username"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-[#cbd5e1] dark:border-slate-700 text-[#1e293b] dark:text-white text-sm focus:border-rose-500 outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#475569] dark:text-slate-300 flex items-center justify-between">
                      <span>Password</span>
                      <button
                        type="button"
                        onClick={() => setPassword(selectedRole === 'trainee' ? 'Trainee#2026' : selectedRole === 'trainer' ? 'Trainer#2026' : 'AdminSec#2026')}
                        className="text-[10px] text-rose-600 dark:text-rose-400 font-mono hover:underline"
                      >
                        Auto-fill Demo
                      </button>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#94a3b8] dark:text-slate-500" />
                      <input
                        id="login-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-[#cbd5e1] dark:border-slate-700 text-[#1e293b] dark:text-white text-sm focus:border-rose-500 outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      After submitting credentials, a <strong>6-digit OTP code</strong> will be sent to your SMS/Email, followed by mandatory <strong>{selectedRole === 'admin' ? 'Gov IR / Fingerprint Scan' : 'Device Camera Face Recognition'}</strong>.
                    </span>
                  </div>

                  {/* Submit Step 1 Button */}
                  <button
                    id="login-credentials-submit-btn"
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-sm shadow-[0_10px_20px_-5px_rgba(244,63,94,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] mt-2"
                  >
                    <span>Proceed to Step 2: SMS/Email 2FA</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}

            {/* TAB 2: REGISTER / NEW ACCOUNT FLOW (WITH GOOGLE, APPLE, MICROSOFT SSO) */}
            {activeTab === 'register' && (
              <div className="space-y-4">
                <div className="text-center pb-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Create MoES Capacity Account
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Register with institutional identity or single-sign-on
                  </p>
                </div>

                {/* SSO Social Sign-In Buttons */}
                <div className="space-y-2">
                  {/* Google SSO */}
                  <button
                    id="sso-google-btn"
                    type="button"
                    onClick={() => handleSSOSignIn('Google')}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-3 cursor-pointer shadow-xs active:scale-98"
                  >
                    <svg className="w-4 h-4" viewBox="0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Sign in with Google</span>
                  </button>

                  {/* Apple SSO */}
                  <button
                    id="sso-apple-btn"
                    type="button"
                    onClick={() => handleSSOSignIn('Apple')}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-3 cursor-pointer shadow-xs active:scale-98"
                  >
                    <svg className="w-4 h-4 fill-current text-slate-900 dark:text-white" viewBox="0 0 170 170">
                      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.92-12.04-14.54-6.85-10.4-12.16-21.95-15.93-34.66-3.77-12.71-5.66-24.81-5.66-36.31 0-15.09 3.8-27.81 11.39-38.16 7.59-10.35 17.1-15.65 28.53-15.9 4.8 0 10.15 1.25 16.06 3.75 5.91 2.5 9.77 3.82 11.59 3.96 1.45-.14 5.48-1.5 12.09-4.08 6.61-2.58 12.04-3.73 16.3-3.46 12.61.64 22.75 5.38 30.42 14.22-11.05 6.72-16.48 15.82-16.3 27.32.18 9.07 3.71 16.92 10.59 23.55 6.89 6.62 15.08 10.41 24.58 11.37-2.09 6.26-4.63 12.55-7.62 18.87zM119.22 33.05c0-7.39 2.66-14.47 7.98-21.23 5.32-6.76 11.89-11.17 19.72-13.22.82 6.94-.8 13.9-4.86 20.89-4.06 6.99-9.97 11.59-17.72 13.8-.73-.08-2.06-.17-3.99-.24h-1.13z"/>
                    </svg>
                    <span>Sign in with Apple</span>
                  </button>

                  {/* Microsoft SSO */}
                  <button
                    id="sso-microsoft-btn"
                    type="button"
                    onClick={() => handleSSOSignIn('Microsoft')}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-3 cursor-pointer shadow-xs active:scale-98"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 21 21">
                      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                      <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                      <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                    </svg>
                    <span>Sign in with Microsoft Account</span>
                  </button>
                </div>

                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
                  <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute">
                    Or Government Registration
                  </span>
                </div>

                {/* Account Registration Form */}
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Full Name & Academic Title
                    </label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh K. Varma"
                      className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-[#cbd5e1] dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Official Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. rajesh.varma@imd.gov.in"
                      className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-[#cbd5e1] dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        System Role
                      </label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as UserRole)}
                        className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                      >
                        <option value="trainee">Trainee Learner</option>
                        <option value="trainer">Faculty Trainer</option>
                        <option value="admin">National Admin</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-[#cbd5e1] dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Institute / Research Center
                    </label>
                    <select
                      value={regInstitute}
                      onChange={(e) => setRegInstitute(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                    >
                      <option value="India Meteorological Department (IMD HQ)">IMD HQ New Delhi</option>
                      <option value="National Centre for Medium Range Weather Forecasting (NCMRWF)">NCMRWF Noida</option>
                      <option value="Indian Institute of Tropical Meteorology (IITM Pune)">IITM Pune</option>
                      <option value="Indian National Centre for Ocean Information Services (INCOIS)">INCOIS Hyderabad</option>
                      <option value="National Institute of Ocean Technology (NIOT Chennai)">NIOT Chennai</option>
                    </select>
                  </div>

                  <button
                    id="register-submit-btn"
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-md shadow-rose-900/30 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>Create Account & Start Three-Step Security</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

          </div>
        </section>

        {/* Right Column: Announcements & Matrix */}
        <aside className={`${mobileActiveSection === 'announcements' ? 'flex' : 'hidden'} lg:flex flex-col gap-5 h-full justify-center`}>
          <div className="immersive-side-card p-5">
            <h3 className="text-xs text-rose-600 dark:text-rose-400 font-bold mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" /> Latest Announcements
            </h3>
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-slate-200/60 dark:border-slate-800">
                <p className="text-[11px] font-bold text-[#1e293b] dark:text-white mb-0.5">
                  Three-Step Security Mandatory
                </p>
                <p className="text-[10px] text-[#64748b] dark:text-slate-400">
                  Password + SMS/Email OTP + Device Camera Face / IR Biometric
                </p>
              </div>

              <div className="pb-2 border-b border-slate-200/60 dark:border-slate-800">
                <p className="text-[11px] font-bold text-[#1e293b] dark:text-white mb-0.5">
                  Seismology Data Workshop
                </p>
                <p className="text-[10px] text-[#64748b] dark:text-slate-400">Registration opens Oct 24 • IMD HQ</p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-[#1e293b] dark:text-white mb-0.5">
                  Doppler Radar Calibration
                </p>
                <p className="text-[10px] text-[#64748b] dark:text-slate-400">Annual cycle certification scheduled</p>
              </div>
            </div>
          </div>

          <div className="immersive-side-card p-5">
            <h3 className="text-xs text-[#ef4444] font-bold mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Subject Matrix
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div 
                onClick={() => sound.playClick()}
                className="bg-white dark:bg-slate-800 p-2.5 rounded-xl text-center border border-slate-100 dark:border-slate-700/80 shadow-xs cursor-pointer hover:border-rose-400 transition hover:scale-105"
              >
                <div className="text-lg mb-1">🛰️</div>
                <div className="text-[10px] font-bold text-[#1e293b] dark:text-white">Radar Met</div>
              </div>

              <div 
                onClick={() => sound.playClick()}
                className="bg-white dark:bg-slate-800 p-2.5 rounded-xl text-center border border-slate-100 dark:border-slate-700/80 shadow-xs cursor-pointer hover:border-rose-400 transition hover:scale-105"
              >
                <div className="text-lg mb-1">🌡️</div>
                <div className="text-[10px] font-bold text-[#1e293b] dark:text-white">NWP Models</div>
              </div>

              <div 
                onClick={() => sound.playClick()}
                className="bg-white dark:bg-slate-800 p-2.5 rounded-xl text-center border border-slate-100 dark:border-slate-700/80 shadow-xs cursor-pointer hover:border-rose-400 transition hover:scale-105"
              >
                <div className="text-lg mb-1">🌊</div>
                <div className="text-[10px] font-bold text-[#1e293b] dark:text-white">Oceanography</div>
              </div>

              <div 
                onClick={() => sound.playClick()}
                className="bg-white dark:bg-slate-800 p-2.5 rounded-xl text-center border border-slate-100 dark:border-slate-700/80 shadow-xs cursor-pointer hover:border-rose-400 transition hover:scale-105"
              >
                <div className="text-lg mb-1">⛈️</div>
                <div className="text-[10px] font-bold text-[#1e293b] dark:text-white">Cyclone Track</div>
              </div>
            </div>
          </div>
        </aside>

      </main>

      {/* STEP 2 MODAL: TWO-FACTOR AUTHENTICATION MODAL (Triggered after Credentials Submitted) */}
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

            {/* Modal Step 2 Header */}
            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                <span>Step 2 of 3: Two-Factor Identity Verification</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Enter 6-Digit Verification Code
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                A one-time verification code has been dispatched to authenticate <strong className="text-rose-700 dark:text-rose-400">{activeUser.fullName}</strong>.
              </p>
            </div>

            {/* Verification Channel Switcher (SMS vs Gmail) */}
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
                <span>SMS ({activeUser.phone.slice(-4)})</span>
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
                <span>Gmail / Official Mail</span>
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
                    className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-mono"
                  >
                    Auto-fill Demo (982401)
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
                  className="w-full py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-center font-mono tracking-widest text-xl text-slate-900 dark:text-white font-bold outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-800 transition"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
                <span>Code valid for 10 minutes</span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setOtpCode('982401');
                  }}
                  className="text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Resend Code
                </button>
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

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">
                Next: {selectedRole === 'admin' ? 'Step 3: Gov Certified IR / Fingerprint' : 'Step 3: Device Camera Face Recognition'}
              </span>
            </div>

          </div>
        </div>
      )}

      {/* STEP 3 MODAL: MANDATORY FACE RECOGNITION (TRAINEE/TRAINER) OR BIOMETRIC IR (ADMIN) */}
      {isStep3ModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Trainee & Trainer: Mandatory Device Camera Face Recognition */}
            {selectedRole !== 'admin' ? (
              <CameraFaceScanner
                userName={activeUser.fullName}
                userRole={selectedRole}
                userAvatar={activeUser.avatar}
                onVerified={handleStep3VerificationSuccess}
                onCancel={() => {
                  sound.playClick();
                  setIsStep3ModalOpen(false);
                  setCurrentSecurityStep(1);
                }}
              />
            ) : (
              /* Admin: Mandatory Gov-Certified IR Camera or Fingerprint Scanner */
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
                        Mandatory for National Administrator Session Clearance
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
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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

      {/* Immersive Bottom Footer */}
      <footer className="h-[50px] px-6 sm:px-10 flex items-center justify-between text-[11px] text-[#94a3b8] dark:text-slate-500 border-t border-[#e2e8f0] dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 z-20 relative transition-colors duration-200">
        <div>© 2026 Ministry of Earth Sciences | IMD - Three-Step Security Gateway</div>
        <div className="flex gap-4 sm:gap-6 text-[10px] text-[#64748b] dark:text-slate-400">
          <span className="cursor-pointer hover:text-slate-900 dark:hover:text-white">Security Policy</span>
          <span>•</span>
          <span className="cursor-pointer hover:text-slate-900 dark:hover:text-white">FIPS-201 / ISO-19794-5</span>
          <span>•</span>
          <span className="font-mono text-rose-700 dark:text-rose-400">Helpdesk: 1800-MOES-CONNECT</span>
        </div>
      </footer>

    </div>
  );
};
