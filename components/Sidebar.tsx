import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, MessageSquareCode, HelpCircle, Calendar, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  user: {
    full_name: string;
    level: number;
    xp_points: number;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'My Courses', icon: GraduationCap, path: '/courses' },
    { name: 'AI Chatbot', icon: MessageSquareCode, path: '/chatbot' },
    { name: 'AI Quiz', icon: HelpCircle, path: '/quiz' },
    { name: 'Schedule', icon: Calendar, path: '/schedule' },
  ];

  const currentLevelXp = user.xp_points % 1000;
  const xpPercentage = (currentLevelXp / 1000) * 100;

  return (
    <aside className="w-64 h-full bg-white dark:bg-[#111C44] border-r border-gray-100 dark:border-gray-800 flex flex-col justify-between p-6 transition-colors duration-300">
      <div>
        <div className="flex items-center gap-3 mb-10 pl-2">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-black shadow-md">
            ⚡
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight">StudySpark</h3>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Edu Platform</p>
          </div>
        </div>

        <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase pl-2 mb-4">Main Menu</p>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path || (pathname === '/' && item.path === '/dashboard');
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 group relative",
                  isActive 
                    ? "bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400" 
                    : "text-gray-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300"
                )}
              >
                {isActive && <span className="absolute right-0 top-1/4 h-1/2 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-l-full" />}
                <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400")} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-[#F4F7FE] dark:bg-[#0B1437] p-4 rounded-3xl border border-gray-100 dark:border-gray-800/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-inner">
            {user.full_name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate max-w-[130px]">
              {user.full_name}
            </h4>
            <p className="text-[11px] font-medium text-gray-400">Dynamic Learner</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold">
            <span className="text-indigo-600 dark:text-indigo-400">Lv. {user.level} Scholar</span>
            <span className="text-gray-400">{user.xp_points.toLocaleString()} XP</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
          <p className="text-[9px] text-gray-400 text-right font-medium">
            {1000 - currentLevelXp} to Lv. {user.level + 1}
          </p>
        </div>
      </div>
    </aside>
  );
}
