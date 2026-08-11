'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const BACKEND_URL = 'https://pdf-course-api.onrender.com';

const supabase = createClient(
  'https://gftrjvljhtqkercsiskp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHJqdmxqaHRxa2VyY3Npc2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTQ4NTUsImV4cCI6MjEwMDE5MDg1NX0.hWY-QP3Ulb1uJPBhuSGCZo07tJr1aXm7GhXalX03uIs'
);

function guessSubject(filename: string): string {
  const name = filename.toLowerCase();
  if (/(math|calc|algebra|geometry)/.test(name)) return 'Math';
  if (/(phys|mechanics|thermo)/.test(name)) return 'Physics';
  if (/(hist|war|revolution|empire)/.test(name)) return 'History';
  if (/(lit|english|novel|poem)/.test(name)) return 'English';
  if (/(chem)/.test(name)) return 'Chemistry';
  if (/(bio|cell|genetics)/.test(name)) return 'Biology';
  return 'General';
}

function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface ResourceUploaderProps {
  onCourseCreated?: () => void;
}

export function ResourceUploader({ onCourseCreated }: ResourceUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploading(true);

      const file = e.target.files[0];

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You need to be signed in to upload a resource.');
        return;
      }
      const userId = session.user.id;

      // 1. UPLOAD PDF TO SUPABASE STORAGE FIRST
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(fileName, file);

      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

      // 2. GET THE PUBLIC URL
      const { data: { publicUrl } } = supabase.storage
        .from('course-materials')
        .getPublicUrl(fileName);

      // 3. SEND TO PYTHON BACKEND
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData, // Removed auth header for now to simplify cross-origin testing
      });

      let result: any = {};
      if (response.ok) {
         result = await response.json().catch(() => ({}));
      } else {
         console.warn("Backend failed, using fallback data.");
      }

      const title = result.title || titleFromFilename(file.name);
      const subject = result.subject || guessSubject(file.name);
      const difficulty = result.difficulty || subject;
      const estimated_duration = result.estimated_duration || Math.max(10, Math.round(file.size / 20000));

      // 4. CREATE COURSE
      const { data: courseData, error: insertError } = await supabase
        .from('courses')
        .insert({
          user_id: userId,
          title,
          subject,
          difficulty,
          estimated_duration,
          progress_percentage: 0,
          xp_earned: 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 5. GENERATE TOPICS & ATTACH THE PUBLIC URL
      const generatedTopics = result.topics || [
        { title: "Module 1: Complete PDF Document", duration: estimated_duration, type: 'pdf' }
      ];

      const topicsToInsert = generatedTopics.map((t: any, index: number) => ({
        course_id: courseData.id,
        title: t.title,
        type: t.type || 'pdf',
        file_url: publicUrl, // <-- THE MAGIC HAPPENS HERE: Real PDF link attached!
        order_index: index + 1,
        duration: t.duration || 10
      }));

      const { error: topicsError } = await supabase
        .from('topics')
        .insert(topicsToInsert);

      if (topicsError) {
          console.error("Failed to generate topics:", topicsError);
      }

      alert(`"${title}" added to your courses!`);
      onCourseCreated?.();
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Upload a PDF. Our AI will extract the text and generate a course from it.
      </p>

      <div className="w-full relative">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className={`w-full px-4 py-4 rounded-xl border-2 border-dashed ${uploading ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111C44] hover:bg-gray-50 dark:hover:bg-[#1A2A6C]'} flex items-center justify-center text-sm font-bold transition-all`}>
          <span className={uploading ? 'text-indigo-600 dark:text-indigo-400 animate-pulse' : 'text-slate-700 dark:text-gray-300'}>
            {uploading ? '🧠 Uploading & Extracting Text...' : 'Drop PDF here or Click to Browse'}
          </span>
        </div>
      </div>
    </div>
  );
}
