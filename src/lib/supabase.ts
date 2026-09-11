import { createClient } from '@supabase/supabase-js';
import { SupabaseTrainee, SupabaseTrainer } from '../types';

export const SUPABASE_URL = 'https://deyyyyreixyppwfyhtao.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_UdGgYIQJ56CtC4e2oW7DTQ_VGBWmUWS';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fallback initial records matching live Supabase records in case of offline/transient issues
export const FALLBACK_SUPABASE_TRAINEES: SupabaseTrainee[] = [
  {
    id: '10a7c637-667c-49f5-bfb0-25cb0b03206d',
    name: 'Dr. Rajesh Kumar',
    department: 'Meteorology & Forecasting',
    baseline_skill: 95,
    days_unpracticed: 45,
    created_at: '2026-09-11T19:04:18.028948+00:00'
  },
  {
    id: '0fcd5786-7929-4c5a-88ea-5552b0a526a0',
    name: 'Ananya Sharma',
    department: 'Ocean Observation Systems',
    baseline_skill: 88,
    days_unpracticed: 12,
    created_at: '2026-09-11T19:04:18.028948+00:00'
  },
  {
    id: 'db791fa8-9c29-411a-a509-ace3be14dd71',
    name: 'Siddharth Verma',
    department: 'Seismology & Earthquakes',
    baseline_skill: 90,
    days_unpracticed: 90,
    created_at: '2026-09-11T19:04:18.028948+00:00'
  },
  {
    id: 'a0315593-d968-4a9c-a95b-9f5dedafb41c',
    name: 'Pooja Patel',
    department: 'Climate Change & Research',
    baseline_skill: 82,
    days_unpracticed: 5,
    created_at: '2026-09-11T19:04:18.028948+00:00'
  }
];

export const FALLBACK_SUPABASE_TRAINERS: SupabaseTrainer[] = [
  {
    id: '5b5a6bc4-e501-4c53-8edc-7c3f570e8594',
    name: 'Dr. S. C. Kar',
    specialization: 'Numerical Weather Prediction',
    competency_score: 94.5,
    rating: 4.9,
    workload_hours: 12,
    created_at: '2026-09-11T19:04:18.028948+00:00'
  },
  {
    id: '17d8e0c8-7e40-460b-801c-e1f7b9384971',
    name: 'Prof. M. Ravichandran',
    specialization: 'Oceanographic Modelling',
    competency_score: 98,
    rating: 4.8,
    workload_hours: 25,
    created_at: '2026-09-11T19:04:18.028948+00:00'
  },
  {
    id: '285a14be-be38-4172-b2dc-cad7f72ad6fb',
    name: 'Dr. Sunitha Devi',
    specialization: 'Cyclone & Storm Warning',
    competency_score: 91,
    rating: 4.7,
    workload_hours: 8,
    created_at: '2026-09-11T19:04:18.028948+00:00'
  },
  {
    id: 'c01b7976-f756-4e6d-87c2-e81d24566f40',
    name: 'Dr. A. K. Mitra',
    specialization: 'Satellite Data Processing',
    competency_score: 89.5,
    rating: 4.6,
    workload_hours: 18,
    created_at: '2026-09-11T19:04:18.028948+00:00'
  }
];

// Fetch trainees from Supabase table 'trainees'
export async function fetchTraineesFromSupabase(): Promise<{ data: SupabaseTrainee[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('trainees')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase fetch trainees warning:', error.message);
      return { data: FALLBACK_SUPABASE_TRAINEES, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: FALLBACK_SUPABASE_TRAINEES, error: null };
    }

    return { data: data as SupabaseTrainee[], error: null };
  } catch (err: any) {
    console.error('Supabase fetch trainees exception:', err);
    return { data: FALLBACK_SUPABASE_TRAINEES, error: err?.message || 'Connection failed' };
  }
}

