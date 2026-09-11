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
