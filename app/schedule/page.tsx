'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChevronLeft, ChevronRight, Menu, Search, HelpCircle, Settings, Calendar as CalendarIcon, Loader2 } from 'lucide-react';

// Hardcoded for demo purposes
const supabase = createClient(
  'https://gftrjvljhtqkercsiskp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHJqdmxqaHRxa2VyY3Npc2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTQ4NTUsImV4cCI6MjEwMDE5MDg1NX0.hWY-QP3Ulb1uJPBhuSGCZo07tJr1aXm7GhXalX03uIs'
);

export default function SchedulerFullPage() {
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
    const newMarkedDates = new Set(markedDates);
    
    if (isCurrentlyMarked) {
      newMarkedDates.delete(dayString);
    } else {
      newMarkedDates.add(dayString);
    }
    
    setMarkedDates(newMarkedDates); // Optimistic UI update

    if (isCurrentlyMarked) {
      await supabase.from('scheduled_dates').delete().eq('user_id', userId).eq('marked_date', dayString);
    } else {
      await supabase.from('scheduled_dates').insert([{ user_id: userId, marked_date: dayString }]);
    }
  };

  // 3. Calendar Grid Calculations
  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + offset);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Generate the 42 cells (6 weeks) for a full Google Calendar-style grid
  const calendarCells = [];
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Fill preceding days from previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarCells.push({
      year: month === 0 ? year - 1 : year,
      month: month === 0 ? 11 : month - 1,
      day: daysInPrevMonth - i,
      isCurrentMonth: false
    });
  }

  // Fill days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({ year, month, day: i, isCurrentMonth: true });
  }

  // Fill remaining days from next month to complete exactly 42 cells (6 rows of 7)
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      year: month === 11 ? year + 1 : year,
      month: month === 11 ? 0 : month + 1,
      day: i,
      isCurrentMonth: false
    });
  }

  // Get today's local date string for the "Today" indicator
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#0B1437] flex items-center justify-center font-bold text-slate-400">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4 mx-auto" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#0B1437] font-sans overflow-hidden text-gray-200">
      
      {/* GOOGLE CALENDAR STYLE HEADER */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-4 shrink-0 bg-[#0B1437]">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-[#111C44] rounded-full transition-colors">
            <Menu className="w-5 h-5 text-gray-400" />
          </button>
          
          <div className="flex items-center gap-2 mr-6">
            <div className="p-1.5 bg-indigo-500 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-medium text-white tracking-tight">Study Calendar</h1>
          </div>

          <button 
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium border border-gray-700 rounded-md hover:bg-[#111C44] transition-colors"
          >
            Today
          </button>

          <div className="flex items-center gap-1 ml-2">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-[#111C44] rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-[#111C44] rounded-full transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <h2 className="text-xl font-normal text-white ml-2 min-w-[150px]">
            {monthName}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-[#111C44] rounded-full transition-colors"><Search className="w-5 h-5 text-gray-400" /></button>
          <button className="p-2 hover:bg-[#111C44] rounded-full transition-colors"><HelpCircle className="w-5 h-5 text-gray-400" /></button>
          <button className="p-2 hover:bg-[#111C44] rounded-full transition-colors"><Settings className="w-5 h-5 text-gray-400" /></button>
          
          <select className="ml-2 bg-[#111C44] border border-gray-700 text-sm rounded-md px-3 py-1.5 outline-none cursor-pointer">
            <option>Month</option>
            <option>Week</option>
            <option>Day</option>
          </select>
        </div>
      </header>

      {/* CALENDAR BODY */}
      <div className="flex-1 flex flex-col w-full bg-[#111C44]">
        
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-gray-800 shrink-0">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-800 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* 6x7 Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6">
          {calendarCells.map((cell, index) => {
            const dayString = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
            const isMarked = markedDates.has(dayString);
            const isToday = dayString === todayString;

            return (
              <div 
                key={index} 
                onClick={() => toggleDate(dayString)}
                className={`
                  border-r border-b border-gray-800 p-1.5 flex flex-col gap-1 cursor-pointer transition-colors
                  hover:bg-[#1A2556] group
                  ${!cell.isCurrentMonth ? 'bg-[#0B1437]/50' : 'bg-[#0B1437]'}
                `}
              >
                {/* Day Number Label */}
                <div className="flex justify-center mt-1 mb-1">
                  <span className={`
                    w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold
                    ${isToday 
                      ? 'bg-indigo-500 text-white shadow-md' 
                      : cell.isCurrentMonth 
                        ? 'text-gray-300 group-hover:bg-[#111C44]' 
                        : 'text-gray-600 group-hover:bg-[#111C44]'}
                  `}>
                    {cell.day === 1 ? `${new Date(cell.year, cell.month).toLocaleString('default', { month: 'short' })} ${cell.day}` : cell.day}
                  </span>
                </div>

                {/* Event Block (Google Calendar Style) */}
                {isMarked && (
                  <div className="bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-[11px] px-2 py-1 rounded shadow-sm font-medium truncate flex items-center gap-1.5 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                    Study Planned
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
