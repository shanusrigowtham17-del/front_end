import { Play } from 'lucide-react';

interface CourseProps {
  course: {
    id: string;
    title: string;
    difficulty: string;
    progress_percentage: number;
    estimated_duration: number;
  };
}

export function CourseCard({ course }: CourseProps) {
  const tagStyles: Record<string, string> = {
    Math: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    Physics: "bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400",
    History: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    English: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    Default: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
  };

  const currentStyle = tagStyles[course.difficulty] || tagStyles.Default;
  const radius = 22;
  const strokeDasharray = 2 * Math.PI * radius;
  const strokeDashoffset = strokeDasharray - (course.progress_percentage / 100) * strokeDasharray;

  return (
    <div className="bg-white dark:bg-[#111C44] p-6 rounded-[32px] shadow-sm border border-gray-50 dark:border-gray-800/40 flex flex-col justify-between h-[220px] hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${currentStyle}`}>
            {course.difficulty}
          </span>
          <h4 className="font-extrabold text-lg text-slate-800 dark:text-white tracking-tight leading-snug line-clamp-2 max-w-[180px]">
            {course.title}
          </h4>
        </div>

        <div className="relative w-14 h-14 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="28" cy="28" r={radius} className="stroke-gray-100 dark:stroke-gray-800" strokeWidth="4" fill="transparent" />
            <circle 
              cx="28" cy="28" r={radius} 
              className="stroke-indigo-600 dark:stroke-indigo-400 transition-all duration-500" 
              strokeWidth="4" fill="transparent" 
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-[11px] font-black text-slate-800 dark:text-white">
            {course.progress_percentage}%
          </span>
        </div>
      </div>

      <div className="flex justify-between text-xs font-bold text-gray-400 dark:text-gray-500 mb-2">
        <span>Dynamic modules loaded</span>
        <span>{course.estimated_duration} mins total</span>
      </div>

      <div className="bg-[#F4F7FE] dark:bg-[#0B1437] p-3 rounded-2xl flex justify-between items-center border border-gray-100 dark:border-gray-800/30">
        <span className="text-xs font-bold text-slate-700 dark:text-gray-300 truncate max-w-[160px]">
          AI Generated Syllabus
        </span>
        <button className="w-7 h-7 bg-white dark:bg-[#111C44] rounded-xl flex items-center justify-center shadow-sm text-indigo-600 dark:text-indigo-400 hover:scale-105 active:scale-95 transition-transform">
          <Play className="w-3 h-3 fill-current" />
        </button>
      </div>
    </div>
  );
}
