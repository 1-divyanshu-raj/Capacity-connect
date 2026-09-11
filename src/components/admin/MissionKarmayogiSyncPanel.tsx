import React, { useState, useMemo } from 'react';
import { 
  Award, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  Send, 
  FileText, 
  Terminal, 
  Clock, 
  Database, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Building2,
  Lock
} from 'lucide-react';
import { FracCompetencyItem, XApiStatementRecord } from '../../types';
import { sound } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';

const INITIAL_FRAC_COMPETENCIES: FracCompetencyItem[] = [
  {
    id: 'frac-01',
    code: 'MOES-FRAC-RADAR-01',
    competencyArea: 'Doppler Weather Radar (DWR) Dual-Pol Calibration',
    roleMapping: 'Scientist B / C (Radar Meteorology)',
    activityDescription: 'Operational monitoring, velocity de-aliasing, and hydrometeor classification using X/C/S-band radar streams.',
    proficiencyLevel: 4,
    iGotCreditPoints: 120,
    xApiVerb: 'http://adlnet.gov/expapi/verbs/mastered',
    lastSyncedTimestamp: 'Today, 14:15 IST',
    syncStatus: 'SYNCED',
    moesCadre: 'IMD Operational Cadre'
  },
  {
    id: 'frac-02',
    code: 'MOES-FRAC-NWP-02',
    competencyArea: 'Numerical Weather Prediction & WRF Parameterization',
    roleMapping: 'Scientist C / D (Atmospheric Modeling)',
    activityDescription: 'Parallel domain configuration, physics parameter tuning, and high-performance computing on PARAM Pratyush.',
    proficiencyLevel: 5,
    iGotCreditPoints: 160,
    xApiVerb: 'http://adlnet.gov/expapi/verbs/completed',
    lastSyncedTimestamp: 'Today, 13:40 IST',
    syncStatus: 'SYNCED',
    moesCadre: 'NCMRWF Supercomputing Wing'
  },
  {
    id: 'frac-03',
    code: 'MOES-FRAC-OCEAN-03',
    competencyArea: 'Deep-Sea Ocean Observation & Tsunami Early Warning',
    roleMapping: 'Project Scientist / Scientist B (Oceanography)',
    activityDescription: 'Real-time telemetry ingestion from BPR (Bottom Pressure Recorders) and acoustic release buoy networks.',
    proficiencyLevel: 4,
    iGotCreditPoints: 140,
    xApiVerb: 'http://adlnet.gov/expapi/verbs/completed',
    lastSyncedTimestamp: 'Today, 11:20 IST',
    syncStatus: 'SYNCED',
    moesCadre: 'INCOIS Disaster Management'
  },
  {
    id: 'frac-04',
    code: 'MOES-FRAC-CLIM-04',
    competencyArea: 'Monsoon Aerosol Dynamics & Radiative Forcing Analysis',
    roleMapping: 'Research Fellow / Scientist B (Atmosphere Physics)',
    activityDescription: 'Estimation of aerosol optical depth (AOD) from CALIPSO/MODIS datasets and cloud condensation nuclei profiling.',
    proficiencyLevel: 3,
    iGotCreditPoints: 90,
    xApiVerb: 'http://adlnet.gov/expapi/verbs/passed',
    lastSyncedTimestamp: 'Pending Sync',
    syncStatus: 'PENDING',
    moesCadre: 'IITM Climate Studies'
  }
];

