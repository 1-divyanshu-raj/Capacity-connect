import { SUPABASE_URL, supabase } from './supabase';

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

/**
 * Sends face embeddings to the protected Edge Function.
 * The browser never receives the biometric database.
 */
export async function verifyBiometricLogin(vectors: number[]): Promise<BiometricLoginResult> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/biometric-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: (supabase as any).supabaseKey,
    },
    body: JSON.stringify({ vector: vectors }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 401) {
    throw new Error(data?.error || 'Biometric verification failed');
  }
  return data as BiometricLoginResult;
}

/**
 * Performs temporal consistency verification using 3+ captured frames.
 */
export async function verifyBiometricFrames(vectors: number[][]): Promise<BiometricLoginResult> {
  if (vectors.length < 3) throw new Error('At least three face frames are required');
  const response = await fetch(`${SUPABASE_URL}/functions/v1/biometric-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: (supabase as any).supabaseKey,
    },
    body: JSON.stringify({ vectors: vectors.slice(0, 5) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 401) throw new Error(data?.error || 'Biometric verification failed');
  return data as BiometricLoginResult;
}
