'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ChevronLeft, FileText, PlayCircle } from 'lucide-react';

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

export default function CourseDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  // Next.js can give string | string[] for a dynamic segment; normalize it.
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!courseId) return;

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

  // FIXED: Added dark background and centered text
  if (loading) {
    return (
      <div className="flex h-screen w-full bg-[#0B1437] items-center justify-center text-white font-bold">
        Loading course...
      </div>
    );
  }

  // FIXED: Added dark background and proper flex layout
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
    <div className="flex h-screen w-full bg-[#0B1437] text-white">
      {/* LEFT SIDEBAR: Topic List */}
      <aside className="w-80 bg-[#111C44] border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-sm font-bold text-gray-400 hover:text-white mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </button>
          <h2 className="text-xl font-extrabold line-clamp-2">{course.title}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {topics.length === 0 ? (
            <p className="text-sm text-gray-500 p-4">No topics yet for this course.</p>
          ) : (
            topics.map((topic, idx) => (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic)}
                className={`w-full text-left p-4 rounded-2xl flex items-center gap-3 transition-colors ${
                  activeTopic?.id === topic.id
                    ? 'bg-indigo-500/20 border border-indigo-500/50'
                    : 'hover:bg-[#1A2352] border border-transparent'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#0B1437] flex items-center justify-center font-bold text-xs">
                  {idx + 1}
                </div>
                <div>
                  <p
                    className={`font-bold text-sm ${
                      activeTopic?.id === topic.id ? 'text-indigo-400' : 'text-gray-300'
                    }`}
                  >
                    {topic.title}
                    {topic.completed && (
                      <span className="ml-2 text-[10px] text-emerald-400">✓</span>
                    )}
                  </p>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                    {topic.type === 'pdf' ? (
                      <FileText className="w-3 h-3" />
                    ) : (
                      <PlayCircle className="w-3 h-3" />
                    )}
                    {topic.duration} mins
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* MAIN CONTENT: PDF / Video Viewer */}
      <main className="flex-1 flex flex-col bg-[#0B1437] p-8">
        {activeTopic ? (
          <div className="bg-[#111C44] flex-1 rounded-[28px] border border-gray-800 flex flex-col overflow-hidden shadow-lg">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-2xl font-extrabold">{activeTopic.title}</h3>
              <button
                onClick={handleMarkComplete}
                disabled={marking || activeTopic.completed}
                className="bg-indigo-600 px-6 py-2 rounded-full font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activeTopic.completed ? 'Completed' : marking ? 'Saving...' : 'Mark as Complete'}
              </button>
            </div>
            <div className="flex-1 p-6">
              {!activeTopic.file_url ? (
                <div className="w-full h-full rounded-xl bg-[#0B1437] flex items-center justify-center text-gray-500">
                  No content available for this topic.
                </div>
              ) : activeTopic.type === 'video' ? (
                <video
                  key={activeTopic.id}
                  src={activeTopic.file_url}
                  controls
                  className="w-full h-full rounded-xl bg-black"
                />
              ) : (
                <iframe
                  key={activeTopic.id}
                  src={`${activeTopic.file_url}#toolbar=0`}
                  className="w-full h-full rounded-xl bg-white"
                  title={activeTopic.title}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 font-medium">
            Select a topic to start learning.
          </div>
        )}
      </main>
    </div>
  );
}
