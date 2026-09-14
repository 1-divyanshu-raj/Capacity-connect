import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';

export interface BiometricLoginResult {
  matched: boolean;
  distance?: number | null;
  reason?: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  action_link?: string | null;
}

async function callBiometricFunction(payload: unknown): Promise<BiometricLoginResult> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/biometric-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 401) {
    throw new Error(data?.error || 'Biometric verification failed');
  }
  return data as BiometricLoginResult;
}

/** Sends one real face embedding; the browser never receives the biometric database. */
export function verifyBiometricLogin(vector: number[]): Promise<BiometricLoginResult> {
  return callBiometricFunction({ vector });
}

/** Sends 3-5 temporal face embeddings for consistency checking and server-side matching. */
export function verifyBiometricFrames(vectors: number[][]): Promise<BiometricLoginResult> {
  if (vectors.length < 3) throw new Error('At least three face frames are required');
  return callBiometricFunction({ vectors: vectors.slice(0, 5) });
}
