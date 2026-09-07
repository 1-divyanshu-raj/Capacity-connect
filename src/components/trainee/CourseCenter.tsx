import React, { useState } from 'react';
import { Course } from '../../types';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  Award, 
  Play, 
  CheckCircle,
  Radio,
  Compass,
  GraduationCap,
  Sparkles
} from 'lucide-react';

interface CourseCenterProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  onTakeAssessment: (assessmentId: string) => void;
}

export const CourseCenter: React.FC<CourseCenterProps> = ({ 
  courses, 
  onSelectCourse,
  onTakeAssessment 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'Radar Meteorology',
    'Seismology & Tsunami',
    'NWP Modeling',
    'Ocean-Atmosphere',
    'Agrometeorology',
    'Polar Sciences',
  ];

  const filteredCourses = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="liquid-glass-accent rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-200 dark:border-slate-800">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800">
            <Radio className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 animate-pulse" />
            <span>National Earth Sciences Training Modules</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Curated MoES Capacity Building Catalog
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Standardized operational curricula developed by IMD, NCMRWF, INCOIS, IITM, and NCPOR for probationary meteorologists and researchers.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-4 bg-white/90 dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm shrink-0">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Available Modules</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{courses.length}</span>
          </div>
          <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Enrolled Count</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {courses.reduce((acc, curr) => acc + curr.enrolledCount, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="liquid-glass rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border border-slate-200 dark:border-slate-700">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            id="course-search-input"
            type="text"
            placeholder="Search modules by topic (Radar, WRF, Seismology, Tsunami, Cryosphere)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
          />
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-rose-700 dark:bg-rose-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="liquid-glass-card rounded-3xl overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-rose-400 dark:hover:border-rose-500 transition duration-200 group border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90"
          >
            {/* Thumbnail Header */}
            <div className="relative h-48 overflow-hidden bg-slate-900">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              
              {/* Category Badge */}
              <span className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-rose-300 border border-white/20">
                {course.category}
              </span>

              {/* Status Badge */}
              <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                course.status === 'Completed' 
                  ? 'bg-emerald-500 text-white border-emerald-400' 
                  : course.status === 'In Progress'
                  ? 'bg-amber-500 text-white border-amber-400'
                  : 'bg-slate-800/80 text-slate-200 border-white/20'
              }`}>
                {course.status}
              </span>

              {/* Bottom overlay info */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-rose-300 block">
                  {course.department}
                </span>
                <h3 className="font-extrabold text-sm sm:text-base leading-snug line-clamp-2 text-white">
                  {course.title}
                </h3>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                {course.description}
              </p>

              {/* iGOT Alignment & NCF-ID Badge Row */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span 
                  className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  title="National Competency Framework Identifier"
                >
                  <span className="text-slate-400 font-normal">NCF-ID:</span>
                  <span className="text-rose-700 dark:text-rose-400 font-bold">{course.ncfId || 'NCF-MOES-2024-042'}</span>
                </span>

                <span 
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-700/80 text-amber-800 dark:text-amber-300"
                  title="iGOT Karmayogi Points credited on completion"
                >
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                  <span>+{course.igotKarmaPoints || 120} Karma Pts</span>
                </span>

                <span 
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/80 dark:border-emerald-700/80 text-emerald-800 dark:text-emerald-300"
                  title="Verified compliant with iGOT Karmayogi standards"
                >
                  <Award className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>iGOT Aligned</span>
                </span>
              </div>

              {/* Progress Bar if started */}
              {course.progress > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    <span>Course Progress</span>
                    <span className="font-mono text-rose-700 dark:text-rose-400 font-bold">{course.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-rose-600"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Meta Tags */}
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Duration</span>
                  <strong className="text-slate-800 dark:text-slate-200">{course.durationWeeks} Wks</strong>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Lectures</span>
                  <strong className="text-slate-800 dark:text-slate-200">{course.totalLectures}</strong>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Level</span>
                  <strong className="text-rose-700 dark:text-rose-400">{course.level}</strong>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => onSelectCourse(course)}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-900 dark:bg-rose-600 hover:bg-rose-700 dark:hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Open Curriculum</span>
                </button>

                {course.assessmentId && (
                  <button
                    type="button"
                    onClick={() => onTakeAssessment(course.assessmentId!)}
                    title="Take Subject MCQ Assessment"
                    className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center justify-center"
                  >
                    <Award className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