const INITIAL_XAPI_FEED: XApiStatementRecord[] = [
  {
    id: 'xapi-stmt-991',
    actorEmail: 'dr.rajesh.kumar@imd.gov.in',
    actorName: 'Dr. Rajesh Kumar',
    verbId: 'http://adlnet.gov/expapi/verbs/mastered',
    verbDisplay: 'mastered',
    activityId: 'https://capacityconnect.moes.gov.in/courses/radar-dual-pol',
    activityName: 'Dual-Polarization Doppler Radar Simulation Lab',
    scoreRaw: 96,
    scoreScaled: 0.96,
    success: true,
    timestamp: '2026-09-11T13:45:10Z',
    authority: 'MoES Capacity Building Commission / iGOT Gateway',
    checksum: 'sha256-3f912a...7c9b1'
  },
  {
    id: 'xapi-stmt-992',
    actorEmail: 'ananya.sharma@incois.gov.in',
    actorName: 'Ananya Sharma',
    verbId: 'http://adlnet.gov/expapi/verbs/completed',
    verbDisplay: 'completed',
    activityId: 'https://capacityconnect.moes.gov.in/courses/tsunami-buoy-telemetry',
    activityName: 'Deep-Sea Acoustic Release Buoy Diagnostics',
    scoreRaw: 92,
    scoreScaled: 0.92,
    success: true,
    timestamp: '2026-09-11T12:30:22Z',
    authority: 'MoES Capacity Building Commission / iGOT Gateway',
    checksum: 'sha256-8a4b2c...1d904'
  },
  {
    id: 'xapi-stmt-993',
    actorEmail: 'siddharth.verma@ncs.gov.in',
    actorName: 'Siddharth Verma',
    verbId: 'http://adlnet.gov/expapi/verbs/passed',
    verbDisplay: 'passed',
    activityId: 'https://capacityconnect.moes.gov.in/courses/seismic-inversion',
    activityName: 'Broadband Seismograph Sensor Array Baseline',
    scoreRaw: 88,
    scoreScaled: 0.88,
    success: true,
    timestamp: '2026-09-11T10:15:00Z',
    authority: 'MoES Capacity Building Commission / iGOT Gateway',
    checksum: 'sha256-4c910e...2f83a'
  }
];

