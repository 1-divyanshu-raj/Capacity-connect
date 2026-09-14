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
    if (fs.existsSync(PROFILES_FILE)) {
      const content = fs.readFileSync(PROFILES_FILE, 'utf-8');
      return JSON.parse(content);
    }
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

// Never persist authentication secrets locally. Supabase Auth owns passwords.
function sanitizeStoredProfile(profile: any): any {
  if (!profile || typeof profile !== 'object') return profile;
  const { password: _password, ...safeProfile } = profile;
  return safeProfile;
}

function getSanitizedStoredProfiles(): any[] {
  return getStoredProfiles().map(sanitizeStoredProfile);
}

// Shared Gemini client lazy initializer
let genAI: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!genAI) {
    genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  }
  return genAI;
}

// 1. Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    portal: 'CAPACITY CONNECT - MoES / IMD',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Profiles API: Get profiles without ever returning stored passwords.
app.get('/api/profiles', async (_req, res) => {
  try {
    const stored = getSanitizedStoredProfiles();
    let supabaseProfiles: any[] = [];

    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) supabaseProfiles = data.map(sanitizeStoredProfile);
    } catch (dbErr) {
      console.warn('Supabase query in /api/profiles:', dbErr);
    }

    const profileMap = new Map<string, any>();
    supabaseProfiles.forEach((p) => {
      const key = (p.email || p.id || '').toLowerCase();
      if (key) profileMap.set(key, p);
    });
    stored.forEach((p) => {
      const key = (p.email || p.id || '').toLowerCase();
      if (key) profileMap.set(key, { ...(profileMap.get(key) || {}), ...p });
    });

    const combined = Array.from(profileMap.values()).map(sanitizeStoredProfile);
    res.json({ profiles: combined, count: combined.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch profiles' });
  }
});

