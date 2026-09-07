import React, { useRef } from 'react';
import { X, Download, Printer, ShieldCheck, CheckCircle2, QrCode } from 'lucide-react';

interface CertificateModalProps {
  traineeName: string;
  courseTitle: string;
  score: number;
  completedDate: string;
  certificateId: string;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  traineeName,
  courseTitle,
  score,
  completedDate,
  certificateId,
  onClose,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl liquid-glass rounded-3xl border border-white/90 dark:border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[95vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                Official National Competency Certification
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Issued by the Ministry of Earth Sciences (MoES) & India Meteorological Department (IMD)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-rose-600 hover:bg-rose-700 dark:hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Display Card */}
        <div 
          ref={certificateRef}
          className="relative bg-gradient-to-br from-amber-50/90 via-white to-rose-50/90 rounded-2xl border-8 border-double border-amber-500/40 p-8 sm:p-12 text-center space-y-6 shadow-xl overflow-hidden print:border-4 print:p-6 text-slate-900"
        >
          {/* Subtle Watermark MoES Ring */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <div className="w-96 h-96 rounded-full border-[20px] border-slate-900 flex items-center justify-center">
              <span className="text-3xl font-black font-serif">MoES • IMD</span>
            </div>
          </div>

          {/* Government of India Header */}
          <div className="space-y-1 relative z-10">
            <div className="w-16 h-1 bg-gradient-to-r from-orange-500 via-white to-emerald-600 mx-auto rounded mb-3" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-600 block">
              Government of India • Ministry of Earth Sciences
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-serif">
              NATIONAL CAPACITY BUILDING COMMISSION
            </h1>
            <p className="text-xs text-rose-800 font-semibold tracking-wider uppercase">
              India Meteorological Department • INCOIS • NCMRWF • IITM
            </p>
          </div>

          {/* Certificate Title */}
          <div className="py-2 relative z-10">
            <span className="text-xs font-semibold text-slate-500 italic block">
              This is to officially certify that
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight my-2 font-serif underline decoration-amber-400 decoration-2 underline-offset-8">
              {traineeName}
            </h2>
            <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed pt-2">
              has successfully undergone rigorous training and passed the National Subject Evaluation in
            </p>
            <h3 className="text-lg sm:text-xl font-bold text-rose-900 font-serif mt-1">
              "{courseTitle}"
            </h3>
            <p className="text-xs text-slate-600 mt-2">
              achieving an examination score of <strong className="text-emerald-700 font-black text-sm">{score}% (Grade A Distinction)</strong>.
            </p>
          </div>

          {/* Footer Details: Signatures & QR Verification */}
          <div className="pt-8 border-t border-slate-200/80 grid grid-cols-3 items-end text-xs text-slate-600 relative z-10">
            
            {/* Signature 1 */}
            <div className="text-center space-y-1">
              <div className="h-10 flex items-end justify-center">
                <span className="font-serif italic font-bold text-slate-800 text-sm">Dr. Rajeshwar Rao</span>
              </div>
              <div className="w-32 h-px bg-slate-400 mx-auto" />
              <p className="text-[11px] font-bold text-slate-800">Faculty Director</p>
              <p className="text-[10px] text-slate-500">Board of Earth Sciences Studies</p>
            </div>

            {/* QR Verification Seal */}
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-300 p-1 shadow-sm flex items-center justify-center">
                <QrCode className="w-12 h-12 text-slate-800" />
              </div>
              <span className="font-mono text-[9px] text-rose-800 font-bold block">
                ID: {certificateId}
              </span>
              <span className="text-[9px] text-slate-400">
                Issued: {completedDate}
              </span>
            </div>

            {/* Signature 2 */}
            <div className="text-center space-y-1">
              <div className="h-10 flex items-end justify-center">
                <span className="font-serif italic font-bold text-slate-800 text-sm">Dr. Sunita Deshmukh</span>
              </div>
              <div className="w-32 h-px bg-slate-400 mx-auto" />
              <p className="text-[11px] font-bold text-slate-800">Joint Director (MoES HQ)</p>
              <p className="text-[10px] text-slate-500">Capacity Building Commission</p>
            </div>

          </div>

        </div>

        {/* Verification Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Cryptographically sealed and registered in MoES National Trainee Repository
          </span>
          <span className="font-mono text-[11px] text-rose-700 dark:text-rose-400">SIH26075-MOES-VERIFIED</span>
        </div>

      </div>
    </div>
  );
};