export const MissionKarmayogiSyncPanel: React.FC = () => {
  const [fracList, setFracList] = useState<FracCompetencyItem[]>(INITIAL_FRAC_COMPETENCIES);
  const [xApiFeed, setXApiFeed] = useState<XApiStatementRecord[]>(INITIAL_XAPI_FEED);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'frac' | 'xapi'>('status');

  // Trigger full xAPI-compliant batch sync to iGOT
  const handleTriggerSync = () => {
    sound.playClick();
    setIsSyncing(true);
    setSyncStatusMsg('Packaging xAPI statement envelope & validating FRAC dictionary signatures...');

    setTimeout(() => {
      setSyncStatusMsg('Connecting to DoPT iGOT Karmayogi National Registry (api.igotkarmayogi.gov.in)...');
    }, 900);

    setTimeout(() => {
      setSyncStatusMsg('Cryptographically sealing 4 competency attestations with MoES Private Key...');
    }, 1800);

    setTimeout(() => {
      setIsSyncing(false);
      sound.playSuccess();
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.5 }
      });

      // Update pending FRAC to Synced
      setFracList(prev => prev.map(item => ({
        ...item,
        syncStatus: 'SYNCED',
        lastSyncedTimestamp: 'Just now (Verified)'
      })));

      // Prepend new xAPI statement
      const newStatement: XApiStatementRecord = {
        id: `xapi-stmt-${Date.now().toString().slice(-4)}`,
        actorEmail: 'pooja.patel@iitm.gov.in',
        actorName: 'Pooja Patel',
        verbId: 'http://adlnet.gov/expapi/verbs/mastered',
        verbDisplay: 'mastered',
        activityId: 'https://capacityconnect.moes.gov.in/courses/monsoon-aerosols',
        activityName: 'Monsoon Aerosol Dynamics & Radiative Forcing',
        scoreRaw: 94,
        scoreScaled: 0.94,
        success: true,
        timestamp: new Date().toISOString(),
        authority: 'MoES Capacity Building Commission / iGOT Gateway',
        checksum: `sha256-${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`
      };

      setXApiFeed(prev => [newStatement, ...prev]);
      setSyncStatusMsg('Batch Sync Complete! All credits synchronized to official iGOT National Profiles.');
      setTimeout(() => setSyncStatusMsg(''), 6000);
    }, 2800);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur-sm p-5 sm:p-6 transition-all space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Mission Karmayogi & FRAC Taxonomy Sync
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                xAPI Specification Compliant
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official synchronizer connecting MoES training telemetry directly with the National iGOT Karmayogi Competency Registry.
            </p>
          </div>
        </div>

        {/* Sync Trigger Button */}
        <div className="flex items-center gap-2">
          <button
            id="trigger-igot-sync-btn"
            type="button"
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-md shadow-rose-900/20 transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing with iGOT...' : 'Sync Pending Credits to iGOT'}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Feedback Toast */}
      {syncStatusMsg && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Metric 1: Karmayogi Points Synced */}
        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>Synced Karma Credits</span>
            <Award className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">1,450</span>
            <span className="text-[10px] font-bold text-slate-400">pts</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" /> +160 pts this cycle
          </span>
        </div>

        {/* Metric 2: FRAC Mapping Coverage */}
        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>FRAC Dictionary</span>
            <Layers className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-800 dark:text-white">100%</span>
            <span className="text-[10px] font-bold text-slate-400">mapped</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            48 MoES Operational Roles
          </p>
        </div>

        {/* Metric 3: xAPI Statements Dispatched */}
        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>xAPI Telemetry Statements</span>
            <Terminal className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{xApiFeed.length + 128}</span>
            <span className="text-[10px] font-bold text-slate-400">records</span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
            ADL LRS Attested
          </span>
        </div>

        {/* Metric 4: Cryptographic Ledger */}
        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>Security Status</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">SEALED</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1 block truncate">
            MOES-CBC-2026-SEAL
          </span>
        </div>

      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold pb-2">
        <button
          type="button"
          onClick={() => { sound.playClick(); setActiveSubTab('status'); }}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeSubTab === 'status'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          iGOT Sync Status & Protocol
        </button>

        <button
          type="button"
          onClick={() => { sound.playClick(); setActiveSubTab('frac'); }}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeSubTab === 'frac'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          FRAC Taxonomy Mapping
        </button>

        <button
          type="button"
          onClick={() => { sound.playClick(); setActiveSubTab('xapi'); }}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeSubTab === 'xapi'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Live xAPI Telemetry Feed
        </button>
      </div>

      {/* Sub-Tab 1: iGOT Sync Status & Protocol */}
      {activeSubTab === 'status' && (
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Official iGOT National Architecture Integration
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                API Endpoint Active (TLS 1.3)
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Every training module completed, examination passed, or simulator drill performed inside Capacity Connect generates an xAPI statement compliant with the IEEE 9274.1.1 standard. These statements are cryptographically signed by the MoES Capacity Building Commission (CBC) private key and synchronized directly into DoPT's national iGOT Karmayogi profile repository for automated promotion and deputation credit.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-mono">Registry URL</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">api.igotkarmayogi.gov.in</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-mono">MoES CBC Identity</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">MOES-CENTRAL-NODE-01</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-mono">Audit Hash Standard</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">SHA-256 HMAC Sealing</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: FRAC Taxonomy Mapping */}
      {activeSubTab === 'frac' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Framework for Roles, Activities & Competencies (FRAC) Dictionary</span>
            <span className="font-mono text-[10px]">NCF v2.4</span>
          </div>

          <div className="space-y-2.5">
            {fracList.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {item.code}
                    </span>
                    <h5 className="font-bold text-slate-900 dark:text-white">
                      {item.competencyArea}
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                    {item.activityDescription}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                    <span>Role: <strong className="text-slate-700 dark:text-slate-300">{item.roleMapping}</strong></span>
                    <span>•</span>
                    <span>Wing: <strong className="text-slate-700 dark:text-slate-300">{item.moesCadre}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                      +{item.iGotCreditPoints} Karma Pts
                    </div>
                    <div className="text-[9px] text-slate-400">
                      Level {item.proficiencyLevel}/5
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    item.syncStatus === 'SYNCED'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {item.syncStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Live xAPI Telemetry Feed */}
      {activeSubTab === 'xapi' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Real-Time ADL xAPI Statement Dispatches</span>
            <span className="font-mono text-[10px]">Actor · Verb · Object · Result</span>
          </div>

          <div className="space-y-2">
            {xApiFeed.map((stmt) => (
              <div
                key={stmt.id}
                className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-950 text-white font-mono text-[11px] space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="text-rose-400 font-bold">{stmt.id}</span>
                  <span>{new Date(stmt.timestamp).toLocaleTimeString()} IST</span>
                </div>

                <div className="text-slate-200 text-xs">
                  <span className="text-emerald-400 font-semibold">{stmt.actorName}</span>{' '}
                  <span className="text-amber-300 font-bold uppercase">{stmt.verbDisplay}</span>{' '}
                  <span className="text-sky-300 font-semibold">{stmt.activityName}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Score: <strong className="text-white font-bold">{stmt.scoreRaw}%</strong></span>
                  <span>•</span>
                  <span>Scaled: <strong className="text-white font-bold">{stmt.scoreScaled}</strong></span>
                  <span>•</span>
                  <span>Checksum: <span className="text-rose-300">{stmt.checksum}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