// Profiles API: register/update profile data. Passwords are intentionally ignored.
app.post('/api/profiles', async (req, res) => {
  try {
    const newProfile = req.body;
    if (!newProfile || (!newProfile.email && !newProfile.id)) {
      return res.status(400).json({ error: 'Profile email or id is required' });
    }

    const email = (newProfile.email || '').toLowerCase();
    const id = newProfile.id || `MOES-${Date.now().toString().slice(-6)}`;
    const stored = getStoredProfiles();
    const existingIdx = stored.findIndex(
      (p) => (p.email && p.email.toLowerCase() === email) || (p.id && p.id === id)
    );

    const record = sanitizeStoredProfile({
      id,
      email,
      full_name: newProfile.fullName || newProfile.full_name || 'Registered Personnel',
      role: newProfile.role || 'trainee',
      institute: newProfile.institute || 'Ministry of Earth Sciences',
      designation: newProfile.designation || "Scientist 'B' Probationer",
      avatar_url: newProfile.avatar || newProfile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      face_registered: Array.isArray(newProfile.face_descriptor) && newProfile.face_descriptor.length >= 128,
      face_descriptor: newProfile.face_descriptor,
      updated_at: new Date().toISOString(),
      created_at: existingIdx >= 0 ? stored[existingIdx].created_at : new Date().toISOString(),
    });

    if (existingIdx >= 0) stored[existingIdx] = { ...stored[existingIdx], ...record };
    else stored.push(record);

    saveStoredProfiles(stored.map(sanitizeStoredProfile));

    if (record.face_descriptor && Array.isArray(record.face_descriptor)) {
      const vectorLiteral = `[${record.face_descriptor.map((v: number) => Number((v || 0).toFixed(6))).join(',')}]`;
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

// 2. Trainee AI Co-Pilot Chat
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, contextCourse } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const ai = getGeminiClient();
    if (ai) {
      try {
        const systemInstruction = `You are "MoES Earth Co-Pilot", an authoritative AI study assistant for trainee scientists and meteorologists in the Ministry of Earth Sciences (MoES), India Meteorological Department (IMD), NCMRWF, INCOIS, and IITM.
Your knowledge covers Radar Meteorology (Doppler weather radars, dual-polarization, reflectivity dBZ, radial velocity, hydrometeor classification), Seismology (earthquake epicenters, Gutenberg-Richter law, tsunami early warning systems by INCOIS Hyderabad), Numerical Weather Prediction (WRF model, GFS, 4D-Var data assimilation), and Ocean-Atmosphere Dynamics (Indian Ocean Dipole, Monsoon low pressure systems, Tropical Cyclones over Bay of Bengal/Arabian Sea).
Provide accurate, concise, pedagogical answers with scientific precision and practical operational context for Indian Earth Sciences. Format your responses with clear markdown, bullet points, and practical equations if relevant.`;
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Topic Context: ${contextCourse || 'Earth Sciences & Meteorology'}\nTrainee Question: ${message}`,
          config: { systemInstruction, temperature: 0.6 },
        });
        const reply = response.text;
        if (reply) return res.json({ reply, source: 'gemini-3.8-flash' });
      } catch (geminiErr) {
        console.warn('Gemini API call failed, using Earth Sciences knowledge base:', geminiErr);
      }
    }

    const lower = message.toLowerCase();
    let reply = '';
    if (lower.includes('radar') || lower.includes('doppler') || lower.includes('reflectivity') || lower.includes('dbz')) {
      reply = `### Doppler Weather Radar (DWR) Operational Principles\n\n- **Reflectivity Factor ($Z$ / dBZ):** Measures backscattered energy proportional to $\\sum D^6$ (Rayleigh scattering regime). Values >45 dBZ typically indicate convective rainfall, while >55 dBZ suggests severe thunderstorms or hail.\n- **Dual-Polarization:** $Z_{DR}$ helps distinguish drop shape; $K_{DP}$ is useful for heavy precipitation; $\\rho_{HV}$ helps discriminate meteorological from non-meteorological echoes.\n- **IMD Network:** Doppler radars support cyclone and severe-weather monitoring across India.`;
    } else if (lower.includes('seism') || lower.includes('tsunami') || lower.includes('earthquake')) {
      reply = `### Seismology & Tsunami Early Warning\n\n- P-waves are compressional; S-waves are shear waves.\n- INCOIS operates the Indian Tsunami Early Warning Centre and integrates seismic, bottom-pressure and tide-gauge observations.\n- Focal mechanisms can be derived using moment-tensor methods.`;
    } else if (lower.includes('nwp') || lower.includes('wrf') || lower.includes('model') || lower.includes('forecast')) {
      reply = `### Numerical Weather Prediction\n\n- NWP solves atmospheric dynamics, thermodynamics and continuity equations.\n- Data assimilation combines observations with model forecasts.\n- WRF and global forecasting systems are used for high-resolution and medium-range forecasting.`;
    } else {
      reply = `### MoES Earth Sciences Trainee Advisory\n\nRegarding your question: **"${message}"**:\n\n1. **Core Concept:** Analyze operational Earth-science problems through thermodynamics, fluid dynamics, observations and numerical modelling.\n2. **Practical Guideline:** Use calibrated datasets and official operational procedures when working with real observations.\n3. **Recommended Study:** Review satellite, radar and data-assimilation fundamentals relevant to the topic.`;
    }
    res.json({ reply, source: 'moes-domain-engine' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 3. AI Assessment Generator for Trainers
app.post('/api/gemini/generate-mcqs', async (req, res) => {
  try {
    const { topic, sourceText, difficulty = 'Intermediate' } = req.body;
    if (!topic && !sourceText) return res.status(400).json({ error: 'Topic or source text is required' });

    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `Generate exactly 5 high-quality, professional multiple-choice questions (MCQs) for training meteorologists and earth scientists in the Ministry of Earth Sciences (MoES / IMD).\nTopic: ${topic || 'Earth Sciences & Operational Meteorology'}\nDifficulty: ${difficulty}\n${sourceText ? `Source Lesson Material:\n${sourceText}` : ''}\n\nOutput strictly valid JSON with an array named "mcqs". Each item must have id, question, options (4 strings), correctIndex (0-3), explanation, and difficulty.`;
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                mcqs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING }, question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING }, difficulty: { type: Type.STRING },
                    },
                    required: ['id', 'question', 'options', 'correctIndex', 'explanation', 'difficulty'],
                  },
                },
              },
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

    const targetTopic = topic || 'Meteorology & Earth Sciences';
    res.json({
      mcqs: [
        {
          id: `mcq-${Date.now()}-1`,
          question: `In operational Doppler Weather Radar observation of ${targetTopic}, which polarimetric variable is primarily useful for identifying non-meteorological echoes?`,
          options: ['Differential Reflectivity (Z_DR)', 'Specific Differential Phase (K_DP)', 'Cross-Correlation Coefficient (ρ_HV)', 'Doppler Velocity Spectrum Width'],
          correctIndex: 2,
          explanation: 'Cross-correlation coefficient is useful for separating meteorological echoes from many non-meteorological scatterers.',
          difficulty,
        },
      ],
      source: 'moes-domain-engine',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Vite middleware / static server
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
