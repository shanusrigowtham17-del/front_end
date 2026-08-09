'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, X, Clock, Trash2 } from 'lucide-react';

// Hardcoded for demo purposes
const supabase = createClient(
  'https://gftrjvljhtqkercsiskp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHJqdmxqaHRxa2VyY3Npc2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTQ4NTUsImV4cCI6MjEwMDE5MDg1NX0.hWY-QP3Ulb1uJPBhuSGCZo07tJr1aXm7GhXalX03uIs'
);

type StudyEvent = {
  id: string;
  marked_date: string;
  title: string;
  time: string;
};

export default function SchedulerFullPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDate, setActiveDate] = useState('');
  const [eventTitle, setEventTitle] = useState('Study Session');
  const [eventTime, setEventTime] = useState('10:00');

  // 1. Fetch user and their events on mount
  const loadSchedule = useCallback(async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;
    setUserId(session.user.id);

    const { data, error } = await supabase
      .from('scheduled_dates')
      .select('*')
      .eq('user_id', session.user.id)
      .order('time', { ascending: true });

    if (!error && data) {
      setEvents(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // 2. Modal Handlers
  const openModal = (dayString: string) => {
    setActiveDate(dayString);
    setEventTitle('Study Session');
    setEventTime('12:00');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveDate('');
  };

  const handleSaveEvent = async () => {
    if (!userId || !activeDate) return;

    // Optimistic UI update (using a temporary ID)
    const tempId = Math.random().toString();
    const newEvent = { id: tempId, marked_date: activeDate, title: eventTitle, time: eventTime };
    setEvents(prev => [...prev, newEvent].sort((a, b) => a.time.localeCompare(b.time)));
    
    closeModal();

    // Database Insert
    const { data, error } = await supabase
      .from('scheduled_dates')
      .insert([{ user_id: userId, marked_date: activeDate, title: eventTitle, time: eventTime }])
      .select()
      .single();

    // Replace temp ID with real DB ID
    if (!error && data) {
      setEvents(prev => prev.map(e => e.id === tempId ? data : e));
    }
  };

  const handleDeleteEvent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent opening the modal when clicking delete
    
    // Optimistic UI update
    setEvents(prev => prev.filter(event => event.id !== id));

    // Database Delete
    await supabase.from('scheduled_dates').delete().eq('id', id);
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

  const calendarCells = [];
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarCells.push({ year: month === 0 ? year - 1 : year, month: month === 0 ? 11 : month - 1, day: daysInPrevMonth - i, isCurrentMonth: false });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({ year, month, day: i, isCurrentMonth: true });
  }

  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({ year: month === 11 ? year + 1 : year, month: month === 11 ? 0 : month + 1, day: i, isCurrentMonth: false });
  }

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
    <div className="flex flex-col h-screen w-full bg-[#0B1437] font-sans overflow-hidden text-gray-200 relative">
      
      {/* HEADER */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-4 shrink-0 bg-[#0B1437]">
        <div className="flex items-center gap-4">
          
          {/* Menu button removed, Study Calendar title made clickable */}
          <Link href="/" className="flex items-center gap-2 mr-6 group cursor-pointer">
            <div className="p-1.5 bg-indigo-500 rounded-lg group-hover:bg-indigo-400 transition-colors">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-medium text-white tracking-tight group-hover:text-indigo-200 transition-colors">Study Calendar</h1>
          </Link>

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
        
        <div></div>
      </header>

      {/* CALENDAR BODY */}
      <div className="flex-1 flex flex-col w-full bg-[#111C44]">
        <div className="grid grid-cols-7 border-b border-gray-800 shrink-0">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-800 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 grid-rows-6">
          {calendarCells.map((cell, index) => {
            const dayString = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
            const isToday = dayString === todayString;
            const dayEvents = events.filter(e => e.marked_date === dayString);

            return (
              <div 
                key={index} 
                onClick={() => openModal(dayString)}
                className={`
                  border-r border-b border-gray-800 p-1.5 flex flex-col gap-1 cursor-pointer transition-colors
                  hover:bg-[#1A2556] group overflow-y-auto custom-scrollbar
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

                {/* Custom Events Block */}
                {dayEvents.map((evt) => (
                  <div key={evt.id} className="bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-[11px] px-2 py-1 rounded shadow-sm font-medium flex items-center justify-between gap-1 transition-colors group/event">
                    <div className="flex items-center gap-1.5 truncate">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                      <span className="font-bold shrink-0">{evt.time}</span>
                      <span className="truncate">{evt.title}</span>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteEvent(e, evt.id)}
                      className="opacity-0 group-hover/event:opacity-100 p-0.5 hover:bg-indigo-500/40 rounded transition-all text-indigo-400 hover:text-white"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* CUSTOM EVENT MODAL */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111C44] border border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Add Reminder</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reminder Title</label>
                <input 
                  type="text" 
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-[#0B1437] border border-gray-700 text-white rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g., Read Physics Chapter 3"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Alert Time</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="w-4 h-4 text-gray-500" />
                  </div>
                  <input 
                    type="time" 
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full bg-[#0B1437] border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-indigo-500 transition-colors cursor-text color-scheme-dark"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-lg font-bold text-gray-400 bg-[#1A2556] hover:bg-[#23306B] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEvent}
                className="flex-1 py-2.5 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
              >
                Save Alert
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1A2556;
          border-radius: 4px;
        }
        .color-scheme-dark {
          color-scheme: dark;
        }
      `}</style>
    </div>
  );
}
