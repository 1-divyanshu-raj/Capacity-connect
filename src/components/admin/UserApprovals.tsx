import React, { useState } from 'react';
import { PendingApproval } from '../../types';
import { 
  UserCheck, 
  Check, 
  X, 
  ShieldAlert, 
  Building2, 
  Clock, 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface UserApprovalsProps {
  approvals: PendingApproval[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const UserApprovals: React.FC<UserApprovalsProps> = ({
  approvals,
  onApprove,
  onReject,
}) => {
  const [filterRole, setFilterRole] = useState<'all' | 'trainee' | 'trainer'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filtered = approvals.filter((a) => {
    const matchesRole = filterRole === 'all' || a.role === filterRole;
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchesSearch = 
      a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.institute.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesStatus && matchesSearch;
  });

  const pendingCount = approvals.filter((a) => a.status === 'Pending').length;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const displayedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleBulkApprovePending = () => {
    const pendingOnCurrentPage = displayedItems.filter(i => i.status === 'Pending');
    pendingOnCurrentPage.forEach(item => onApprove(item.id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Card */}
      <div className="liquid-glass-accent rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5 max-w-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
            Gov Admin Security Gate
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            User Verification & Access Approvals
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Review onboarding requests across institutes, verify departmental credentials with NIC identity records, and grant Trainee / Trainer operational clearance.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-sm text-center min-w-[150px]">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Pending Clearance</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {pendingCount} of {approvals.length}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Active Requests</span>
          </div>

          {pendingCount > 0 && (
            <button
              type="button"
              onClick={handleBulkApprovePending}
              className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
              title="Approve visible pending requests in one click"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Bulk Approve Visible</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="liquid-glass rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            id="approvals-search-input"
            type="text"
            placeholder="Search candidate by name, email, institute, or designation..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(['all', 'Pending', 'Approved', 'Rejected'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setFilterStatus(s);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  filterStatus === s
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(['all', 'trainee', 'trainer'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setFilterRole(r);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition cursor-pointer ${
                  filterRole === r
                    ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r === 'all' ? 'All Roles' : `${r}s`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Approvals Table */}
      <div className="liquid-glass rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 dark:bg-slate-800 text-white uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-5">Candidate Name</th>
                <th className="py-3.5 px-4">Requested Role</th>
                <th className="py-3.5 px-4">Institute & Designation</th>
                <th className="py-3.5 px-4">Submitted Documents</th>
                <th className="py-3.5 px-4">Requested Date</th>
                <th className="py-3.5 px-4">Clearance Status</th>
                <th className="py-3.5 px-5 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white/80 dark:bg-slate-900/60">
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    No approval requests match the current filters.
                  </td>
                </tr>
              ) : (
                displayedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900 dark:text-white">{item.fullName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{item.email}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.ncfId || 'NCF-MET-APPR'}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-700/80 text-amber-800 dark:text-amber-300">
                          <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                          {item.igotKarmaPoints || 1200} pts
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        item.role === 'trainer'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                      }`}>
                        {item.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{item.institute}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.designation}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{item.submittedDocs}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {item.requestedDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.status === 'Approved'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : item.status === 'Rejected'
                          ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {item.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onApprove(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1 cursor-pointer active:scale-95"
                            title="Grant User Clearance"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1 cursor-pointer active:scale-95"
                            title="Deny Access"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div>
            Showing <strong>{displayedItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to{' '}
            <strong>{Math.min(currentPage * itemsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> personnel
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="font-bold px-2 text-slate-800 dark:text-slate-200">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
