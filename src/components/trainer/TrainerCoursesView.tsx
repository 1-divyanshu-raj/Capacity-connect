import React, { useState } from 'react';
import { safeImageUrl } from '../../lib/security';
import { Course } from '../../types';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Award, 
  Search, 
  Filter, 
  GraduationCap, 
  FileText, 
  CheckCircle2, 
  TrendingUp,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface TrainerCoursesViewProps {
  courses: Course[];
}

export const TrainerCoursesView: React.FC<TrainerCoursesViewProps> = ({ courses }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<Course | null>(null);

  const departments = ['All', 'IMD New Delhi', 'INCOIS Hyderabad', 'IITM Pune', 'NCMRWF Noida', 'NCPOR Goa'];

  const filteredCourses = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'All' || c.department.includes(selectedDept.split(' ')[0]);
    return matchesSearch && matchesDept;
  });

  const totalEnrolled = courses.reduce((sum, c) => sum + c.enrolledCount, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="liquid-glass-accent rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-200 dark:border-slate-800">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800">
            <GraduationCap className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Faculty Curricular Command</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Instructional Modules & Supervised Syllabi
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Manage course content, review enrollment rosters, monitor module completion ratios, and review syllabus alignment with the National Monsoon Mission and WMO competency guidelines.
          </p>
        </div>

        {/* Aggregate Stats */}
        <div className="flex items-center gap-4 bg-white/90 dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm shrink-0">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total Curricula</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{courses.length} Modules</span>
          </div>
          <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Active Trainees</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{totalEnrolled.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="liquid-glass rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search faculty modules by title, topic, or institute..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.slice(0, 4000))}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
            maxLength={4000}
            />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedDept === dept
                  ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="liquid-glass-card rounded-3xl overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-rose-400 dark:hover:border-rose-500 transition duration-200 group border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90"
          >
            {/* Header image */}
            <div className="relative h-44 overflow-hidden bg-slate-900">
              <img
                src={safeImageUrl(course.thumbnail)}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
              
              <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-rose-300 border border-white/20">
                {course.category}
              </span>

              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block">
                  {course.department}
                </span>
                <h3 className="font-extrabold text-sm sm:text-base leading-snug line-clamp-2 text-white">
                  {course.title}
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {course.description}
              </p>

              {/* Trainee Enrollment & Metric Badge */}
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Trainees</span>
                  <strong className="text-rose-600 dark:text-rose-400 font-mono">{course.enrolledCount}</strong>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Duration</span>
                  <strong className="text-slate-800 dark:text-slate-200">{course.durationWeeks} Wks</strong>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Lectures</span>
                  <strong className="text-slate-800 dark:text-slate-200">{course.totalLectures} Units</strong>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setSelectedCourseForDetail(course)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-rose-600 hover:bg-rose-700 dark:hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Inspect Syllabus & Roster</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Course Detail Modal */}
      {selectedCourseForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-700 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                  {selectedCourseForDetail.category} &bull; {selectedCourseForDetail.department}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
                  {selectedCourseForDetail.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourseForDetail(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedCourseForDetail.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Enrolled Candidates</span>
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{selectedCourseForDetail.enrolledCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Duration</span>
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{selectedCourseForDetail.durationWeeks} Weeks</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Total Units</span>
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{selectedCourseForDetail.totalLectures} Lectures</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Clearance Level</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">{selectedCourseForDetail.level}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Curriculum Modules & Laboratory Work:</h4>
              <div className="space-y-2">
                {selectedCourseForDetail.modules.map((mod, idx) => (
                  <div key={mod.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{mod.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{mod.duration}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedCourseForDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 dark:hover:bg-rose-500 transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
