import React, { useState } from 'react';
import { 
  GraduationCap, 
  Search, 
  Award, 
  FileText, 
  ExternalLink, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Bookmark, 
  BookOpen
} from 'lucide-react';
import { MOCK_PERSONNEL_DIRECTORY } from '../../data/mockData';

export const ResearchThesesSupervision: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('All');

  // Find all faculty and trainees with thesis projects
  const thesesList = [
    {
      id: 'th-101',
      title: 'Assimilation of Dual-Polarization Doppler Radar Reflectivity in High-Resolution WRF Models for Urban Flash Flood Forecasting',
      scholarName: 'Dr. (Smt.) Ananya Sen',
      scholarRole: 'Senior Research Fellow (SRF)',
      institute: 'IITM Pune / IMD New Delhi',
      supervisor: 'Dr. Rajeshwar Rao (Primary Supervisor)',
      stage: 'Final Defense Completed',
      defenseDate: 'March 2026',
      publications: 6,
      hIndexImpact: 'Journal of Hydrometeorology (AMS)',
      abstract: 'Investigated dual-pol hydrometeor classification algorithms to improve 0-3h quantitative precipitation forecasting across the Mumbai and Chennai metropolitan regions.',
    },
    {
      id: 'th-102',
      title: 'Deep Ocean Bottom Pressure Anomaly Signatures for Near-Field Indian Ocean Tsunami Wave Height Inversion',
      scholarName: 'Vikramaditya Rathore',
      scholarRole: 'Senior Research Fellow (SRF)',
      institute: 'INCOIS Hyderabad',
      supervisor: 'Dr. Rajeshwar Rao (Co-Guide) & Dr. Srinivasa Kumar',
      stage: 'Synopsis Submitted',
      defenseDate: 'May 2026',
      publications: 4,
      hIndexImpact: 'Geophysical Research Letters (AGU)',
      abstract: 'Developed real-time Kalman filtering for deep ocean DART tsunameter gauges to discriminate between seismic ground displacement and genuine hydrodynamic tsunami waveforms.',
    },
    {
      id: 'th-103',
      title: 'Coupled Ocean-Atmospheric Boundary Layer Dynamics During Bay of Bengal Pre-Monsoon Super Cyclones',
      scholarName: 'Tanvi Deshmukh',
      scholarRole: 'Senior Research Fellow (SRF)',
      institute: 'NCMRWF Noida',
      supervisor: 'Dr. Rajeshwar Rao (Primary Supervisor)',
      stage: 'Experimental Field Validation',
      defenseDate: 'November 2026',
      publications: 3,
      hIndexImpact: 'Quarterly Journal of the Royal Meteorological Society',
      abstract: 'Analyzed eddy covariance air-sea flux measurements collected via Sagar Kanya oceanographic research expeditions during extreme cyclonic genesis.',
    },
    {
      id: 'th-104',
      title: 'Cryospheric Mass Balance Teleconnections in the Antarctic Dronning Maud Land using SAR Polarimetry',
      scholarName: 'Kunal Singhania',
      scholarRole: 'Polar Expeditionary Fellow',
      institute: 'NCPOR Goa (Maitri Base)',
      supervisor: 'Dr. Rajeshwar Rao (Advisory Committee Member)',
      stage: 'Field Data Synthesis',
      defenseDate: 'January 2027',
      publications: 5,
      hIndexImpact: 'The Cryosphere (EGU)',
      abstract: 'Utilized Sentinel-1 and NISAR radar interferometry to calculate grounding line migration rates on Schirmacher Oasis continental outlet glaciers.',
    },
    {
      id: 'th-105',
      title: 'Microphysics Parameterization Sensitivity of Orographic Precipitation along the Western Ghats during Southwest Monsoon',
      scholarName: 'Sanjay Varma',
      scholarRole: 'Scientist / Technical Officer Scholar',
      institute: 'IITM Pune',
      supervisor: 'Dr. Rajeshwar Rao (Primary Supervisor)',
      stage: 'Manuscript Peer Review',
      defenseDate: 'July 2026',
      publications: 4,
      hIndexImpact: 'Atmospheric Chemistry & Physics',
      abstract: 'Employed Mahabaleshwar High Altitude Cloud Physics Laboratory cloud condensation nuclei counter data to calibrate aerosol-cloud droplet interactions.',
    },
    {
      id: 'th-106',
      title: 'Machine Learning Downscaling of Global Ensemble Forecasts for District-Level Extreme Heat Indices',
      scholarName: 'Divya Nair',
      scholarRole: 'Junior Research Fellow (JRF)',
      institute: 'IMD New Delhi',
      supervisor: 'Dr. Rajeshwar Rao (Primary Supervisor)',
      stage: 'Model Training & Verification',
      defenseDate: 'September 2026',
      publications: 2,
      hIndexImpact: 'Weather and Forecasting',
      abstract: 'Trained diffusion models and physics-informed neural networks to downscale 12-km NCMRWF deterministic forecasts to 1-km district hazard grids.',
    }
  ];

  const filtered = thesesList.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.scholarName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.institute.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === 'All' || t.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Banner */}
      <div className="liquid-glass-accent rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-200 dark:border-slate-800">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800">
            <GraduationCap className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Senior Research & PG Fellow Supervision</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Supervised Senior Research & PG Fellow Theses
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Direct tracking of advanced scientific dissertations, publication pipelines, and viva voce defenses under Dr. Rajeshwar Rao's supervision across MoES autonomous institutions.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/90 dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm shrink-0">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Personal Scholars</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">14 Scholars</span>
          </div>
          <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Department Total</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">184+ Theses</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="liquid-glass rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search research theses by title, scholar name, or institute..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Final Defense Completed', 'Synopsis Submitted', 'Experimental Field Validation'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStageFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                stageFilter === st
                  ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Theses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((th) => (
          <div
            key={th.id}
            className="liquid-glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 shadow-sm hover:shadow-lg hover:border-rose-400 dark:hover:border-rose-500 transition duration-200 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                  {th.institute}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-900">
                  {th.stage}
                </span>
              </div>

              <h3 className="font-black text-slate-900 dark:text-white text-base leading-snug">
                {th.title}
              </h3>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{th.scholarName}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">{th.scholarRole}</span>
                </div>
                <div className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                  {th.supervisor}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                {th.abstract}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-[11px]">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <strong>{th.publications} Papers</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Defense: {th.defenseDate}</span>
                </span>
              </div>

              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                {th.hIndexImpact}
              </span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
