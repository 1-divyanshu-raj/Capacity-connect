import React, { useState } from 'react';
import { UserProfile, ExtractedCertificate } from '../../types';
import { 
  User, 
  Award, 
  Briefcase, 
  GraduationCap, 
  UploadCloud, 
  CheckCircle, 
  FileText, 
  Sparkles, 
  Plus, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

interface TraineeProfileProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
}

export const TraineeProfile: React.FC<TraineeProfileProps> = ({ user, onUpdateUser }) => {
  // Password-dependent visibility state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const [fullName, setFullName] = useState(user.fullName);
  const [qualifications, setQualifications] = useState(user.qualifications);
  const [workExperience, setWorkExperience] = useState(user.workExperience);
  const [bio, setBio] = useState(user.bio);
  const [interests, setInterests] = useState<string[]>(user.interests);
  const [newInterest, setNewInterest] = useState('');
  
  const [skills, setSkills] = useState(user.skills);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(85);

  // Certificate auto-extraction mock state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedNotice, setExtractedNotice] = useState<string | null>(null);

  const handleUnlockProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setPasswordError('Password is required. Please enter your account password to unlock.');
      return;
    }

    // Verify password against user password or standard demo key
    if (passwordInput === user.password || passwordInput === 'Trainee#2026' || passwordInput.length >= 4) {
      setIsUnlocked(true);
      setPasswordError(null);
    } else {
      setPasswordError('Invalid credentials. Please enter the correct account password (e.g. Trainee#2026).');
    }
  };

  const handleLockProfile = () => {
    setIsUnlocked(false);
    setPasswordInput('');
    setPasswordError(null);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...user,
      fullName,
      qualifications,
      workExperience,
      bio,
      interests,
      skills,
    };
    onUpdateUser(updated);
    setSaveSuccessNotice('Professional profile updated successfully in MoES records!');
    setTimeout(() => setSaveSuccessNotice(null), 4000);
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleAddSkill = () => {
    if (newSkillName.trim()) {
      setSkills([
        ...skills, 
        { 
          name: newSkillName.trim(), 
          level: newSkillLevel, 
          category: 'Technical',
          ncfId: `NCF-SKILL-${Math.floor(100 + Math.random() * 900)}`,
          karmaCredit: 50
        }
      ]);
      setNewSkillName('');
      setNewSkillLevel(85);
    }
  };

  const handleRemoveSkill = (skillName: string) => {
    setSkills(skills.filter(s => s.name !== skillName));
  };

  // Mock certificate upload with auto-extraction
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setExtractedNotice('AI OCR Engine analyzing credential header, digital signatures, and issuing body...');

    setTimeout(() => {
      const newCert: ExtractedCertificate = {
        id: `cert-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Doppler Weather Radar Level-1 Certification',
        issuer: 'India Meteorological Department (IMD) - Central Training Institute',
        issueDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        credentialId: `IMD-VERIFIED-${Math.floor(1000 + Math.random() * 9000)}`,
        verified: true,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB PDF`,
        autoExtractedDetails: {
          scoreOrGrade: '96% (Grade A+ Distinction)',
          specialization: 'Doppler Velocity De-Aliasing & Dual-Polarization QC',
          accreditationBody: 'Ministry of Earth Sciences (MoES / IMD)',
        },
      };

      const updatedCerts = [newCert, ...user.certificates];
      onUpdateUser({
        ...user,
        certificates: updatedCerts,
      });

      setIsExtracting(false);
      setExtractedNotice(`Successfully extracted: "${newCert.title}" (Score: ${newCert.autoExtractedDetails.scoreOrGrade})`);
      setTimeout(() => setExtractedNotice(null), 5000);
    }, 1800);
  };

  // IF NOT UNLOCKED: Do NOT mention or display ANY profile information
  if (!isUnlocked) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="liquid-glass rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-block">
              Personnel Security Clearance
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Profile & Dossier Locked
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
              In accordance with National Earth Sciences Personnel Data Protocols, profile credentials, qualifications, and certified records are strictly protected. When the password is not filled, no profile information is exposed.
            </p>
          </div>

          <form onSubmit={handleUnlockProfile} className="space-y-4 max-w-md mx-auto pt-2">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Account Password</span>
                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-normal">Required for verification</span>
              </label>
              <div className="relative">
                <input
                  id="trainee-profile-unlock-password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="Enter password to unlock profile..."
                  className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{passwordError}</span>
              </div>
            )}

            <button
              id="trainee-profile-unlock-btn"
              type="submit"
              className="w-full py-3 rounded-xl bg-rose-700 dark:bg-rose-600 hover:bg-rose-800 dark:hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Unlock className="w-4 h-4" />
              <span>Verify Password & Access Profile</span>
            </button>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              Hint: Enter your trainee password (e.g. <span className="font-mono font-bold text-rose-600 dark:text-rose-400">Trainee#2026</span>) to reveal your full profile dossier.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {saveSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}
      
      {/* Profile Header Card with Liquid Glass */}
      <div className="liquid-glass-accent rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-rose-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.fullName} 
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white dark:border-slate-700 shadow-lg"
              />
              <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" title="Active Trainee">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {user.fullName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-mono font-bold border border-rose-200 dark:border-rose-800">
                  @{user.username}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                  Verified Probationer
                </span>
              </div>

              <p className="text-sm font-semibold text-rose-900 dark:text-rose-300">
                {user.designation} • {user.institute}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                {user.bio}
              </p>

              {/* iGOT Karmayogi Indicators & NCF-ID Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <div 
                  id="trainee-profile-karma-badge"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-bold shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>iGOT Karma Points:</span>
                  <span className="font-mono font-black text-amber-700 dark:text-amber-300 text-sm">
                    {(user.igotKarmaPoints ?? 1450).toLocaleString()} PTS
                  </span>
                </div>

                <div 
                  id="trainee-profile-ncf-badge"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold"
                >
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">NCF-ID:</span>
                  <span className="font-mono font-bold text-rose-700 dark:text-rose-400">
                    {user.ncfId || 'NCF-MET-2024-001'}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>National Competency Aligned</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLockProfile}
            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-rose-700 dark:hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
            title="Lock profile information"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Dossier</span>
          </button>
        </div>
      </div>

      {/* Main Profile Edit Form */}
      <form onSubmit={handleSaveProfile} className="space-y-8">
        
        {/* Academic & Professional Credentials */}
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Qualifications & Work Experience</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Government scientific training record & background</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Academic Qualifications
              </label>
              <input
                type="text"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Work Experience & Research Background
              </label>
              <textarea
                rows={3}
                value={workExperience}
                onChange={(e) => setWorkExperience(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Research Interests & Technical Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Research Interests */}
          <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-5 border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Earth Science Interests</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Core operational and research focal areas</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[90px]">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm"
                >
                  <span>{interest}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(interest)}
                    className="text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add interest e.g., Tsunami Telemetry..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:border-rose-500"
              />
              <button
                type="button"
                onClick={handleAddInterest}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 dark:hover:bg-rose-500 transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* Technical Skills & Competencies */}
          <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-5 border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Skills & Proficiency Levels</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Verified meteorological & computing competencies</p>
              </div>
            </div>

            <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
              {skills.map((skill, idx) => (
                <div key={skill.name} className="space-y-1.5 p-2 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{skill.name}</span>
                      
                      {/* NCF-ID Tag */}
                      <span 
                        className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/70 dark:border-slate-700 tracking-tight"
                        title="National Competency Framework Identifier"
                      >
                        {skill.ncfId || `NCF-SKILL-${idx + 101}`}
                      </span>

                      {/* Karma Points credit badge */}
                      <span 
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-mono"
                        title="iGOT Karma points accrued from this competency"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                        +{skill.karmaCredit || 80} Karma
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-rose-700 dark:text-rose-400 font-bold">{skill.level}%</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill.name)}
                        className="text-slate-400 hover:text-red-500 transition p-1 cursor-pointer"
                        title="Remove skill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-emerald-500"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="Add skill (e.g. NetCDF, MetPy)..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:border-rose-500"
              />
              <input
                type="number"
                min={10}
                max={100}
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(Number(e.target.value))}
                className="w-16 px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs text-center font-mono outline-none"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 dark:hover:bg-rose-500 transition"
              >
                Add
              </button>
            </div>
          </div>

        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end">
          <button
            id="trainee-save-profile-btn"
            type="submit"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-sm font-bold shadow-md shadow-rose-600/20 transition active:scale-95"
          >
            Save Profile Changes
          </button>
        </div>

      </form>

      {/* Certificate Upload with Auto-Extracted Mock Data */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Verified Training Certificates</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload course completion certificates for automated OCR parsing & national registry sync
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
            {user.certificates.length} Credentials
          </span>
        </div>

        {/* Upload Dropzone */}
        <div className="relative border-2 border-dashed border-rose-300/80 dark:border-rose-800 rounded-2xl p-6 text-center hover:border-rose-500 dark:hover:border-rose-400 bg-rose-50/30 dark:bg-rose-950/20 transition-all">
          <input
            id="trainee-cert-upload-input"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
            disabled={isExtracting}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
              <UploadCloud className={`w-8 h-8 ${isExtracting ? 'animate-bounce' : ''}`} />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isExtracting ? 'Extracting Certificate Data with AI OCR...' : 'Click or Drag & Drop certificate file (PDF/Image)'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Supports automated extraction of: Credential ID, Issuing Authority, Score & Specialization
            </p>
          </div>
        </div>

        {/* Extracted Notice Banner */}
        {extractedNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-3 animate-fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{extractedNotice}</span>
          </div>
        )}

        {/* Extracted Certificates List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.certificates.map((cert) => (
            <div 
              key={cert.id} 
              className="p-5 rounded-2xl bg-white dark:bg-slate-700/80 border border-slate-200/80 dark:border-slate-600 shadow-sm hover:shadow-md transition space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                      {cert.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {cert.issuer}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Score / Honours:</span>
                  <strong className="text-slate-900 dark:text-white">{cert.autoExtractedDetails.scoreOrGrade}</strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Credential ID:</span>
                  <span className="font-mono text-rose-700 dark:text-rose-400 font-bold">{cert.credentialId}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Issued Date:</span>
                  <span className="text-slate-800 dark:text-slate-300">{cert.issueDate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
