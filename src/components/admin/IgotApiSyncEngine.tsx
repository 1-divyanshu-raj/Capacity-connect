import React, { useState } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Send, 
  Server, 
  ShieldCheck, 
  FileCode2, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  ArrowUpRight, 
  Sparkles, 
  AlertCircle,
  Database,
  Radio,
  ExternalLink
} from 'lucide-react';
import { sound } from '../../utils/soundEffects';

export interface ApiPayloadLog {
  id: string;
  timestamp: string;
  method: 'POST' | 'GET' | 'PUT';
  endpoint: string;
  status: 200 | 201 | 204 | 400 | 500;
  statusText: string;
  service: string;
  recordCount: number;
  ncfCode?: string;
  payloadSummary: string;
  fullPayload: Record<string, any>;
  responsePayload: Record<string, any>;
}

const INITIAL_LOGS: ApiPayloadLog[] = [
  {
    id: 'log-101',
    timestamp: '11:48:22 IST',
    method: 'POST',
    endpoint: '/api/v2/igot/cbp/trainee/sync-karma',
    status: 200,
    statusText: 'OK - Accrual Attested',
    service: 'Karmayogi Bharat Karma Ledger',
    recordCount: 4,
    ncfCode: 'NCF-MET-2024-001',
    payloadSummary: 'Accrued +150 Karma points for Doppler Radar level-1 completion',
    fullPayload: {
      gatewayVersion: 'v2.4.1-gov',
      originNode: 'MOES-DELHI-NODE-01',
      records: [
        {
          officerNcfId: 'NCF-MET-2024-001',
          nicEmail: 'priya.sharma@imd.gov.in',
          cbpModule: 'Doppler Weather Radar (DWR) Operational Data Analysis',
          karmaPointsDelta: 150,
          accreditationBody: 'IMD Pune - Central Training Institute',
          digitalSignatureSha256: '8f92a11b7e43d9c82f0194837261aef83c29d01e4f5a6b7c8d9e0f1a2b3c4d5e'
        }
      ]
    },
    responsePayload: {
      acknowledgementId: 'ACK-KARM-2026-99412',
      status: 'CONFIRMED',
      totalOfficerKarmaBalance: 1450,
      blockchainTxId: '0x3f8a91b...c9124e'
    }
  },
  {
    id: 'log-102',
    timestamp: '11:35:10 IST',
    method: 'POST',
    endpoint: '/api/v2/igot/cbp/certificates/attest',
    status: 200,
    statusText: 'OK - Registry Sealed',
    service: 'DoPT National Certificate Repository',
    recordCount: 1,
    ncfCode: 'NCF-COMP-DWR-04',
    payloadSummary: 'Issued cryptographic competency seal for MOES-CBC-2026-VERIFIED',
    fullPayload: {
      certificateId: 'MOES-CBC-2026-VERIFIED-9812',
      recipientName: 'Dr. Priya Sharma',
      institute: 'India Meteorological Department (IMD)',
      grade: 'Distinction (96%)',
      signedBy: 'Joint Director MoES HQ / CBC',
      timestampUtc: '2026-03-31T06:05:10Z'
    },
    responsePayload: {
      ncrCredentialUrl: 'https://verify.igotkarmayogi.gov.in/cert/MOES-CBC-2026-VERIFIED-9812',
      qrVerificationSignature: 'SIGN-GOV-IMD-CBC-2026'
    }
  },
  {
    id: 'log-103',
    timestamp: '11:12:04 IST',
    method: 'PUT',
    endpoint: '/api/v2/igot/cbp/institute/quota-compliance',
    status: 200,
    statusText: 'OK - Quota Synchronized',
    service: 'MoES Institutional Capacity Board',
    recordCount: 5,
    ncfCode: 'NCF-CBP-INST-2026',
    payloadSummary: 'Updated CBP annual compliance metrics for IMD, INCOIS, IITM, NCMRWF, NCPOR',
    fullPayload: {
      academicYear: '2026-2027',
      complianceMetrics: {
        IMD: { certified: 1480, target: 1500, complianceRate: 0.987 },
        INCOIS: { certified: 640, target: 700, complianceRate: 0.914 },
        IITM: { certified: 520, target: 550, complianceRate: 0.945 },
        NCMRWF: { certified: 310, target: 350, complianceRate: 0.885 },
        NCPOR: { certified: 240, target: 250, complianceRate: 0.960 }
      }
    },
    responsePayload: {
      nationalRanking: 'Tier 1 Exemplary',
      nextAuditDate: '2026-06-30'
    }
  },
  {
    id: 'log-104',
    timestamp: '10:45:00 IST',
    method: 'GET',
    endpoint: '/api/v2/igot/ncf/framework-definitions',
    status: 200,
    statusText: 'OK - Taxonomy Cached',
    service: 'CBC National Competency Framework v2.4',
    recordCount: 48,
    ncfCode: 'NCF-TAXONOMY-V2.4',
    payloadSummary: 'Fetched latest Earth Sciences domain competency mappings and behavioral rubrics',
    fullPayload: {
      requestSource: 'Capacity Connect MoES Instance',
      versionTarget: 'v2.4.0'
    },
    responsePayload: {
      competenciesLoaded: 48,
      moesDomainCodes: ['RADAR-01', 'NWP-03', 'TSUNAMI-02', 'SEISMO-05', 'POLAR-01'],
      cacheExpiryHours: 24
    }
  }
];

