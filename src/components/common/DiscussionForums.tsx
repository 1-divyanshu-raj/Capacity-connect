import React, { useState } from 'react';
import { DiscussionTopic, DiscussionReply, UserProfile } from '../../types';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Sparkles, 
  Send, 
  User, 
  Building2, 
  Clock, 
  Check, 
  Tag, 
  HelpCircle,
  Award,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { sound } from '../../utils/soundEffects';

interface DiscussionForumsProps {
  currentUser: UserProfile;
}

const INITIAL_TOPICS: DiscussionTopic[] = [
  {
    id: 'topic-1',
    title: 'Dual-Polarization Doppler Radar: Resolving velocity de-aliasing ambiguities during severe squall lines',
    author: 'Dr. Priya Sharma',
    authorRole: 'trainee',
    authorInstitute: 'India Meteorological Department (IMD Delhi HQ)',
    category: 'Radar Meteorology',
    content: 'While analyzing C-band Doppler Weather Radar volumetric sweeps during the recent pre-monsoon squall line over NCR, Nyquist velocity folded at +/- 32 m/s. Which de-aliasing algorithm in the IMD GIS toolkit gives minimal phase discontinuities in heavy ground clutter zones?',
    createdAt: '2 hours ago',
    repliesCount: 2,
    isResolved: true,
    ncfCompetencyCode: 'NCF-MET-2024-001',
    karmaPointsReward: 30,
    replies: [
      {
        id: 'reply-1-1',
        author: 'Dr. Rajeshwar Rao',
        authorRole: 'trainer',
        authorInstitute: 'Central Training Institute, IMD Pune',
        content: 'Use the 4D Variational De-aliasing module with environmental wind sounding constraints from the Safdarjung 00 UTC pilot balloon data. Ensure ground clutter filters have notch width >= 0.8 m/s prior to phase unwrapping.',
        createdAt: '1 hour ago',
        isFacultyVerified: true,
        karmaPointsAwarded: 25
      },
      {
        id: 'reply-1-2',
        author: 'Arun Kumar',
        authorRole: 'trainee',
        authorInstitute: 'IMD Coastal Radar Station Kolkata',
        content: 'Confirmed! We tested this on the Kolkata S-band radar with 98.4% velocity recovery across rain bands.',
        createdAt: '30 mins ago'
      }
    ]
  },
  {
    id: 'topic-2',
    title: 'INCOIS Bottom Pressure Recorder (BPR) acoustic telemetry signal-to-noise ratio optimization',
    author: 'Sunil Nair',
    authorRole: 'trainee',
    authorInstitute: 'INCOIS Hyderabad',
    category: 'Ocean Telemetry & Tsunamis',
    content: 'When transmitting deep-ocean tsunami pressure perturbation records at 4,200m depth in the Bay of Bengal, the surface buoy encounters packet drops in sea state 5. Are there updated acoustic modem frequency hop settings per MoES guidelines?',
    createdAt: '5 hours ago',
    repliesCount: 1,
    isResolved: false,
    ncfCompetencyCode: 'NCF-OCN-TSU-08',
    karmaPointsReward: 40,
    replies: [
      {
        id: 'reply-2-1',
        author: 'Dr. K. S. Venkatesh',
        authorRole: 'trainer',
        authorInstitute: 'INCOIS National Tsunami Warning Centre',
        content: 'Adjust the FSK modem spreading code to Baudot-16 resilient framing and enable ARQ retransmission window with 3.5s timeout. The new firmware is available on the MoES Competency Hub repository.',
        createdAt: '3 hours ago',
        isFacultyVerified: true,
        karmaPointsAwarded: 25
      }
    ]
  },
  {
    id: 'topic-3',
    title: 'NCMRWF Unified Model (NCUM): Boundary layer physics parameterization for western disturbance rainfall',
    author: 'Kavita Joshi',
    authorRole: 'trainee',
    authorInstitute: 'NCMRWF Noida',
    category: 'NWP Modeling',
    content: 'What is the recommended planetary boundary layer (PBL) scheme for high-resolution 4km ensemble forecasts over the Western Himalayas to prevent overestimating snow-melt runoff?',
    createdAt: 'Yesterday',
    repliesCount: 1,
    isResolved: true,
    ncfCompetencyCode: 'NCF-NWP-HPC-02',
    karmaPointsReward: 35,
    replies: [
      {
        id: 'reply-3-1',
        author: 'Dr. Manoj Saxena',
        authorRole: 'trainer',
        authorInstitute: 'IITM Pune',
        content: 'Switch from standard YSU to Mellor-Yamada-Nakanishi-Niino (MYNN3) with local eddy-diffusivity mass flux (EDMF) activation. It maintains realistic sub-grid moisture variance in steep mountain orography.',
        createdAt: '18 hours ago',
        isFacultyVerified: true,
        karmaPointsAwarded: 25
      }
    ]
  },
  {
    id: 'topic-4',
    title: 'How are iGOT Karma Points credited after submitting presentation seminar recordings?',
    author: 'XYZ_trainee',
    authorRole: 'trainee',
    authorInstitute: 'India Meteorological Department (IMD HQ)',
    category: 'iGOT Karma Points & CBP',
    content: 'I submitted my 15-minute Doppler radar case study seminar on the Presentation Upload Center. When does the DoPT iGOT Karmayogi API gateway credit the 120 Karma points to my NCF-ID profile?',
    createdAt: 'Yesterday',
    repliesCount: 1,
    isResolved: true,
    ncfCompetencyCode: 'NCF-CBP-PROC-01',
    karmaPointsReward: 20,
    replies: [
      {
        id: 'reply-4-1',
        author: 'Admin Office',
        authorRole: 'admin',
        authorInstitute: 'MoES Capacity Building Commission HQ',
        content: 'Once the designated faculty supervisor reviews your rubric score (passing threshold >= 70%), the system automatically dispatches an outbound API payload to the iGOT Karmayogi gateway within 15 minutes. You can monitor sync status on your "My iGOT" dossier.',
        createdAt: '22 hours ago',
        isFacultyVerified: true,
        karmaPointsAwarded: 25
      }
    ]
  }
];

