'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ChevronLeft, FileText, PlayCircle, Send, Bot, User } from 'lucide-react';

const supabase = createClient(
  'https://gftrjvljhtqkercsiskp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHJqdmxqaHRxa2VyY3Npc2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTQ4NTUsImV4cCI6MjEwMDE5MDg1NX0.hWY-QP3Ulb1uJPBhuSGCZo07tJr1aXm7GhXalX03uIs'
);

interface Course {
  id: string;
  title: string;
}

interface Topic {
  id: string;
  course_id: string;
  title: string;
  type: 'pdf' | 'video';
  duration: number;
  file_url: string;
  order_index: number;
  completed?: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function CourseDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  // --- Chatbot State ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I am your AI tutor. Ask me anything about this document.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (!courseId) {
      setError("Course ID is missing from the URL. Check your folder structure!");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadCourseDetails() {
      setLoading(true);
      setError(null);

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (cancelled) return;

      if (courseError || !courseData) {
        setError('Could not load this course.');
        setLoading(false);
        return;
      }
      setCourse(courseData);

      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (cancelled) return;

      if (topicsError) {
        setError('Could not load the topics for this course.');
        setLoading(false);
        return;
      }

      setTopics(topicsData ?? []);
      setActiveTopic(topicsData && topicsData.length > 0 ? topicsData[0] : null);
      setLoading(false);
    }

    loadCourseDetails();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  async function handleMarkComplete() {
    if (!activeTopic || marking) return;
    setMarking(true);

    const { error: updateError } = await supabase
      .from('topics')
      .update({ completed: true })
      .eq('id', activeTopic.id);

    if (!updateError) {
      setTopics((prev) =>
        prev.map((t) => (t.id === activeTopic.id ? { ...t, completed: true } : t))
      );
      setActiveTopic((prev) => (prev ? { ...prev, completed: true } : prev));
    }
    setMarking(false);
  }

  // --- Chatbot Function ---
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: chatInput };
    const newHistory = [...chatMessages, userMessage];
    
    setChatMessages(newHistory);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await fetch('https://pdf-course-api.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: userMessage.content
        }),
      });

      // Grab the exact error message from your Python backend
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server Error ${response.status}`);
      }
      
      const data = await response.json();
      setChatMessages([...newHistory, { role: 'assistant', content: data.response || "I couldn't generate a response." }]);
    } catch (err: any) {
      // Show the actual error in the chat bubble!
      setChatMessages([...newHistory, { role: 'assistant', content: `⚠️ ${err.message}` }]);
    } finally {
      setIsTyping(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-[#0B1437] items-center justify-center text-white font-bold">
        Loading course...
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col h-screen w-full bg-[#0B1437] items-center justify-center text-white p-8">
        <p className="mb-4 text-red-400 font-bold">{error ?? 'Course not found.'}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm font-bold text-gray-400 hover:text-white flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#0B1437] text-white overflow-hidden">
      
      {/* 1. LEFT SIDEBAR: Topic List */}
      <aside className="w-72 flex-shrink-0 bg-[#111C44] border-r border-gray-800 flex flex-col z-10 shadow-xl">
        <div className="p-5 border-b border-gray-800">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-xs font-bold text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-3 h-3 mr-1" /> Back to Dashboard
          </button>
          <h2 className="text-lg font-extrabold line-clamp-2 leading-tight">{course.title}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {topics.length === 0 ? (
            <p className="text-xs text-gray-500 p-4 text-center">No topics generated.</p>
          ) : (
            topics.map((topic, idx) => (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic)}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
                  activeTopic?.id === topic.id
                    ? 'bg-indigo-500/15 border border-indigo-500/50 shadow-sm'
                    : 'hover:bg-[#1A2352] border border-transparent'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${activeTopic?.id === topic.id ? 'bg-indigo-500 text-white' : 'bg-[#0B1437] text-gray-400'}`}>
                  {idx + 1}
                </div>
                <div className="overflow-hidden">
                  <p className={`font-bold text-xs truncate ${activeTopic?.id === topic.id ? 'text-indigo-300' : 'text-gray-300'}`}>
                    {topic.title}
                  </p>
                  <p className="text-[9px] text-gray-500 flex items-center gap-1 mt-0.5">
                    {topic.type === 'pdf' ? <FileText className="w-2.5 h-2.5" /> : <PlayCircle className="w-2.5 h-2.5" />}
                    {topic.duration} mins {topic.completed && <span className="text-emerald-400 ml-1">✓</span>}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* 2. MAIN CONTENT: Document / Video Viewer */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0B1437] p-6">
        {activeTopic ? (
          <div className="bg-[#111C44] flex-1 rounded-[24px] border border-gray-800 flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#15204c]">
              <h3 className="text-lg font-extrabold truncate pr-4">{activeTopic.title}</h3>
              <button
                onClick={handleMarkComplete}
                disabled={marking || activeTopic.completed}
                className="flex-shrink-0 bg-indigo-600 px-5 py-2 rounded-full font-bold text-xs hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {activeTopic.completed ? 'Completed ✓' : marking ? 'Saving...' : 'Mark as Complete'}
              </button>
            </div>
            <div className="flex-1 bg-[#090E27]">
              {!activeTopic.file_url ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                  <FileText className="w-8 h-8 opacity-20" />
                  <p className="text-sm font-medium">No document available for this module.</p>
                </div>
              ) : activeTopic.type === 'video' ? (
                <video key={activeTopic.id} src={activeTopic.file_url} controls className="w-full h-full object-contain bg-black" />
              ) : (
                <iframe
                  key={activeTopic.id}
                  src={`${activeTopic.file_url}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-none bg-white"
                  title={activeTopic.title}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 font-medium">
            Select a topic from the sidebar to start learning.
          </div>
        )}
      </main>

      {/* 3. RIGHT SIDEBAR: AI Chatbot */}
      <aside className="w-[340px] flex-shrink-0 bg-[#111C44] border-l border-gray-800 flex flex-col z-10 shadow-xl">
        <div className="p-5 border-b border-gray-800 flex items-center gap-2 bg-[#15204c]">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <h3 className="font-extrabold text-sm">AI Study Tutor</h3>
        </div>

        {/* Chat History View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0B1437]/50">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'user' ? 'bg-indigo-500' : 'bg-pink-500'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[80%] ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-[#1E2756] text-gray-200 border border-indigo-500/20 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3 flex-row">
              <div className="w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="p-4 rounded-2xl bg-[#1E2756] rounded-tl-none flex items-center gap-1.5 border border-indigo-500/20">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input Field */}
        <div className="p-4 border-t border-gray-800 bg-[#111C44]">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={isTyping}
              className="w-full bg-[#0B1437] text-white text-sm rounded-full pl-4 pr-12 py-3 border border-gray-700 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isTyping}
              className="absolute right-2 p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 transition disabled:opacity-50 disabled:hover:bg-indigo-600"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </aside>

    </div>
  );
}
