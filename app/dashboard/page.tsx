'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Sun, Moon, Flame, Clock, Zap, Trophy, Play } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ResourceUploader } from '@/components/ResourceUploader';

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

  const loadDashboardData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    const activeUserId = session.user.id;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', activeUserId)
      .single();

    setUser(profileData);

    // Courses generated from uploaded PDFs (subject/title come from the upload flow)
    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', activeUserId)
      .order('created_at', { ascending: false })
      .limit(4);

    setActiveCourses(courses || []);

    // --- Real analytics, derived from actual rows instead of hardcoded numbers ---

    // XP earned today: sum xp_earned across ALL of the user's courses created/updated today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { data: todaysCourses } = await supabase
      .from('courses')
      .select('xp_earned')
      .eq('user_id', activeUserId)
      .gte('created_at', startOfToday.toISOString());

    const xpToday = (todaysCourses || []).reduce((sum, c) => sum + (c.xp_earned || 0), 0);

    // Study hours: total estimated_duration across all courses, converted to hours
    const { data: allCourses } = await supabase
      .from('courses')
      .select('estimated_duration')
      .eq('user_id', activeUserId);

    const studyHours = Math.round(
      ((allCourses || []).reduce((sum, c) => sum + (c.estimated_duration || 0), 0) / 60) * 10
    ) / 10;

    // Global rank: order all profiles by total_xp, find this user's position
    const { data: leaderboard } = await supabase
      .from('profiles')
      .select('id, total_xp')
      .order('total_xp', { ascending: false });

    const globalRank = leaderboard
      ? leaderboard.findIndex((p) => p.id === activeUserId) + 1 || leaderboard.length
      : 1;

    setAnalytics({
      xpToday,
      streak: profileData?.study_streak_days || 0,
      globalRank,
      studyHours,
    });
  }, [router]);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));

    document.documentElement.classList.add('dark');

    loadDashboardData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, loadDashboardData]);

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

        {/* TOP STAT CARDS */}
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

          {/* ACTIVE COURSES */}
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

            <div className="bg-[#111C44] rounded-[28px] p-6 shadow-sm border border-gray-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-extrabold text-white">Study Streak</h3>
                <div className="bg-[#2A2342] px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                  <span className="text-xs font-bold text-orange-400">{analytics.streak}</span>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-y-3 gap-x-2 mb-4">
                {[...Array(14)].map((_, i) => (
                  <div key={i} className={`h-2.5 rounded-sm ${i < analytics.streak ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-[#1E293B]'}`} />
                ))}
              </div>

              <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 mt-4">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-emerald-400"></div> Studied</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#1E293B]"></div> Missed</div>
              </div>
            </div>

            {/* XP Breakdown — now derived from the courses table's subject/xp fields */}
            <div className="bg-[#111C44] rounded-[28px] p-6 shadow-sm border border-gray-800">
              <h3 className="text-base font-extrabold text-white mb-6">XP Breakdown</h3>

              <div className="space-y-5">
                {(() => {
                  const total = activeCourses.reduce((s, c) => s + (c.xp_earned || 0), 0) || 1;
                  const bySubject: Record<string, number> = {};
                  activeCourses.forEach(c => {
                    const key = c.subject || c.difficulty || 'General';
                    bySubject[key] = (bySubject[key] || 0) + (c.xp_earned || 0);
                  });
                  const entries = Object.entries(bySubject);
                  const colors = ['bg-indigo-500', 'bg-pink-500', 'bg-orange-400', 'bg-emerald-400'];
                  return entries.length > 0 ? entries.map(([label, xp], i) => (
                    <XPProgressBar
                      key={label}
                      label={label}
                      xp={`${xp} XP`}
                      percentage={Math.round((xp / total) * 100)}
                      color={colors[i % colors.length]}
                    />
                  )) : (
                    <p className="text-xs text-gray-500">Upload a PDF to start earning XP.</p>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>

        {/* MY RESOURCES */}
        <section className="mt-12 mb-8">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">My Resources</h2>
          <div className="bg-[#111C44] rounded-[28px] p-8 shadow-sm border border-dashed border-indigo-500/50 flex flex-col items-center justify-center text-center">
             <ResourceUploader onCourseCreated={loadDashboardData} />
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
  const getColors = (subject: string) => {
    const s = subject?.toLowerCase() || '';
    if (s.includes('math')) return { text: 'text-indigo-400', bg: 'bg-indigo-500/10', stroke: 'stroke-indigo-500' };
    if (s.includes('physic')) return { text: 'text-pink-400', bg: 'bg-pink-500/10', stroke: 'stroke-pink-500' };
    if (s.includes('histor')) return { text: 'text-amber-400', bg: 'bg-amber-500/10', stroke: 'stroke-amber-400' };
    if (s.includes('english') || s.includes('lit')) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', stroke: 'stroke-emerald-400' };
    if (s.includes('chem')) return { text: 'text-cyan-400', bg: 'bg-cyan-500/10', stroke: 'stroke-cyan-400' };
    if (s.includes('bio')) return { text: 'text-lime-400', bg: 'bg-lime-500/10', stroke: 'stroke-lime-400' };
    return { text: 'text-purple-400', bg: 'bg-purple-500/10', stroke: 'stroke-purple-500' };
  };

  const colors = getColors(course.subject || course.difficulty || course.title);
  const radius = 24;
  const strokeDasharray = 2 * Math.PI * radius;
  const strokeDashoffset = strokeDasharray - ((course.progress_percentage || 0) / 100) * strokeDasharray;

  return (
    <div className="bg-[#111C44] p-6 rounded-[28px] shadow-sm border border-gray-800 flex flex-col justify-between h-[230px]">
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-md ${colors.bg} ${colors.text}`}>
            {course.subject || course.difficulty || 'General'}
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
        <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} />
      </div>
    </div>
  );
}
