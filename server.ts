import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = 3000;
app.use(express.json({ limit: '10mb' }));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://deyyyyreixyppwfyhtao.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_UdGgYIQJ56CtC4e2oW7DTQ_VGBWmUWS';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const PROFILES_FILE = path.join(process.cwd(), 'data', 'registered_profiles.json');

function getStoredProfiles(): any[] {
  try {
    if (fs.existsSync(PROFILES_FILE)) return JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf-8'));
  } catch (err) {
    console.warn('Error reading stored profiles:', err);
  }
  return [];
}

function saveStoredProfiles(profiles: any[]): void {
  try {
    const dir = path.dirname(PROFILES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving stored profiles:', err);
  }
}

// Authentication secrets are never persisted locally.
function sanitizeStoredProfile(profile: any): any {
  if (!profile || typeof profile !== 'object') return profile;
  const { password: _password, face_descriptor: _faceDescriptor, ...safeProfile } = profile;
  return safeProfile;
}

function getSanitizedStoredProfiles(): any[] {
  return getStoredProfiles().map(sanitizeStoredProfile);
}

let genAI: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!genAI) genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  return genAI;
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', portal: 'CAPACITY CONNECT - MoES / IMD', hasGeminiKey: !!process.env.GEMINI_API_KEY });
});