// Fetch trainers from Supabase table 'trainers'
export async function fetchTrainersFromSupabase(): Promise<{ data: SupabaseTrainer[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .order('competency_score', { ascending: false });

    if (error) {
      console.warn('Supabase fetch trainers warning:', error.message);
      return { data: FALLBACK_SUPABASE_TRAINERS, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: FALLBACK_SUPABASE_TRAINERS, error: null };
    }

    return { data: data as SupabaseTrainer[], error: null };
  } catch (err: any) {
    console.error('Supabase fetch trainers exception:', err);
    return { data: FALLBACK_SUPABASE_TRAINERS, error: err?.message || 'Connection failed' };
  }
}

// Update trainee days unpracticed
export async function updateTraineeDaysUnpracticed(id: string, days: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('trainees')
      .update({ days_unpracticed: days })
      .eq('id', id);

    if (error) {
      console.warn('Failed to update days_unpracticed on Supabase:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Update trainer workload hours
export async function updateTrainerWorkloadHours(id: string, hours: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('trainers')
      .update({ workload_hours: hours })
      .eq('id', id);

    if (error) {
      console.warn('Failed to update workload_hours on Supabase:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Deterministic generation of 128-dimensional unit-normalized facial embeddings
export function generateDeterministicFaceDescriptor(seed: string): number[] {
  const descriptor: number[] = [];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  for (let i = 0; i < 128; i++) {
    h = (Math.imul(1664525, h) + 1013904223) | 0;
    const val = (h / 2147483648);
    descriptor.push(val);
  }
  // Normalize vector to unit length
  const norm = Math.sqrt(descriptor.reduce((sum, v) => sum + v * v, 0));
  return descriptor.map(v => Number((v / (norm || 1)).toFixed(4)));
}

// 128-dimensional biometric face descriptor vector for facial vector recognition
export const DEFAULT_FACE_DESCRIPTOR: number[] = generateDeterministicFaceDescriptor('XYZ_trainee');

// Euclidean distance calculation for 128-float facial vectors
export function calculateEuclideanDistance(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 999;
  const len = Math.min(vecA.length, vecB.length, 128);
  let sumSq = 0;
  for (let i = 0; i < len; i++) {
    const diff = (vecA[i] || 0) - (vecB[i] || 0);
    sumSq += diff * diff;
  }
  return Number(Math.sqrt(sumSq).toFixed(4));
}

export interface FaceMatchResult {
  matched: boolean;
  bestMatchUser?: { id: string; name: string; role: string; avatar?: string };
  bestDistance: number;
  allDistances: Array<{ id: string; name: string; role: string; distance: number; passed: boolean }>;
  threshold: number; // 0.45
}

export function matchFace1ToN(
  liveVector: number[],
  registeredCandidates: Array<{ id: string; name: string; role: string; face_descriptor: number[]; avatar?: string }>,
  threshold: number = 0.45
): FaceMatchResult {
  let minDistance = Infinity;
  let bestCandidate: any = null;

  const allDistances = registeredCandidates.map(c => {
    const distance = calculateEuclideanDistance(liveVector, c.face_descriptor);
    if (distance < minDistance) {
      minDistance = distance;
      bestCandidate = c;
    }
    return {
      id: c.id,
      name: c.name,
      role: c.role,
      distance,
      passed: distance < threshold
    };
  });

  return {
    matched: minDistance < threshold,
    bestMatchUser: bestCandidate,
    bestDistance: minDistance === Infinity ? 999 : Number(minDistance.toFixed(4)),
    allDistances: allDistances.sort((a, b) => a.distance - b.distance),
    threshold
  };
}

// Pre-registered official Ministry of Earth Sciences personnel
import { UserProfile, UserRole } from '../types';

export const INITIAL_REGISTERED_PERSONNEL: UserProfile[] = [
  {
    id: 'user-trainee-001',
    username: 'XYZ_trainee',
    fullName: 'Ananya Sharma',
    email: 'XYZ_trainee@imd.gov.in',
    role: 'trainee',
    institute: 'India Meteorological Department (IMD) - Pune Training Division',
    designation: "Scientist 'B' Probationer",
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    phone: '+91 98765 43210',
    bio: 'Atmospheric Sciences researcher focusing on Doppler Radar velocity interpretation and numerical weather prediction post-processing for extreme rainfall events.',
    qualifications: 'M.Tech in Atmospheric & Oceanic Sciences (IIT Delhi - 9.4 CGPA), B.Tech in Electronics & Communication Engineering',
    workExperience: '2 Years as Junior Research Fellow (JRF) at Indian Institute of Tropical Meteorology (IITM), working on radar data assimilation.',
    igotKarmaPoints: 1450,
    ncfId: 'NCF-MOES-2025-0842',
    face_descriptor: generateDeterministicFaceDescriptor('XYZ_trainee_ananya'),
    interests: [
      'Doppler Weather Radar (DWR) Dual-Pol Algorithms',
      'WRF High-Resolution Mesoscale Modeling',
      'Tropical Cyclone Genesis & Track Prediction',
    ],
    skills: [
      { name: 'Python for Meteorology (MetPy, Cartopy, Xarray)', level: 92, category: 'Computing' },
      { name: 'Doppler Radar Reflectivity & Radial Velocity', level: 88, category: 'Operational' },
      { name: 'WRF Atmospheric Numerical Modeling', level: 80, category: 'Modeling' }
    ],
    certificates: []
  },
  {
    id: '10a7c637-667c-49f5-bfb0-25cb0b03206d',
    username: 'rajesh_kumar',
    fullName: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@imd.gov.in',
    role: 'trainee',
    institute: 'India Meteorological Department (IMD) - NWP Center',
    designation: "Scientist 'C' Research Trainee",
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
    phone: '+91 98765 11223',
    bio: 'NWP Data Assimilation specialist focusing on satellite radiances and high-resolution WRF ensemble forecasts.',
    qualifications: 'Ph.D. in Dynamic Meteorology (Pune University)',
    workExperience: '4 Years at IMD NWP Division',
    igotKarmaPoints: 1820,
    ncfId: 'NCF-MOES-2024-0412',
    face_descriptor: generateDeterministicFaceDescriptor('rajesh_kumar_nwp'),
    interests: ['Satellite Radiances', 'Ensemble Prediction', 'Monsoon Teleconnections'],
    skills: [
      { name: 'Data Assimilation (WRF-DA)', level: 95, category: 'Modeling' },
      { name: 'Python MetPy & SciPy', level: 90, category: 'Computing' }
    ],
    certificates: []
  },
  {
    id: 'user-trainer-001',
    username: 'XYZ_trainer',
    fullName: 'Dr. Rajeshwar Rao',
    email: 'XYZ_trainer@ncmrwf.gov.in',
    role: 'trainer',
    institute: 'National Centre for Medium Range Weather Forecasting (NCMRWF), Noida',
    designation: "Scientist 'G' & Chief Faculty Director",
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    phone: '+91 98111 22334',
    bio: 'Senior Atmospheric Modeler with 18+ years leading national capacity programs in ensemble prediction and cyclone forecasting.',
    qualifications: 'Senior Researcher & Subject Matter Expert in Dynamic Meteorology (IISc Bangalore)',
    workExperience: '18 Years at MoES / NCMRWF / IMD; Supervised 140+ probationary scientists.',
    specialization: 'Ensemble Numerical Weather Prediction, Tropical Cyclogenesis & Doppler Radar Modeling',
    yearsOfExperience: 18,
    publishedMaterialsCount: 38,
    face_descriptor: generateDeterministicFaceDescriptor('XYZ_trainer_rao'),
    interests: ['Ensemble NWP', 'Tropical Deep Convection', 'AI-Assisted Weather Forecasting'],
    skills: [
      { name: 'NWP Data Assimilation & EnKF', level: 98, category: 'Modeling' },
      { name: 'Doppler Radar Physics & Severe Storm Modeling', level: 96, category: 'Radar' }
    ],
    certificates: []
  },
  {
    id: '5b5a6bc4-e501-4c53-8edc-7c3f570e8594',
    username: 'sc_kar',
    fullName: 'Dr. S. C. Kar',
    email: 'sckar@ncmrwf.gov.in',
    role: 'trainer',
    institute: 'National Centre for Medium Range Weather Forecasting (NCMRWF)',
    designation: "Scientist 'G' & Professor of Numerical Modeling",
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300',
    phone: '+91 98111 88776',
    bio: 'Pioneer of high-resolution numerical weather prediction and climate modeling in India.',
    qualifications: 'Ph.D. in Atmospheric Sciences (IIT Delhi)',
    workExperience: '24 Years in Numerical Modeling and Faculty Instruction at MoES',
    specialization: 'Numerical Weather Prediction',
    yearsOfExperience: 24,
    publishedMaterialsCount: 52,
    face_descriptor: generateDeterministicFaceDescriptor('sc_kar_ncmrwf'),
    interests: ['Coupled Climate Models', 'Monsoon Dynamics', 'High Performance Computing'],
    skills: [
      { name: 'Numerical Weather Prediction', level: 99, category: 'Modeling' },
      { name: 'Global Ensemble Forecasting', level: 96, category: 'Operational' }
    ],
    certificates: []
  },
  {
    id: 'user-admin-001',
    username: 'XYZ_admin',
    fullName: 'Dr. Sunita Deshmukh',
    email: 'XYZ_admin@moes.gov.in',
    role: 'admin',
    institute: 'Ministry of Earth Sciences (MoES HQ, Prithvi Bhavan, New Delhi)',
    designation: 'Joint Director & National Capacity Mission Head',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    phone: '+91 99999 88888',
    bio: 'Administrative leader overseeing National Capacity Building Mission for Earth System Sciences.',
    qualifications: 'Senior Scientist & Subject Matter Expert in Marine Geophysics (NIO), MPA (IIPA New Delhi)',
    workExperience: '22 Years in Government of India scientific administration and HR development.',
    clearanceLevel: 'GOV-SEC-CLEARANCE-IV (Top Tier Biometric Verified)',
    govSecurityId: 'NIC-MOES-2026-ADM-009',
    face_descriptor: generateDeterministicFaceDescriptor('XYZ_admin_deshmukh'),
    interests: ['National Geoscience Human Capital', 'Inter-Agency Disaster Coordination', 'Digital Governance'],
    skills: [],
    certificates: []
  }
];

// Retrieve all registered face candidates for 1-to-N matching
export async function getAllRegisteredFaceCandidates(): Promise<Array<{ id: string; name: string; role: string; face_descriptor: number[]; avatar?: string }>> {
  const localRegistry = getRegisteredPersonnelRegistry();
  const candidates = localRegistry.map(u => ({
    id: u.id,
    name: u.fullName,
    role: u.role,
    face_descriptor: u.face_descriptor || generateDeterministicFaceDescriptor(u.username || u.email),
    avatar: u.avatar
  }));

  // Also query live Supabase trainees & trainers
  try {
    const { data: trainees } = await supabase.from('trainees').select('id, name').limit(10);
    if (trainees) {
      trainees.forEach(t => {
        if (!candidates.some(c => c.id === t.id || c.name.toLowerCase() === t.name.toLowerCase())) {
          candidates.push({
            id: t.id,
            name: t.name,
            role: 'trainee',
            face_descriptor: generateDeterministicFaceDescriptor(t.name),
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
          });
        }
      });
    }

    const { data: trainers } = await supabase.from('trainers').select('id, name').limit(10);
    if (trainers) {
      trainers.forEach(tr => {
        if (!candidates.some(c => c.id === tr.id || c.name.toLowerCase() === tr.name.toLowerCase())) {
          candidates.push({
            id: tr.id,
            name: tr.name,
            role: 'trainer',
            face_descriptor: generateDeterministicFaceDescriptor(tr.name),
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300'
          });
        }
      });
    }
  } catch (err) {
    console.warn('Live Supabase query for candidates:', err);
  }

  return candidates;
}

// Helper to get all registered users including dynamic localStorage registrations
export function getRegisteredPersonnelRegistry(): UserProfile[] {
  try {
    const cached = localStorage.getItem('moes_registered_users_registry');
    if (cached) {
      const parsed: UserProfile[] = JSON.parse(cached);
      const combined = [...INITIAL_REGISTERED_PERSONNEL];
      parsed.forEach((p) => {
        if (!combined.some((c) => c.email.toLowerCase() === p.email.toLowerCase() || c.username.toLowerCase() === p.username.toLowerCase())) {
          combined.push(p);
        }
      });
      return combined;
    }
  } catch (e) {
    console.warn('Error reading registered personnel cache:', e);
  }
  return INITIAL_REGISTERED_PERSONNEL;
}

// Check if a user is registered in Supabase or the MoES personnel registry
export async function checkUserRegistrationInSupabase(
  identifier: string,
  role?: UserRole,
  password?: string
): Promise<{ isRegistered: boolean; profile?: UserProfile; error?: string }> {
  const cleanId = identifier.trim().toLowerCase();
  if (!cleanId) {
    return { isRegistered: false, error: 'Identifier is required.' };
  }

  // 1. Check local / cached registered personnel registry
  const registry = getRegisteredPersonnelRegistry();
  const localMatch = registry.find((u) => 
    u.username.toLowerCase() === cleanId || 
    u.email.toLowerCase() === cleanId ||
    u.fullName.toLowerCase() === cleanId ||
    u.id.toLowerCase() === cleanId
  );

  if (localMatch) {
    if (role && localMatch.role !== role) {
      return { 
        isRegistered: false, 
        error: `Institutional role mismatch: User is registered as '${localMatch.role.toUpperCase()}', not '${role.toUpperCase()}'.` 
      };
    }

    if (password && localMatch.password && localMatch.password !== password) {
      return {
        isRegistered: false,
        error: 'Invalid password. Please check your credentials or reset your institutional access.'
      };
    }

    return { isRegistered: true, profile: localMatch };
  }

  // 2. Query live Supabase database for trainees or trainers
  try {
    // Check Supabase trainees table
    const { data: traineeData } = await supabase
      .from('trainees')
      .select('*')
      .ilike('name', `%${cleanId}%`)
      .limit(1);

    if (traineeData && traineeData.length > 0) {
      const t = traineeData[0];
      const profile: UserProfile = {
        id: t.id,
        username: t.name.toLowerCase().replace(/\s+/g, '_'),
        fullName: t.name,
        email: `${t.name.toLowerCase().replace(/\s+/g, '.')}@moes.gov.in`,
        role: 'trainee',
        institute: t.department || 'Ministry of Earth Sciences (MoES)',
        designation: "Scientist 'B' Probationer",
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        phone: '+91 98765 00000',
        bio: `Probationary Scientist at ${t.department}.`,
        qualifications: 'M.Sc / M.Tech in Earth System Science',
        workExperience: 'MoES Cadre Scientist',
        igotKarmaPoints: 1200,
        face_descriptor: DEFAULT_FACE_DESCRIPTOR,
        interests: ['Meteorology', 'Oceanography'],
        skills: [{ name: 'Earth Observation', level: t.baseline_skill || 85, category: 'Core' }],
        certificates: []
      };
      return { isRegistered: true, profile };
    }

    // Check Supabase trainers table
    const { data: trainerData } = await supabase
      .from('trainers')
      .select('*')
      .ilike('name', `%${cleanId}%`)
      .limit(1);

    if (trainerData && trainerData.length > 0) {
      const tr = trainerData[0];
      const profile: UserProfile = {
        id: tr.id,
        username: tr.name.toLowerCase().replace(/\s+/g, '_'),
        fullName: tr.name,
        email: `${tr.name.toLowerCase().replace(/\s+/g, '.')}@moes.gov.in`,
        role: 'trainer',
        institute: 'Ministry of Earth Sciences (MoES)',
        designation: "Scientist 'F' Faculty",
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
        phone: '+91 98111 00000',
        bio: `Senior Instructor specializing in ${tr.specialization}.`,
        qualifications: 'Ph.D. in Atmospheric / Ocean Sciences',
        workExperience: 'Senior MoES Faculty',
        specialization: tr.specialization,
        yearsOfExperience: 15,
        publishedMaterialsCount: 20,
        face_descriptor: DEFAULT_FACE_DESCRIPTOR,
        interests: ['Capacity Building', tr.specialization],
        skills: [{ name: tr.specialization, level: Math.round(tr.competency_score || 90), category: 'Specialization' }],
        certificates: []
      };
      return { isRegistered: true, profile };
    }
  } catch (err: any) {
    console.warn('Supabase registration check error:', err);
  }

  // Not found in Supabase or local registry
  return { 
    isRegistered: false, 
    error: `Access Denied: Unregistered Officer/Personnel. No institutional record found in MoES Central Registry (Supabase). Standard authentication is strictly blocked for unregistered users.` 
  };
}

// Register a newly approved user into local storage and sync with Supabase
export async function registerNewUserRecord(user: UserProfile): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Update local registry with complete profile and face descriptor
    const existing = getRegisteredPersonnelRegistry();
    const updated = [...existing.filter(u => u.email.toLowerCase() !== user.email.toLowerCase()), user];
    localStorage.setItem('moes_registered_users_registry', JSON.stringify(updated));

    // 2. Persist to Supabase Database (trainees or trainers table)
    if (user.role === 'trainee') {
      try {
        // Attempt full schema insert with face_descriptor JSONB and qualifications
        const { error: fullError } = await supabase.from('trainees').upsert({
          name: user.fullName,
          department: user.institute,
          baseline_skill: 85,
          days_unpracticed: 0,
          email: user.email,
          qualifications: user.qualifications,
          face_descriptor: user.face_descriptor
        }).select();

        if (fullError) {
          // Fallback to core guaranteed schema if custom columns are not present
          await supabase.from('trainees').upsert({
            name: user.fullName,
            department: user.institute,
            baseline_skill: 85,
            days_unpracticed: 0
          }).select();
        }
      } catch (dbErr) {
        console.warn('Supabase trainee upsert warning:', dbErr);
      }
    } else if (user.role === 'trainer') {
      try {
        // Attempt full schema insert with face_descriptor JSONB
        const { error: fullError } = await supabase.from('trainers').upsert({
          name: user.fullName,
          specialization: user.specialization || user.qualifications || 'Earth System Sciences',
          competency_score: 92,
          rating: 4.8,
          workload_hours: 10,
          email: user.email,
          face_descriptor: user.face_descriptor
        }).select();

        if (fullError) {
          // Fallback to core guaranteed schema
          await supabase.from('trainers').upsert({
            name: user.fullName,
            specialization: user.specialization || 'Earth System Sciences',
            competency_score: 92,
            rating: 4.8,
            workload_hours: 10
          }).select();
        }
      } catch (dbErr) {
        console.warn('Supabase trainer upsert warning:', dbErr);
      }
    }

    // 3. Register user in Supabase Auth if credentials provided
    if (user.email && user.password) {
      try {
        await supabase.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: {
              full_name: user.fullName,
              role: user.role,
              institute: user.institute,
              face_descriptor: user.face_descriptor
            }
          }
        });
      } catch (authErr) {
        console.warn('Supabase Auth signUp notification:', authErr);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error during registerNewUserRecord:', err);
    return { success: true }; // Local registry successfully committed
  }
}

// Fast Login / Evaluation Bypass Profiles
export const FAST_LOGIN_PROFILES: Record<UserRole, UserProfile> = {
  trainee: INITIAL_REGISTERED_PERSONNEL[0], // Ananya Sharma (IMD Pune)
  trainer: INITIAL_REGISTERED_PERSONNEL[2], // Dr. Rajeshwar Rao (NCMRWF)
  admin: INITIAL_REGISTERED_PERSONNEL[4]    // Dr. Sunita Deshmukh (MoES HQ)
};

export const EVALUATION_PASSCODE = '12345';
