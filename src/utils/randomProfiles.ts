import { UserProfile, UserRole } from '../types';

export interface RandomProfileData {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  designation: string;
  institute: string;
  avatar: string;
  govId: string;
}

const FIRST_NAMES = [
  'Dr. Ananya', 'Dr. Vikram', 'Prof. Sunita', 'Dr. Rajesh', 'Dr. Meera',
  'Prof. Arvind', 'Dr. Kavita', 'Sanjay', 'Pooja', 'Dr. Devendra',
  'Rohit', 'Dr. Sneha', 'Prof. Harish', 'Dr. Tanvi', 'Alok'
];

const LAST_NAMES = [
  'Sharma', 'Nambiar', 'Rathore', 'Mukherjee', 'Iyer',
  'Bandyopadhyay', 'Patel', 'Deshmukh', 'Chakraborty', 'Sundaram',
  'Verma', 'Menon', 'Kulkarni', 'Tripathi', 'Goswami'
];

const INSTITUTES = [
  'India Meteorological Department (IMD HQ)',
  'National Centre for Medium Range Weather Forecasting (NCMRWF)',
  'Indian Institute of Tropical Meteorology (IITM Pune)',
  'Indian National Centre for Ocean Information Services (INCOIS)',
  'National Institute of Ocean Technology (NIOT Chennai)',
  'National Centre for Polar and Ocean Research (NCPOR Goa)'
];

const DESIGNATIONS: Record<UserRole, string[]> = {
  trainee: [
    'Scientific Officer - NWP Doppler Unit',
    'Radar Meteorologist-B',
    'Satellite Data Analyst - INSAT-3D',
    'Ocean Buoy Monitoring Fellow',
    'Probationary Forecaster - Cyclone Division',
    'Atmospheric Research Scholar'
  ],
  trainer: [
    'Chief Doppler Radar Specialist',
    'Principal Faculty - Seismology & Tsunami Risk',
    'Senior Numerical Weather Prediction Modeler',
    'Director of Oceanographic Data Systems',
    'Lead Instructor - Polar Meteorology'
  ],
  admin: [
    'Secretary, MoES - National Oversight',
    'Director General of Meteorology (DGM)',
    'Chief Information Security Officer (CISO)',
    'National Training Division Controller',
    'Principal Scientific Advisor, MoES'
  ]
};

const AVATARS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=256'
];

const DEFAULT_AVATARS: Record<UserRole, string> = {
  trainee: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  trainer: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
  admin: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256'
};

const DEFAULT_FULLNAMES: Record<UserRole, string> = {
  trainee: 'Ananya Sharma (XYZ Trainee)',
  trainer: 'Dr. Rajeshwar Rao (XYZ Trainer)',
  admin: 'Dr. Sunita Deshmukh (XYZ Admin)'
};

const DEFAULT_INSTITUTES: Record<UserRole, string> = {
  trainee: 'India Meteorological Department (IMD) - Pune Training Division',
  trainer: 'National Centre for Medium Range Weather Forecasting (NCMRWF), Noida',
  admin: 'Ministry of Earth Sciences (MoES HQ, Prithvi Bhavan, New Delhi)'
};

const DEFAULT_DESIGNATIONS: Record<UserRole, string> = {
  trainee: "Scientist 'B' Probationer",
  trainer: "Scientist 'G' & Chief Faculty Director",
  admin: 'Joint Director & National Capacity Mission Head'
};

export function getDefaultRoleProfile(role: UserRole): RandomProfileData {
  const username = `XYZ_${role}`;
  return {
    fullName: DEFAULT_FULLNAMES[role],
    username,
    email: `${username}@moes.gov.in`,
    phone: role === 'admin' ? '+91 99999 88888' : role === 'trainer' ? '+91 98111 22334' : '+91 98765 43210',
    role,
    designation: DEFAULT_DESIGNATIONS[role],
    institute: DEFAULT_INSTITUTES[role],
    avatar: DEFAULT_AVATARS[role],
    govId: `GOV-MOES-${role.toUpperCase()}-XYZ`
  };
}

export function generateRandomProfile(role: UserRole): RandomProfileData {
  return getDefaultRoleProfile(role);
}

