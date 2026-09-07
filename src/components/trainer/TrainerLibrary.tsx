import React, { useState } from 'react';
import { LibraryResource } from '../../types';
import { 
  Upload, 
  Video, 
  FileText, 
  Presentation, 
  Database, 
  Download, 
  CheckCircle, 
  Plus, 
  Search,
  Filter,
  Trash2,
  ExternalLink
} from 'lucide-react';

interface TrainerLibraryProps {
  resources: LibraryResource[];
  onAddResource: (resource: LibraryResource) => void;
  onDeleteResource: (id: string) => void;
}

export const TrainerLibrary: React.FC<TrainerLibraryProps> = ({
  resources,
  onAddResource,
  onDeleteResource,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'video' | 'pdf' | 'slides' | 'dataset'>('pdf');
  const [subject, setSubject] = useState('Radar Meteorology');
  const [description, setDescription] = useState('');
  const [fileSize, setFileSize] = useState('5.2 MB');
  const [tags, setTags] = useState('Radar, IMD, SOP');

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newRes: LibraryResource = {
      id: `lib-${Date.now()}`,
      title,
      type,
      subject,
      author: 'Dr. Rajeshwar Rao',
      authorInstitute: 'NCMRWF / IMD',
      uploadDate: 'Just Now',
      fileSize: fileSize || '3.4 MB',
      downloadCount: 0,
      description: description || 'Official training resource approved for probationary scientists.',
      tags: tags.split(',').map((t) => t.trim()),
      isApproved: true,
    };

    onAddResource(newRes);
    setShowUploadModal(false);
    setTitle('');
    setDescription('');
    alert('Resource published successfully to Trainee Library!');
  };

  const filtered = resources.filter((r) => {
    const matchesType = filterType === 'all' || r.type === filterType;
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'video':
        return <Video className="w-5 h-5 text-rose-600" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-600" />;
      case 'slides':
        return <Presentation className="w-5 h-5 text-amber-600" />;
      case 'dataset':
        return <Database className="w-5 h-5 text-emerald-600" />;
      default:
        return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="liquid-glass-accent rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-rose-200/80 dark:border-rose-900/50">
        <div className="space-y-1.5 max-w-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
            Official Faculty Repository
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            MoES Trainer Resource Library
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Publish recorded video masterclasses, standard operational manuals (PDFs), presentation decks, and raw NetCDF/GRIB2 radar datasets for national trainees.
          </p>
        </div>

        <button
          id="trainer-upload-new-resource-btn"
          onClick={() => setShowUploadModal(true)}
          className="px-5 py-3 rounded-2xl bg-rose-700 hover:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-900/20 transition flex items-center gap-2 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Upload New Resource</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="liquid-glass rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search resources by title, topic, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['all', 'video', 'pdf', 'slides', 'dataset'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                filterType === t
                  ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {t === 'all' ? 'All Formats' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="liquid-glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 space-y-4 flex flex-col justify-between hover:border-rose-300 dark:hover:border-rose-700 transition shadow-sm"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                    {getTypeIcon(item.type)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900">
                      {item.subject}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug mt-1">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteResource(item.id)}
                  className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                  title="Remove resource"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="space-x-2">
                <span>Size: <strong className="text-slate-700 dark:text-slate-200 font-mono">{item.fileSize}</strong></span>
                <span>•</span>
                <span>Downloads: <strong className="text-rose-700 dark:text-rose-400 font-mono">{item.downloadCount}</strong></span>
              </div>

              <button
                onClick={() => alert(`Initiating secure download of "${item.title}" (${item.fileSize})`)}
                className="flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Resource</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl liquid-glass rounded-3xl border border-white/90 dark:border-slate-700 shadow-2xl p-6 sm:p-8 space-y-5 bg-white/95 dark:bg-slate-900/95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Upload New Training Resource
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Resource Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Masterclass on Polarimetric Radar Dual-Pol Variables"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Format Type
                  </label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="video">Recorded Video Lecture (MP4)</option>
                    <option value="pdf">Manual / Technical Note (PDF)</option>
                    <option value="slides">Presentation Slides (PPTX/PDF)</option>
                    <option value="dataset">Gridded Benchmark Dataset (NetCDF)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Subject Domain
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="Radar Meteorology">Radar Meteorology</option>
                    <option value="Numerical Weather Prediction">Numerical Weather Prediction</option>
                    <option value="Seismology & Tsunami">Seismology & Tsunami</option>
                    <option value="Ocean-Atmosphere Dynamics">Ocean-Atmosphere Dynamics</option>
                    <option value="Agrometeorology">Agrometeorology</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Description & Learning Objectives
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly explain the contents, methodology, and prerequisites..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    File Size Estimate
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 12.4 MB"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Radar, IMD, SOP"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  id="trainer-submit-upload-btn"
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-md transition"
                >
                  Publish Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
