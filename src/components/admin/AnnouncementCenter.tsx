import React, { useState } from 'react';
import { Announcement } from '../../types';
import { 
  Bell, 
  Megaphone, 
  Plus, 
  Trash2, 
  Pin, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Calendar,
  Send
} from 'lucide-react';

interface AnnouncementCenterProps {
  announcements: Announcement[];
  onAddAnnouncement: (announcement: Announcement) => void;
  onTogglePin: (id: string) => void;
  onDeleteAnnouncement: (id: string) => void;
}

export const AnnouncementCenter: React.FC<AnnouncementCenterProps> = ({
  announcements,
  onAddAnnouncement,
  onTogglePin,
  onDeleteAnnouncement,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [isPinned, setIsPinned] = useState(true);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newAnnouncement: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      date: 'Just Now',
      publisher: 'MoES Capacity Building HQ',
      category: priority,
      publishedDate: 'Just Now',
      priority,
      author: 'MoES Capacity Building HQ',
      isPinned,
    };

    onAddAnnouncement(newAnnouncement);
    setTitle('');
    setContent('');
    alert('National announcement broadcasted and updated across all trainee & trainer dashboards!');
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">Urgent Flash</span>;
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">High Priority</span>;
      case 'medium':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">General Notice</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Advisory</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="liquid-glass-accent rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80">
        <div className="space-y-1.5 max-w-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
            National Broadcast Dispatch
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            MoES Announcement & Notification Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Publish official Ministry directives, examination schedules, severe weather operational protocols, and capacity training deadlines. Pinned notices appear in real-time on all portal headers.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-700/80 border border-slate-200/80 dark:border-slate-600 shadow-sm shrink-0 flex items-center gap-3">
          <Megaphone className="w-6 h-6 text-rose-700 dark:text-rose-400 animate-pulse" />
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Active Broadcasts</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{announcements.length}</span>
          </div>
        </div>
      </div>

      {/* Broadcast Creator Form */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Dispatch New National Announcement
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Instantly visible to all logged-in Scientists, Trainers, and Trainees
            </p>
          </div>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                Notice Title / Subject
              </label>
              <input
                id="announcement-title-input"
                type="text"
                required
                placeholder="e.g., Mandatory Dual-Pol Radar Calibration Workshop for April Batch"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs outline-none font-medium"
              >
                <option value="urgent">Urgent Flash (Red)</option>
                <option value="high">High Priority (Amber)</option>
                <option value="medium">General Notice (Rose)</option>
                <option value="low">Standard Advisory</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              Notice Content & Technical Guidelines
            </label>
            <textarea
              id="announcement-content-textarea"
              rows={3}
              required
              placeholder="Detail the operational circular, participating centres, submission dates, or web-link..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Pin to Global Navigation Banner (Urgent ticker view)</span>
            </label>

            <button
              id="broadcast-announcement-btn"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-rose-600 hover:bg-rose-700 dark:hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Megaphone className="w-4 h-4" />
              <span>Broadcast Announcement</span>
            </button>
          </div>
        </form>
      </div>

      {/* Existing Announcements List */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
          Live Broadcast Log ({announcements.length} Published)
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`liquid-glass-card rounded-2xl p-5 border space-y-3 transition ${
                ann.isPinned 
                  ? 'border-rose-400 dark:border-rose-600 bg-rose-50/30 dark:bg-rose-950/30' 
                  : 'border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getPriorityBadge(ann.priority)}
                    {ann.isPinned && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-700 text-white">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 font-mono">
                      {ann.publishedDate} • {ann.author}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {ann.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onTogglePin(ann.id)}
                    className={`p-2 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                      ann.isPinned
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                        : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white border-slate-200 dark:border-slate-600'
                    }`}
                    title={ann.isPinned ? 'Unpin from header' : 'Pin to header banner'}
                  >
                    <Pin className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteAnnouncement(ann.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition border border-transparent hover:border-red-200 dark:hover:border-red-800 cursor-pointer"
                    title="Delete broadcast"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {ann.content}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
