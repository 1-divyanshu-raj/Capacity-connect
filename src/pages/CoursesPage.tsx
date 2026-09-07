import React, { useState } from 'react';
import { Course, UserProfile } from '../types';
import { Search, Clock, Filter, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

interface CoursesPageProps {
  courses: Course[];
  user: UserProfile;
  onSelectCourse?: (course: Course) => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({ courses, user, onSelectCourse }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(courses.map((c) => c.category)))];

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Scientific Course Curriculum
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Specialized capacity building programs across MoES, IMD, NCMRWF, and INCOIS divisions
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search curriculum, faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white placeholder-slate-400 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
              selectedCategory === cat
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/50">
                  {course.category}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {course.durationWeeks} Weeks ({course.totalLectures} Lectures)
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                {course.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                {course.description}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  {course.instructor.charAt(0)}
                </div>
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate max-w-[130px]">
                  {course.instructor}
                </span>
              </div>

              <button
                onClick={() => onSelectCourse?.(course)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                {course.status === 'Completed' ? 'Review' : 'Continue'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
