import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, number[]>();
function rateLimited(key: string) { const now = Date.now(); const recent = (attempts.get(key) || []).filter((t) => now - t < WINDOW_MS); if (recent.length >= MAX_ATTEMPTS) { attempts.set(key, recent); return true; } recent.push(now); attempts.set(key, recent); return false; }
function distance(a: number[], b: number[]) { if (a.length !== 128 || b.length !== 128) return Infinity; let sum = 0; for (let i = 0; i < 128; i++) { const d = a[i] - b[i]; sum += d * d; } return Math.sqrt(sum); }
function parseVector(value: unknown): number[] | null { if (Array.isArray(value) && value.length === 128 && value.every((v) => Number.isFinite(v))) return value as number[]; if (typeof value === "string") { try { const parsed = JSON.parse(value); if (Array.isArray(parsed) && parsed.length === 128 && parsed.every((v) => Number.isFinite(v))) return parsed; const cleaned = value.replace(/[\[\]()]/g, '').split(',').map(Number); if (cleaned.length === 128 && cleaned.every(Number.isFinite)) return cleaned; } catch {} } return null; }
function validVector(value: unknown): value is number[] { return Array.isArray(value) && value.length === 128 && value.every((v) => Number.isFinite(v)); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return new Response(JSON.stringify({ error: "Too many biometric attempts. Try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const body = await req.json();
    const vectors = Array.isArray(body?.vectors) ? body.vectors : [body?.vector];
    if (vectors.length < 1 || vectors.length > 5 || !vectors.every(validVector)) throw new Error("Invalid biometric vector payload");
    if (vectors.length >= 3) for (let i = 1; i < vectors.length; i++) if (distance(vectors[0], vectors[i]) > 0.35) return new Response(JSON.stringify({ matched: false, reason: "Inconsistent face frames" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: profiles, error } = await admin.from("profiles").select("id,email,full_name,role,account_status,face_descriptor").eq("account_status", "active").not("face_descriptor", "is", null).limit(500);
    if (error) throw error;
    let best: any = null, bestDistance = Infinity;
    for (const profile of profiles || []) { const stored = parseVector(profile.face_descriptor); if (!stored) continue; const avg = vectors.map((v: number[]) => distance(v, stored)).reduce((a: number, b: number) => a + b, 0) / vectors.length; if (avg < bestDistance) { bestDistance = avg; best = profile; } }
    if (!best || bestDistance > 0.45) return new Response(JSON.stringify({ matched: false, bestDistance: Number.isFinite(bestDistance) ? Number(bestDistance.toFixed(4)) : null }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!best.email) throw new Error("Matched account has no email address");
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email: best.email });
    if (linkError) throw linkError;
    return new Response(JSON.stringify({ matched: true, user: { id: best.id, email: best.email, fullName: best.full_name, role: best.role }, distance: Number(bestDistance.toFixed(4)), action_link: linkData?.properties?.action_link || null }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("biometric-login error", error);
    return new Response(JSON.stringify({ error: "Biometric verification failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
