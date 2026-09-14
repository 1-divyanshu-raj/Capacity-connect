import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, UserPlus, Eye, EyeOff, Sun, Moon, AlertCircle, CheckCircle2, Zap, User, Building2, GraduationCap, Briefcase, Fingerprint } from 'lucide-react';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { supabase, UserProfile } from '../../lib/supabase';
import { PasswordlessFastLoginModal } from './PasswordlessFastLoginModal';

interface LoginPageProps { theme?: 'light' | 'dark'; onToggleTheme?: () => void; }
const roles: { value: UserRole; label: string }[] = [
  { value: 'trainee', label: 'Trainee' }, { value: 'trainer', label: 'Trainer' }, { value: 'admin', label: 'Administrator' }
];

export const LoginPage: React.FC<LoginPageProps> = ({ theme = 'light', onToggleTheme }) => {
  const { signIn, signUp, authError, setAuthError, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('trainee');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState(''); const [phone, setPhone] = useState(''); const [institute, setInstitute] = useState('');
  const [designation, setDesignation] = useState(''); const [qualifications, setQualifications] = useState(''); const [workExperience, setWorkExperience] = useState('');
  const [specialization, setSpecialization] = useState(''); const [yearsOfExperience, setYearsOfExperience] = useState(''); const [interests, setInterests] = useState('');
  const [skills, setSkills] = useState(''); const [bio, setBio] = useState('');
  const [showPassword, setShowPassword] = useState(false); const [message, setMessage] = useState(''); const [demoLoading, setDemoLoading] = useState<UserRole | null>(null); const [showBiometric, setShowBiometric] = useState(false);

  const input = 'mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 outline-none focus:ring-2 focus:ring-rose-500';
  const label = 'text-xs font-semibold text-slate-600 dark:text-slate-300';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthError(null); setMessage('');
    if (!email.trim() || !password) return setMessage('Email and password are required.');
    if (mode === 'register') {
      if (!fullName.trim()) return setMessage('Full name is required.');
      if (!institute.trim()) return setMessage('Institute / organization is required.');
      if (password.length < 8) return setMessage('Password must be at least 8 characters.');
      if (password !== confirmPassword) return setMessage('Passwords do not match.');
      if (role === 'trainer' && (!specialization.trim() || !yearsOfExperience)) return setMessage('Trainer specialization and years of experience are required.');
      if (role === 'admin' && (!designation.trim() || !qualifications.trim())) return setMessage('Admin designation and highest qualification are required.');
      const result = await signUp(email, password, {
        fullName, role, phone, institute, designation, qualifications, workExperience, specialization,
        yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined, bio,
        interests: interests.split(',').map(v => v.trim()).filter(Boolean),
        skills: skills.split(',').map(name => ({ name: name.trim(), level: 3, category: 'General' })).filter(v => v.name)
      });
      if (result.success) { setMessage(result.error || 'Account created successfully.'); if (role !== 'admin' && result.user) setMode('login'); }
      return;
    }
    await signIn(email, password);
  };

  const fastLogin = async (demoRole: UserRole) => {
    setDemoLoading(demoRole); setAuthError(null); setMessage('');
    try {
      const { data, error } = await supabase.from('demo_accounts').select('demo_email, demo_password, role_name').eq('role_name', demoRole).maybeSingle();
      if (error) throw error;
      if (!data?.demo_email || !data.demo_password) throw new Error('This evaluation demo account is not configured yet.');
      await signIn(data.demo_email, data.demo_password);
    } catch (error: any) { setAuthError(error?.message || 'Fast Login failed.'); }
    finally { setDemoLoading(null); }
  };

  const selectMode = (next: 'login' | 'register') => { setMode(next); setMessage(''); setAuthError(null); };
  const resetRoleFields = (next: UserRole) => { setRole(next); setMessage(''); };

  const biometricSuccess = (_user: UserProfile) => {
    // Secure biometric flow normally redirects through a one-time Supabase Auth magic link.
    setShowBiometric(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090e17] flex items-center justify-center px-4 py-8 text-slate-900 dark:text-white">
      <div className="w-full max-w-2xl">
        <div className="flex justify-end mb-4">{onToggleTheme && <button onClick={onToggleTheme} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" aria-label="Toggle theme">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>}</div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-7 pb-5 text-center"><div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-rose-600 text-white grid place-items-center shadow-lg"><ShieldCheck size={30} /></div><h1 className="text-2xl font-bold">CAPACITY CONNECT</h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">MoES / IMD Training & Capacity Platform</p></div>
          <div className="grid grid-cols-2 mx-6 border-b border-slate-200 dark:border-slate-700"><button onClick={() => selectMode('login')} className={`py-3 text-sm font-semibold ${mode === 'login' ? 'text-rose-600 border-b-2 border-rose-600' : 'text-slate-500'}`}>Sign in</button><button onClick={() => selectMode('register')} className={`py-3 text-sm font-semibold ${mode === 'register' ? 'text-rose-600 border-b-2 border-rose-600' : 'text-slate-500'}`}>Create account</button></div>
          <form onSubmit={submit} className="p-6 space-y-4">
            {mode === 'register' && <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {roles.map(item => <button type="button" key={item.value} onClick={() => resetRoleFields(item.value)} className={`rounded-xl border p-3 text-left ${role === item.value ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700'}`}><div className="flex items-center gap-2">{item.value === 'trainee' ? <GraduationCap size={18} /> : item.value === 'trainer' ? <Briefcase size={18} /> : <ShieldCheck size={18} />}<span className="text-sm font-bold">{item.label}</span></div><p className="text-[11px] text-slate-500 mt-1">{item.value === 'trainee' ? 'Learning & competency development' : item.value === 'trainer' ? 'Teach, mentor & publish training' : 'Platform governance & administration'}</p></button>)}
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 p-3 text-xs text-slate-500 dark:text-slate-400">{role === 'admin' ? 'Admin accounts are created as Pending and require approval by an existing administrator.' : role === 'trainer' ? 'Trainer profiles collect professional expertise so the platform can match trainers to capacity-building needs.' : 'Trainee profiles collect learning context so courses and competency pathways can be personalized.'}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label><span className={label}>Full name *</span><div className="relative"><User size={16} className="absolute left-3 top-3 text-slate-400"/><input value={fullName} onChange={e => setFullName(e.target.value)} className={`${input} pl-9`} placeholder="Your full name"/></div></label>
                <label><span className={label}>Phone</span><input value={phone} onChange={e => setPhone(e.target.value)} className={input} placeholder="+91 XXXXX XXXXX"/></label>
                <label><span className={label}>Institute / organization *</span><div className="relative"><Building2 size={16} className="absolute left-3 top-3 text-slate-400"/><input value={institute} onChange={e => setInstitute(e.target.value)} className={`${input} pl-9`} placeholder="IMD / IIT / University / Organization"/></div></label>
                <label><span className={label}>Designation {role === 'admin' ? '*' : ''}</span><input value={designation} onChange={e => setDesignation(e.target.value)} className={input} placeholder={role === 'trainee' ? 'Student / Research Scholar' : 'Scientist / Faculty / Officer'}/></label>
                <label><span className={label}>Highest qualification {role === 'admin' ? '*' : ''}</span><input value={qualifications} onChange={e => setQualifications(e.target.value)} className={input} placeholder="B.Tech / M.Sc / Ph.D / MBA..."/></label>
                {role !== 'trainee' && <label><span className={label}>Work experience</span><input value={workExperience} onChange={e => setWorkExperience(e.target.value)} className={input} placeholder="e.g. 8 years in meteorology"/></label>}
                {role === 'trainer' && <><label><span className={label}>Specialization *</span><input value={specialization} onChange={e => setSpecialization(e.target.value)} className={input} placeholder="NWP, Radar, Seismology..."/></label><label><span className={label}>Years of experience *</span><input type="number" min="0" max="60" value={yearsOfExperience} onChange={e => setYearsOfExperience(e.target.value)} className={input} placeholder="10"/></label></>}
                {role === 'trainee' && <label><span className={label}>Learning interests</span><input value={interests} onChange={e => setInterests(e.target.value)} className={input} placeholder="NWP, climate science, GIS..."/></label>}
                <label className="md:col-span-2"><span className={label}>{role === 'trainer' ? 'Expertise / skills' : 'Skills'}</span><input value={skills} onChange={e => setSkills(e.target.value)} className={input} placeholder="Comma-separated skills"/></label>
                <label className="md:col-span-2"><span className={label}>Short bio</span><textarea value={bio} onChange={e => setBio(e.target.value)} className={`${input} min-h-20`} placeholder="Tell us briefly about your role or learning goals"/></label>
              </div>
            </>}

            <label className="block"><span className={label}>Email *</span><div className="relative mt-1"><Mail size={17} className="absolute left-3 top-3 text-slate-400"/><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-10 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-rose-500" placeholder="name@example.com"/></div></label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block"><span className={label}>Password *</span><div className="relative mt-1"><Lock size={17} className="absolute left-3 top-3 text-slate-400"/><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-10 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-rose-500" placeholder="••••••••"/><button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-2.5 text-slate-400">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
              {mode === 'register' && <label className="block"><span className={label}>Confirm password *</span><input type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={input} placeholder="••••••••"/></label>}
            </div>
            {(message || authError) && <div className={`rounded-lg p-3 text-sm flex gap-2 ${message && !authError ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'}`}>{message && !authError ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}<span>{message || authError}</span></div>}
            <button disabled={isLoading} className="w-full rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white py-3 font-semibold flex items-center justify-center gap-2 transition">{mode === 'login' ? <><ArrowRight size={18}/> Sign in securely</> : <><UserPlus size={18}/> Create {role} account</>}</button>
            {mode === 'login' && <button type="button" onClick={() => setShowBiometric(true)} className="w-full rounded-lg border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-800 dark:text-cyan-200 py-3 font-semibold flex items-center justify-center gap-2 hover:bg-cyan-100 dark:hover:bg-cyan-950/40 transition"><Fingerprint size={18}/> Fast Login with Face Recognition</button>}
          </form>

          <div className="mx-6 mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-200"><Zap size={17}/> SIH Evaluation Demo Login</div>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 mb-3">Use these labelled demo accounts for evaluation. They are separate from normal registration and are not an authentication bypass.</p>
            <div className="grid grid-cols-3 gap-2">
              {roles.map(item => <button key={item.value} type="button" disabled={!!demoLoading} onClick={() => fastLogin(item.value)} className="rounded-lg border border-amber-300 dark:border-amber-800 bg-white/70 dark:bg-slate-900/60 px-2 py-2 text-xs font-bold text-amber-900 dark:text-amber-200 disabled:opacity-50">{demoLoading === item.value ? 'Signing in…' : item.label}</button>)}
            </div>
          </div>
        </div>
      </div>
      <PasswordlessFastLoginModal isOpen={showBiometric} onClose={() => setShowBiometric(false)} onLoginSuccess={biometricSuccess} onSwitchToRegister={() => { setShowBiometric(false); setMode('register'); }} />
    </div>
  );
};