export const DiscussionForums: React.FC<DiscussionForumsProps> = ({ currentUser }) => {
  const [topics, setTopics] = useState<DiscussionTopic[]>(INITIAL_TOPICS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>('topic-1');
  
  // New Question Modal / Drawer
  const [isAskingQuestion, setIsAskingQuestion] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<DiscussionTopic['category']>('Radar Meteorology');
  const [newContent, setNewContent] = useState<string>('');
  
  // Reply input per topic
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});

  const categories = [
    'All',
    'Radar Meteorology',
    'NWP Modeling',
    'Ocean Telemetry & Tsunamis',
    'Seismology',
    'iGOT Karma Points & CBP'
  ];

  const filteredTopics = topics.filter((t) => {
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesQuery = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.authorInstitute.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    sound.playClick();
    const newTopic: DiscussionTopic = {
      id: `topic-${Date.now()}`,
      title: newTitle.trim(),
      author: currentUser.fullName,
      authorRole: currentUser.role,
      authorInstitute: currentUser.institute,
      category: newCategory,
      content: newContent.trim(),
      createdAt: 'Just now',
      repliesCount: 0,
      isResolved: false,
      ncfCompetencyCode: currentUser.ncfId || 'NCF-COMP-GEN-2026',
      karmaPointsReward: 25,
      replies: []
    };

    setTopics([newTopic, ...topics]);
    setNewTitle('');
    setNewContent('');
    setIsAskingQuestion(false);
    setExpandedTopicId(newTopic.id);
    sound.playSuccess();
  };

  const handleAddReply = (topicId: string) => {
    const text = replyTextMap[topicId]?.trim();
    if (!text) return;

    sound.playClick();
    const newReply: DiscussionReply = {
      id: `reply-${Date.now()}`,
      author: currentUser.fullName,
      authorRole: currentUser.role,
      authorInstitute: currentUser.institute,
      content: text,
      createdAt: 'Just now',
      isFacultyVerified: currentUser.role === 'trainer' || currentUser.role === 'admin',
      karmaPointsAwarded: 25
    };

    setTopics((prev) =>
      prev.map((t) => {
        if (t.id === topicId) {
          return {
            ...t,
            repliesCount: t.repliesCount + 1,
            replies: [...t.replies, newReply]
          };
        }
        return t;
      })
    );

    setReplyTextMap({ ...replyTextMap, [topicId]: '' });
    sound.playSuccess();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-900">
                <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
                <span>iGOT Karmayogi Peer Exchange</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Faculty Moderated</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Discussion Forums
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Official Ministry collaborative scientific forum. Engage in peer-to-peer discussions on atmospheric modeling, Doppler radar meteorology, ocean hazard telemetry, and iGOT Karmayogi CBP competency alignments.
            </p>
          </div>

          <button
            id="start-discussion-topic-btn"
            type="button"
            onClick={() => {
              sound.playClick();
              setIsAskingQuestion(true);
            }}
            className="min-h-[46px] px-5 py-2.5 rounded-2xl bg-rose-700 hover:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Discussion Topic</span>
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              id="discussion-search-input"
              type="text"
              placeholder="Search topics, questions, faculty replies, or NCF codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* New Topic Modal */}
      {isAskingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl liquid-glass rounded-3xl border border-white dark:border-slate-700 shadow-2xl p-6 sm:p-8 bg-white dark:bg-slate-900 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                  <MessageSquare className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Start a New Discussion Forum Topic
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Post a technical query, operational challenge, or CBP question
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAskingQuestion(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Topic Title / Question
                </label>
                <input
                  id="new-topic-title"
                  type="text"
                  required
                  placeholder="e.g. Velocity de-aliasing filter configuration for IMD radar..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Subject Category
                </label>
                <select
                  id="new-topic-category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as DiscussionTopic['category'])}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Radar Meteorology">Radar Meteorology (IMD)</option>
                  <option value="NWP Modeling">NWP Modeling (NCMRWF / IITM)</option>
                  <option value="Ocean Telemetry & Tsunamis">Ocean Telemetry & Tsunamis (INCOIS)</option>
                  <option value="Seismology">Seismology & Geodynamics (NCS)</option>
                  <option value="iGOT Karma Points & CBP">iGOT Karma Points & CBP Compliance</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Detailed Explanation & Context
                </label>
                <textarea
                  id="new-topic-content"
                  required
                  rows={4}
                  placeholder="Describe your technical observations, data parameters, or the specific competency question..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAskingQuestion(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-discussion-topic-btn"
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Publish to Forums (+25 Karma Points)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discussion Topics Feed */}
      <div className="space-y-4">
        {filteredTopics.map((topic) => {
          const isExpanded = expandedTopicId === topic.id;

          return (
            <div
              key={topic.id}
              className="liquid-glass rounded-3xl border border-slate-200/90 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 overflow-hidden shadow-xs transition-all"
            >
              {/* Topic Header Row */}
              <div 
                onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                className="p-6 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                      {topic.category}
                    </span>
                    {topic.isResolved && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                      </span>
                    )}
                    {topic.ncfCompetencyCode && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        NCF: {topic.ncfCompetencyCode}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>+{topic.karmaPointsReward} Karma Points</span>
                  </div>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                  {topic.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {topic.content}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{topic.author}</span>
                    <span>•</span>
                    <span className="text-[11px] truncate max-w-[220px]">{topic.authorInstitute}</span>
                    <span>•</span>
                    <span className="text-[11px]">{topic.createdAt}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 font-bold text-rose-700 dark:text-rose-400">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {topic.replies.length} {topic.replies.length === 1 ? 'Reply' : 'Replies'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>
              </div>

              {/* Expanded Replies Section */}
              {isExpanded && (
                <div className="p-6 pt-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 leading-relaxed shadow-xs">
                    <p className="font-medium">{topic.content}</p>
                  </div>

                  {/* Replies List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
                      <span>Faculty & Peer Responses ({topic.replies.length})</span>
                    </h4>

                    {topic.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 ${
                          reply.isFacultyVerified
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {reply.author}
                            </span>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                              {reply.authorRole}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {reply.authorInstitute}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {reply.isFacultyVerified && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                                <Award className="w-3 h-3" /> Faculty Verified Answer
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">{reply.createdAt}</span>
                          </div>
                        </div>

                        <p className="text-slate-700 dark:text-slate-200">{reply.content}</p>

                        {reply.karmaPointsAwarded && (
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1 pt-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>+{reply.karmaPointsAwarded} Karma Points awarded to author</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Reply Input Box */}
                  <div className="pt-2 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type your technical response or inquiry solution..."
                      value={replyTextMap[topic.id] || ''}
                      onChange={(e) =>
                        setReplyTextMap({ ...replyTextMap, [topic.id]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddReply(topic.id);
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddReply(topic.id)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-rose-600 hover:bg-rose-700 dark:hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