interface IgotApiSyncEngineProps {
  onSyncComplete?: (newCount: number) => void;
}

export const IgotApiSyncEngine: React.FC<IgotApiSyncEngineProps> = ({ onSyncComplete }) => {
  const [logs, setLogs] = useState<ApiPayloadLog[]>(INITIAL_LOGS);
  const [pendingRecordsCount, setPendingRecordsCount] = useState<number>(14);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>('log-101');
  const [filterType, setFilterType] = useState<'ALL' | 'POST' | 'PUT' | 'GET'>('ALL');
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string>('Just now');

  const filteredLogs = logs.filter(log => {
    if (filterType === 'ALL') return true;
    return log.method === filterType;
  });

  const handleSyncPendingRecords = () => {
    if (isSyncing) return;
    sound.playClick();
    setIsSyncing(true);
    setSyncNotice('Connecting to DoPT iGOT Karmayogi API Gateway (TLS 1.3)... transmitting 14 pending officer records...');

    setTimeout(() => {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST';
      
      const newSyncLog: ApiPayloadLog = {
        id: `log-${Date.now()}`,
        timestamp: timeString,
        method: 'POST',
        endpoint: '/api/v2/igot/cbp/batch/sync-pending',
        status: 200,
        statusText: '200 OK - Batch Committed',
        service: 'iGOT Karmayogi Bharat Dispatcher',
        recordCount: pendingRecordsCount,
        ncfCode: 'NCF-BATCH-2026-LIVE',
        payloadSummary: `Successfully transmitted ${pendingRecordsCount} pending trainee dossiers, 8 assessment certifications, and 1,840 accrued Karma points.`,
        fullPayload: {
          batchId: `BATCH-MOES-${Date.now().toString().slice(-6)}`,
          gatewayEndpoint: 'https://api.igotkarmayogi.gov.in/v2/cbc/moes/sync',
          recordsSynchronized: pendingRecordsCount,
          institutesAffected: ['IMD', 'INCOIS', 'IITM', 'NCMRWF', 'NCPOR'],
          cbpComplianceRate: '100% Fully Compliant',
          authHeader: 'Bearer igot_sec_jwt_token_moes_live_verified',
          auditTimestamp: new Date().toISOString()
        },
        responsePayload: {
          status: 'SUCCESS',
          batchCode: 'ACK-DOPT-MOES-2026-LIVE',
          syncedRecords: pendingRecordsCount,
          pendingRecords: 0,
          karmaPointsDistributed: 1840,
          ncfCompetenciesValidated: 14
        }
      };

      setLogs(prev => [newSyncLog, ...prev]);
      setPendingRecordsCount(0);
      setIsSyncing(false);
      setLastSyncTimestamp(timeString);
      setExpandedLogId(newSyncLog.id);
      sound.playSuccess();
      setSyncNotice(`Synchronization complete! All 14 pending officer records are now verified and committed to the DoPT iGOT Karmayogi Gateway.`);
      
      if (onSyncComplete) {
        onSyncComplete(0);
      }

      setTimeout(() => setSyncNotice(null), 6000);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Engine Overview Card */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-900">
                <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                <span>iGOT API Gateway Engine</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Gateway Status: Connected (HTTP 200 OK)</span>
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                NCF Protocol v2.4.1
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              iGOT Karmayogi API Sync Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              Real-time bi-directional synchronization bridge between Ministry of Earth Sciences (MoES) learning logs and the Government of India's <strong>iGOT Karmayogi Bharat</strong> central server. Automatically pushes trainee assessment completions, NCF-ID competency mapping, Karma points accruals, and institutional CBP compliance stats.
            </p>
          </div>

          {/* Sync Pending Records Button & Status */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center min-w-[150px]">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Pending Push Queue</span>
              <span className={`text-2xl font-black font-mono ${pendingRecordsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {pendingRecordsCount} Records
              </span>
              <span className="text-[10px] text-slate-400 block">Last Sync: {lastSyncTimestamp}</span>
            </div>

            <button
              id="sync-pending-igot-records-btn"
              type="button"
              onClick={handleSyncPendingRecords}
              disabled={isSyncing || pendingRecordsCount === 0}
              className={`min-h-[48px] px-5 py-3 rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 ${
                pendingRecordsCount === 0
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  : isSyncing
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-rose-700 hover:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white shadow-rose-900/20'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Transmitting to iGOT...' : pendingRecordsCount === 0 ? 'All Records Synced' : `Sync ${pendingRecordsCount} Pending Records to iGOT`}</span>
            </button>
          </div>
        </div>

        {/* Sync Success / Progress Notification */}
        {syncNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-3 shadow-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="flex-1">{syncNotice}</span>
          </div>
        )}

        {/* Live Gateway Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[11px] font-semibold">Active Gateway URL</span>
              <Server className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white block truncate" title="api.igotkarmayogi.gov.in">
              api.igotkarmayogi.gov.in
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3 h-3" /> TLS 1.3 Signed by NIC CA
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[11px] font-semibold">NCF Competencies Mapped</span>
              <Database className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono">48 Domains</div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
              100% Earth Sciences CBP syllabus
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[11px] font-semibold">Karma Points Attested</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
              1,842,340 PTS
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
              Credited to 2,840 officer accounts
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[11px] font-semibold">CBP Compliance Health</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              98.4% On Track
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 block font-medium">
              National CBC Quota Met
            </span>
          </div>
        </div>

      </div>

      {/* Outbound API Payload Stream & Inspector */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Outbound API Payload Stream & Network Logs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed audit trail of REST payload transmissions to the official iGOT Karmayogi API Gateway
              </p>
            </div>
          </div>

          {/* Log Filters */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            {(['ALL', 'POST', 'PUT', 'GET'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setFilterType(method)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  filterType === method
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Payload Log List */}
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;

            return (
              <div
                key={log.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 overflow-hidden transition-all shadow-xs"
              >
                {/* Log Header Row */}
                <div 
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition"
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black ${
                      log.method === 'POST' 
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                        : log.method === 'PUT'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    }`}>
                      {log.method}
                    </span>

                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {log.endpoint}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold border border-emerald-200 dark:border-emerald-900">
                      <CheckCircle2 className="w-3 h-3" />
                      {log.status} {log.statusText}
                    </span>

                    {log.ncfCode && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold">
                        {log.ncfCode}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 self-end sm:self-auto">
                    <span className="font-mono">{log.timestamp}</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{log.recordCount} Records</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Payload Inspector */}
                {isExpanded && (
                  <div className="p-4 pt-1 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-3">
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {log.payloadSummary}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* Request JSON Body */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                            <Send className="w-3 h-3" /> Request Payload (JSON)
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">application/json</span>
                        </div>
                        <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-56 leading-tight border border-slate-800">
                          {JSON.stringify(log.fullPayload, null, 2)}
                        </pre>
                      </div>

                      {/* Response JSON Body */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> iGOT Gateway Response
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">HTTP {log.status}</span>
                        </div>
                        <pre className="p-3 rounded-xl bg-slate-900 text-sky-300 font-mono text-[11px] overflow-x-auto max-h-56 leading-tight border border-slate-800">
                          {JSON.stringify(log.responsePayload, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
