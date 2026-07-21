'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Sun, Moon, Flame, Clock, Zap, BookOpen, MessageSquare, HelpCircle } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { CourseCard } from '@/components/CourseCard';
import { ResourceUploader } from '@/components/ResourceUploader';

// Hardcoded for web demo setup
const supabase = createClient(
  'https://gftrjvljhtqkercsiskp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHJqdmxqaHRxa2VyY3Npc2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTQ4NTUsImV4cCI6MjEwMDE5MDg1NX0.hWY-QP3Ulb1uJPBhuSGCZo07tJr1aXm7GhXalX03uIs'
);

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeCourses, setActiveCourses] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Fallback demo user if no auth session exists yet
      const mockUserId = session?.user?.id || 'demo-user-id';
      const demoUser = {
        id: mockUserId,
        full_name: 'Alex Johnson',
        level: 14,
        xp_points: 10750,
        study_streak_days: 12
      };
      setUser(demoUser);

      // Fetch dynamic courses
      const { data: courses } = await supabase.from('courses').select('*').eq('user_id', mockUserId).limit(4);
      
      // Fallback courses to render UI if DB is empty
      setActiveCourses(courses?.length ? courses : [
        { id: '1', title: 'Advanced Mathematics', difficulty: 'Math', progress_percentage: 72, estimated_duration: 120 },
        { id: '2', title: 'Physics: Mechanics', difficulty: 'Physics', progress_percentage: 45, estimated_duration: 90 },
        { id: '3', title: 'World History', difficulty: 'History', progress_percentage: 89, estimated_duration: 60 },
        { id: '4', title: 'English Literature', difficulty: 'English', progress_percentage: 31, estimated_duration: 150 }
      ]);
      
      setAnalytics({
        xpToday: 840,
        streak: demoUser.study_streak_days,
        coursesCompleted: 4,
        studyHours: 3.5
      });
    }
    loadDashboardData();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  if (!user || !analytics) return <div className="h-screen w-full flex items-center justify-center font-bold text-slate-400">Loading Dashboard...</div>;

  return (
    <div className={`flex h-screen w-full bg-[#F4F7FE] dark:bg-[#0B1437] transition-colors duration-300 ${theme}`}>
      <Sidebar user={user} /> 
      
      <main className="flex-1 overflow-y-auto p-8 font-sans">
        <header className="flex justify-between items-center mb-10">
          <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              Good morning, {user.full_name.split(' ')[0]}! <span className="text-3xl">👋</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white dark:bg-[#111C44] px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-800">
              <Flame className="text-orange-500 w-5 h-5 mr-2" />
              <span className="font-bold text-slate-800 dark:text-white">{analytics.streak}</span>
              <span className="text-xs text-gray-500 ml-1 uppercase">Day Streak</span>
            </div>
            <button onClick={toggleTheme} className="flex items-center bg-white dark:bg-[#111C44] px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1A2A6C] transition">
              {theme === 'light' ? <Moon className="w-5 h-5 mr-2" /> : <Sun className="w-5 h-5 mr-2 text-yellow-400" />}
              <span className="font-semibold text-slate-800 dark:text-white">{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-4 gap-6 mb-10">
          <AnalyticsCard title="XP Earned Today" value={`${analytics.xpToday} XP`} icon={<Zap className="w-6 h-6 text-indigo-500" />} bg="bg-indigo-50 dark:bg-indigo-900/20" />
          <AnalyticsCard title="Study Streak" value={`${analytics.streak} days`} icon={<Flame className="w-6 h-6 text-orange-500" />} bg="bg-orange-50 dark:bg-orange-900/20" />
          <AnalyticsCard title="Courses Completed" value={analytics.coursesCompleted.toString()} icon={<BookOpen className="w-6 h-6 text-pink-500" />} bg="bg-pink-50 dark:bg-pink-900/20" />
          <AnalyticsCard title="Study Hours" value={`${analytics.studyHours} h`} icon={<Clock className="w-6 h-6 text-emerald-500" />} bg="bg-emerald-50 dark:bg-emerald-900/20" />
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Active Courses</h2>
              <button className="text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-full text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition">
                View All &rarr;
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {activeCourses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>

          <div className="col-span-1 space-y-6">
            <div className="bg-white dark:bg-[#111C44] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Learning Assistant</h3>
                <MessageSquare className="text-indigo-500 w-5 h-5" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Ask questions about your uploaded PDFs.</p>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-500/30">
                Open AI Chat &rarr;
              </button>
            </div>

            <div className="bg-white dark:bg-[#111C44] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Quiz Generator</h3>
                <HelpCircle className="text-pink-500 w-5 h-5" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Test your knowledge based on your materials.</p>
              <button className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-pink-500/30">
                Generate Quiz &rarr;
              </button>
            </div>
          </div>
        </div>

        <section className="mt-12 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wide">My Resources</h2>
          <div className="bg-white dark:bg-[#111C44] rounded-3xl p-8 shadow-sm border border-dashed border-indigo-300 dark:border-indigo-700/50 flex flex-col items-center justify-center text-center">
             <ResourceUploader />
          </div>
        </section>
      </main>
    </div>
  );
}

function AnalyticsCard({ title, value, icon, bg }: { title: string, value: string, icon: React.ReactNode, bg: string }) {
  return (
    <div className="bg-white dark:bg-[#111C44] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
        <div className={`p-3 rounded-2xl ${bg}`}>{icon}</div>
      </div>
      <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{value}</h3>
    </div>
  );
}