// Public profile API deliberately excludes passwords and biometric vectors.
// Face descriptors must not be distributed through a general-purpose endpoint.
app.get('/api/profiles', async (_req, res) => {
  try {
    const stored = getSanitizedStoredProfiles();
    let supabaseProfiles: any[] = [];
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,full_name,role,institute,designation,avatar_url,phone,bio,qualifications,work_experience,specialization,years_of_experience,published_materials_count,account_status,created_at,updated_at')
        .limit(500);
      if (!error && data) supabaseProfiles = data;
    } catch (dbErr) {
      console.warn('Supabase query in /api/profiles:', dbErr);
    }

    const profileMap = new Map<string, any>();
    supabaseProfiles.forEach((p) => {
      const key = String(p.email || p.id || '').toLowerCase();
      if (key) profileMap.set(key, sanitizeStoredProfile(p));
    });
    stored.forEach((p) => {
      const key = String(p.email || p.id || '').toLowerCase();
      if (key) profileMap.set(key, { ...(profileMap.get(key) || {}), ...sanitizeStoredProfile(p) });
    });

    const combined = Array.from(profileMap.values()).map(sanitizeStoredProfile);
    res.json({ profiles: combined, count: combined.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch profiles' });
  }
});

// Profile persistence remains separate from authentication. Passwords and biometric
// vectors are ignored by local persistence; Supabase Auth remains the password authority.
app.post('/api/profiles', async (req, res) => {
  try {
    const newProfile = req.body;
    if (!newProfile || (!newProfile.email && !newProfile.id)) return res.status(400).json({ error: 'Profile email or id is required' });

    const email = String(newProfile.email || '').toLowerCase();
    const id = newProfile.id || `MOES-${Date.now().toString().slice(-6)}`;
    const stored = getStoredProfiles();
    const existingIdx = stored.findIndex((p) => (p.email && p.email.toLowerCase() === email) || (p.id && p.id === id));

    const record = sanitizeStoredProfile({
      id,
      email,
      full_name: newProfile.fullName || newProfile.full_name || 'Registered Personnel',
      role: newProfile.role || 'trainee',
      institute: newProfile.institute || 'Ministry of Earth Sciences',
      designation: newProfile.designation || "Scientist 'B' Probationer",
      avatar_url: newProfile.avatar || newProfile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      face_registered: Array.isArray(newProfile.face_descriptor) && newProfile.face_descriptor.length >= 128,
      updated_at: new Date().toISOString(),
      created_at: existingIdx >= 0 ? stored[existingIdx].created_at : new Date().toISOString(),
    });

    if (existingIdx >= 0) stored[existingIdx] = { ...stored[existingIdx], ...record };
    else stored.push(record);
    saveStoredProfiles(stored.map(sanitizeStoredProfile));

    // Only the Supabase profile table stores the biometric vector. It is never returned
    // by this API and should be protected by Supabase RLS in production.
    if (Array.isArray(newProfile.face_descriptor) && newProfile.face_descriptor.length >= 128) {
      const vectorLiteral = `[${newProfile.face_descriptor.map((v: number) => Number((v || 0).toFixed(6))).join(',')}]`;
      try {
        const { error: upsertErr } = await supabase.from('profiles').upsert({
          id: record.id,
          email: record.email,
          full_name: record.full_name,
          role: record.role,
          avatar_url: record.avatar_url,
          face_registered: true,
          face_descriptor: vectorLiteral,
          updated_at: new Date().toISOString(),
        });
        if (upsertErr) console.warn('Supabase remote profiles upsert notice:', upsertErr.message);
      } catch (sbErr) {
        console.warn('Supabase remote profiles upsert warning:', sbErr);
      }
    }

    res.json({ success: true, profile: sanitizeStoredProfile(record) });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save profile' });
  }
});

app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, contextCourse } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const ai = getGeminiClient();
    if (ai) {
      try {
        const systemInstruction = `You are "MoES Earth Co-Pilot", an authoritative AI study assistant for trainee scientists and meteorologists in the Ministry of Earth Sciences (MoES), India Meteorological Department (IMD), NCMRWF, INCOIS, and IITM. Provide accurate, concise, pedagogical answers with scientific precision and practical operational context for Indian Earth Sciences. Format responses with clear markdown, bullet points, and practical equations when relevant.`;
        const response = await ai.models.generateContent({ model: 'gemini-3.8-flash', contents: `Topic Context: ${contextCourse || 'Earth Sciences & Meteorology'}\nTrainee Question: ${message}`, config: { systemInstruction, temperature: 0.6 } });
        if (response.text) return res.json({ reply: response.text, source: 'gemini-3.8-flash' });
      } catch (geminiErr) {
        console.warn('Gemini API call failed, using fallback:', geminiErr);
      }
    }
    res.json({ reply: `### MoES Earth Sciences Advisory\n\nRegarding **"${message}"**: analyze the problem using observations, physical principles, calibrated datasets, and official operational procedures.`, source: 'moes-domain-engine' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.post('/api/gemini/generate-mcqs', async (req, res) => {
  try {
    const { topic, sourceText, difficulty = 'Intermediate' } = req.body;
    if (!topic && !sourceText) return res.status(400).json({ error: 'Topic or source text is required' });
    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `Generate exactly 5 professional MCQs for MoES/IMD earth-science trainees. Topic: ${topic || 'Earth Sciences & Operational Meteorology'} Difficulty: ${difficulty} ${sourceText ? `Source lesson:\n${sourceText}` : ''}. Output valid JSON with an array named mcqs. Each item needs id, question, options (4 strings), correctIndex (0-3), explanation and difficulty.`;
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: { mcqs: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING }, difficulty: { type: Type.STRING } }, required: ['id', 'question', 'options', 'correctIndex', 'explanation', 'difficulty'] } } },
              required: ['mcqs'],
            },
          },
        });
        const parsed = JSON.parse(response.text || '{}');
        if (parsed.mcqs?.length) return res.json({ mcqs: parsed.mcqs, source: 'gemini-3.8-flash' });
      } catch (geminiErr) {
        console.warn('Gemini MCQ generation failed, using fallback:', geminiErr);
      }
    }
    res.json({ mcqs: [{ id: `mcq-${Date.now()}-1`, question: `Which variable is useful for identifying non-meteorological echoes in Doppler weather radar?`, options: ['Z_DR', 'K_DP', 'ρ_HV', 'Spectrum width'], correctIndex: 2, explanation: 'Cross-correlation coefficient ρ_HV helps discriminate meteorological and non-meteorological scatterers.', difficulty }], source: 'moes-domain-engine' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

async function startServer() {
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
  app.use(express.static(path.join(process.cwd(), 'dist')));
  app.listen(PORT, () => console.log(`CAPACITY CONNECT running on http://localhost:${PORT}`));
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
