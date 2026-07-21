'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Sun, Moon, Flame, Clock, Zap, Trophy, Play } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ResourceUploader } from '@/components/ResourceUploader';

// Initialize with your actual keys
const supabase = createClient(
  'https://gftrjvljhtqkercsiskp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHJqdmxqaHRxa2VyY3Npc2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTQ4NTUsImV4cCI6MjEwMDE5MDg1NX0.hWY-QP3Ulb1uJPBhuSGCZo07tJr1aXm7GhXalX03uIs'
);

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); 
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeCourses, setActiveCourses] = useState<any[]>([]);
  const [greeting, setGreeting] = useState('Good morning');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // 1. Dynamic Time & Greeting Logic
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));

    // Force dark mode on mount for the exact visual match
    document.documentElement.classList.add('dark');

    // 2. Authentication & Data Fetching
    async function loadDashboardData() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const activeUserId = session.user.id;

      // Fetch real authenticated user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUserId)
        .single();

      setUser(profileData);

      // Fetch dynamic courses generated from uploaded PDFs
      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', activeUserId)
        .limit(4);
      
      setActiveCourses(courses || []);
      
      setAnalytics({
        xpToday: 840, // Can be made dynamic via a daily XP tracking table
        streak: profileData?.study_streak_days || 12,
        globalRank: 4, 
        studyHours: 3.5 
      });
    }

    loadDashboardData();

    // Listen for sign-outs
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  if (!user || !analytics) return (
    <div className="h-screen w-full bg-[#0B1437] flex items-center justify-center font-bold text-slate-400">
      Loading Dashboard...
    </div>
  );

  return (
    <div className={`flex h-screen w-full bg-[#F4F7FE] dark:bg-[#0B1437] transition-colors duration-300 ${theme}`}>
      
      <Sidebar user={user} /> 
      
      <main className="flex-1 overflow-y-auto p-8 font-sans">
        
        {/* HEADER */}
        <header className="flex justify-between items-start mb-8">
          <div>
            <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mb-2">
              {currentDate}
            </p>
            <h1 className="text-[32px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2 leading-tight">
              {greeting}, {user.full_name?.split(' ')[0] || 'Student'}! <span className="text-3xl">👋</span>
            </h1>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2">
              You're ranked <span className="text-indigo-500 font-bold">#{analytics.globalRank} globally</span> — push for top 3 today!
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white dark:bg-[#111C44] px-4 py-2.5 rounded-full shadow-sm border border-gray-100 dark:border-gray-800">
              <Flame className="text-orange-500 w-5 h-5 mr-2 fill-orange-500" />
              <span className="font-extrabold text-slate-800 dark:text-white">{analytics.streak}</span>
              <span className="text-[10px] font-bold text-gray-500 ml-1.5 uppercase tracking-wider">Day Streak</span>
            </div>
            <button onClick={toggleTheme} className="flex items-center bg-white dark:bg-[#111C44] px-4 py-2.5 rounded-full shadow-sm border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1A2A6C] transition">
              {theme === 'light' ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2 text-white" />}
              <span className="text-sm font-bold text-slate-800 dark:text-white">{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        </header>

        {/* TOP STAT CARDS (Colors Fixed) */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          <AnalyticsCard 
            title="XP Earned Today" 
            value={analytics.xpToday} 
            suffix="XP"
            icon={<Zap className="w-5 h-5 text-indigo-400 fill-indigo-400" />} 
            bg="bg-[#1A2352]" 
            cardBg="bg-gradient-to-br from-[#1E2756] to-[#111C44]"
            valueColor="text-indigo-400"
          />
          <AnalyticsCard 
            title="Study Streak" 
            value={analytics.streak} 
            suffix="days"
            icon={<Flame className="w-5 h-5 text-orange-400 fill-orange-400" />} 
            bg="bg-[#2A2342]"
            cardBg="bg-gradient-to-br from-[#2D2447] to-[#111C44]"
            valueColor="text-orange-400"
          />
          <AnalyticsCard 
            title="Global Rank" 
            value={`#${analytics.globalRank}`} 
            icon={<Trophy className="w-5 h-5 text-pink-400" />} 
            bg="bg-[#311C47]" 
            cardBg="bg-[#111C44]"
            valueColor="text-pink-400"
          />
          <AnalyticsCard 
            title="Study Hours" 
            value={analytics.studyHours} 
            suffix="h"
            icon={<Clock className="w-5 h-5 text-emerald-400" />} 
            bg="bg-[#162D44]" 
            cardBg="bg-[#111C44]"
            valueColor="text-emerald-400"
          />
        </div>

        {/* MAIN LAYOUT GRID */}
        <div className="grid grid-cols-3 gap-6">
          
          {/* ACTIVE COURSES (Left 2 Columns) */}
          <div className="col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Active Courses</h2>
              <button className="text-indigo-400 font-bold bg-[#1A2352] px-4 py-1.5 rounded-full text-xs hover:bg-[#232F6A] transition">
                View All &rarr;
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {activeCourses.length > 0 ? activeCourses.map(course => (
                <DynamicCourseCard key={course.id} course={course} />
              )) : (
                <div className="col-span-2 text-center py-10 text-gray-500 font-medium bg-[#111C44] rounded-[28px] border border-gray-800">
                  No courses generated yet. Upload a PDF in My Resources!
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE WIDGETS */}
          <div className="col-span-1 space-y-6 mt-12">
            
            {/* Study Streak Widget */}
            <div className="bg-[#111C44] rounded-[28px] p-6 shadow-sm border border-gray-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-extrabold text-white">Study Streak</h3>
                <div className="bg-[#2A2342] px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                  <span className="text-xs font-bold text-orange-400">{analytics.streak}</span>
                </div>
              </div>
              
              {/* Dot Grid */}
              <div className="grid grid-cols-7 gap-y-3 gap-x-2 mb-4">
                {[...Array(14)].map((_, i) => (
                  <div key={i} className={`h-2.5 rounded-sm ${i === 6 || i === 13 ? 'bg-[#1E293B]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]'}`} />
                ))}
              </div>
              
              <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 mt-4">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-emerald-400"></div> Studied</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#1E293B]"></div> Missed</div>
              </div>
            </div>

            {/* XP Breakdown Widget */}
            <div className="bg-[#111C44] rounded-[28px] p-6 shadow-sm border border-gray-800">
              <h3 className="text-base font-extrabold text-white mb-6">XP Breakdown</h3>
              
              <div className="space-y-5">
                <XPProgressBar label="Lessons" xp="450 XP" percentage={75} color="bg-indigo-500" />
                <XPProgressBar label="Quizzes" xp="250 XP" percentage={45} color="bg-pink-500" />
                <XPProgressBar label="Streaks" xp="140 XP" percentage={30} color="bg-orange-400" />
              </div>
            </div>

          </div>
        </div>

        {/* RESTORED: MY RESOURCES SECTION */}
        <section className="mt-12 mb-8">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">My Resources</h2>
          <div className="bg-[#111C44] rounded-[28px] p-8 shadow-sm border border-dashed border-indigo-500/50 flex flex-col items-center justify-center text-center">
             <ResourceUploader />
          </div>
        </section>

      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function AnalyticsCard({ title, value, suffix, icon, bg, cardBg, valueColor = "text-white" }: { title: string, value: string | number, suffix?: string, icon: React.ReactNode, bg: string, cardBg: string, valueColor?: string }) {
  return (
    <div className={`${cardBg} p-6 rounded-[28px] shadow-sm border border-gray-800 flex flex-col justify-between h-[140px]`}>
      <div className="flex justify-between items-start">
        <p className="text-xs font-bold text-gray-400">{title}</p>
        <div className={`p-2.5 rounded-xl ${bg}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <h3 className={`text-[32px] font-extrabold tracking-tight leading-none ${valueColor}`}>{value}</h3>
        {suffix && <span className="text-lg font-bold text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}

function DynamicCourseCard({ course }: { course: any }) {
  // Dynamically map colors based on AI generated subject/difficulty
  const getColors = (subject: string) => {
    const s = subject?.toLowerCase() || '';
    if (s.includes('math')) return { text: 'text-indigo-400', bg: 'bg-indigo-500/10', stroke: 'stroke-indigo-500' };
    if (s.includes('physic')) return { text: 'text-pink-400', bg: 'bg-pink-500/10', stroke: 'stroke-pink-500' };
    if (s.includes('histor')) return { text: 'text-amber-400', bg: 'bg-amber-500/10', stroke: 'stroke-amber-400' };
    if (s.includes('english') || s.includes('lit')) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', stroke: 'stroke-emerald-400' };
    return { text: 'text-purple-400', bg: 'bg-purple-500/10', stroke: 'stroke-purple-500' };
  };

  const colors = getColors(course.difficulty || course.title);
  const radius = 24;
  const strokeDasharray = 2 * Math.PI * radius;
  const strokeDashoffset = strokeDasharray - ((course.progress_percentage || 0) / 100) * strokeDasharray;

  return (
    <div className="bg-[#111C44] p-6 rounded-[28px] shadow-sm border border-gray-800 flex flex-col justify-between h-[230px]">
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-md ${colors.bg} ${colors.text}`}>
            {course.difficulty || 'General'}
          </span>
          <h4 className="font-extrabold text-[19px] text-white tracking-tight leading-tight line-clamp-2 max-w-[150px]">
            {course.title}
          </h4>
        </div>

        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="32" cy="32" r={radius} className="stroke-[#1E293B]" strokeWidth="5" fill="transparent" />
            <circle 
              cx="32" cy="32" r={radius} 
              className={`${colors.stroke} transition-all duration-1000`} 
              strokeWidth="5" fill="transparent" 
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-[13px] font-black text-white">
            {course.progress_percentage || 0}%
          </span>
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-3 px-1">
          <span>{course.estimated_duration} mins total</span>
          <span>{course.progress_percentage < 100 ? 'In Progress' : 'Complete'}</span>
        </div>

        <div className="bg-[#1A2352] p-3 rounded-2xl flex justify-between items-center border border-indigo-900/30">
          <span className="text-[11px] font-bold text-gray-300 truncate max-w-[160px] pl-2">
            Continue Learning
          </span>
          <button className={`w-7 h-7 bg-[#111C44] rounded-xl flex items-center justify-center shadow-sm ${colors.text} hover:scale-105 transition-transform`}>
            <Play className="w-3 h-3 fill-current ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function XPProgressBar({ label, xp, percentage, color }: { label: string, xp: string, percentage: number, color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs font-extrabold">
        <span className="text-white">{label}</span>
        <span className="text-indigo-400">{xp}</span>
      </div>
      <div className="w-full h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
