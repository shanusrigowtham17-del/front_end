'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from 'lucide-react';

// Hardcoded for demo purposes
const supabase = createClient(
  'https://gftrjvljhtqkercsiskp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHJqdmxqaHRxa2VyY3Npc2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTQ4NTUsImV4cCI6MjEwMDE5MDg1NX0.hWY-QP3Ulb1uJPBhuSGCZo07tJr1aXm7GhXalX03uIs'
);

export function Scheduler() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Fetch user and their marked dates on mount
  const loadSchedule = useCallback(async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;
    setUserId(session.user.id);

    const { data, error } = await supabase
      .from('scheduled_dates')
      .select('marked_date')
      .eq('user_id', session.user.id);

    if (!error && data) {
      // Store dates as 'YYYY-MM-DD' strings in a Set for fast lookup
      const datesSet = new Set(data.map(d => d.marked_date));
      setMarkedDates(datesSet);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // 2. Handle toggling a date on/off
  const toggleDate = async (dayString: string) => {
    if (!userId) return;

    const isCurrentlyMarked = markedDates.has(dayString);
    
    // Optimistic UI update for snappy feel
    const newMarkedDates = new Set(markedDates);
    if (isCurrentlyMarked) {
      newMarkedDates.delete(dayString);
    } else {
      newMarkedDates.add(dayString);
    }
    setMarkedDates(newMarkedDates);

    // Database update
    if (isCurrentlyMarked) {
      await supabase
        .from('scheduled_dates')
        .delete()
        .eq('user_id', userId)
        .eq('marked_date', dayString);
    } else {
      await supabase
        .from('scheduled_dates')
        .insert([{ user_id: userId, marked_date: dayString }]);
    }
  };

  // 3. Calendar logic helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + offset);
      return newDate;
    });
  };

  // 4. Render calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return (
      <div className="bg-[#111C44] rounded-[28px] p-8 shadow-sm border border-gray-800 flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#111C44] rounded-[28px] p-6 shadow-sm border border-gray-800 max-w-md w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 rounded-xl">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-lg font-extrabold text-white tracking-tight">Study Schedule</h3>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => changeMonth(-1)}
            className="w-8 h-8 rounded-full bg-[#1A2352] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#232F6A] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => changeMonth(1)}
            className="w-8 h-8 rounded-full bg-[#1A2352] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#232F6A] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="text-center mb-4">
        <h4 className="text-sm font-bold text-gray-300 uppercase tracking-widest">{monthName}</h4>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[10px] font-black text-gray-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty slots for days before the 1st of the month */}
        {[...Array(firstDay)].map((_, i) => (
          <div key={`empty-${i}`} className="h-10 rounded-xl" />
        ))}
        
        {/* Actual days */}
        {[...Array(daysInMonth)].map((_, i) => {
          const dayNumber = i + 1;
          // Format exactly as PostgreSQL expects DATE: YYYY-MM-DD
          const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
          const isSelected = markedDates.has(dayString);

          return (
            <button
              key={dayNumber}
              onClick={() => toggleDate(dayString)}
              className={`
                h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all
                ${isSelected 
                  ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)] hover:bg-indigo-400' 
                  : 'bg-[#1E2756] text-gray-400 hover:bg-[#2A346C] hover:text-gray-200'}
              `}
            >
              {dayNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}
