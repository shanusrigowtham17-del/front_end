'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ChevronLeft, FileText, PlayCircle } from 'lucide-react';

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

export default function CourseDetail() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [activeTopic, setActiveTopic] = useState<any>(null);

  useEffect(() => {
    async function loadCourseDetails() {
      // 1. Fetch Course Info
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', params.id)
        .single();
      
      setCourse(courseData);

      // 2. Fetch Topics/Modules for this course
      // Assuming you have a 'topics' table tied to course_id
      const { data: topicsData } = await supabase
        .from('topics')
        .select('*')
        .eq('course_id', params.id)
        .order('order_index', { ascending: true });

      if (topicsData) {
        setTopics(topicsData);
        setActiveTopic(topicsData[0]); // Default to first topic
      }
    }

    if (params.id) loadCourseDetails();
  }, [params.id]);

  if (!course) return <div className="p-8 text-white">Loading course...</div>;

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
          {topics.map((topic, idx) => (
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
                <p className={`font-bold text-sm ${activeTopic?.id === topic.id ? 'text-indigo-400' : 'text-gray-300'}`}>
                  {topic.title}
                </p>
                <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                  {topic.type === 'pdf' ? <FileText className="w-3 h-3" /> : <PlayCircle className="w-3 h-3" />}
                  {topic.duration} mins
                </p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT: PDF / Video Viewer */}
      <main className="flex-1 flex flex-col bg-[#0B1437] p-8">
        {activeTopic ? (
          <div className="bg-[#111C44] flex-1 rounded-[28px] border border-gray-800 flex flex-col overflow-hidden shadow-lg">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-2xl font-extrabold">{activeTopic.title}</h3>
              <button className="bg-indigo-600 px-6 py-2 rounded-full font-bold text-sm hover:bg-indigo-700 transition">
                Mark as Complete
              </button>
            </div>
            <div className="flex-1 p-6">
              {/* Embed PDF or Video here based on activeTopic.file_url */}
              <iframe 
                src={`${activeTopic.file_url}#toolbar=0`} 
                className="w-full h-full rounded-xl bg-white"
                title={activeTopic.title}
              />
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
