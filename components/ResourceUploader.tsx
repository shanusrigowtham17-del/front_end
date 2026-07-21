'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const BACKEND_URL = 'https://back-end-45gs.onrender.com';

const supabase = createClient(
  'https://gftrjvljhtqkercsiskp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHJqdmxqaHRxa2VyY3Npc2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTQ4NTUsImV4cCI6MjEwMDE5MDg1NX0.hWY-QP3Ulb1uJPBhuSGCZo07tJr1aXm7GhXalX03uIs'
);

// Very simple keyword guesser used ONLY as a fallback when the backend
// response doesn't include a subject. Good enough for a demo.
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

      const formData = new FormData();
      formData.append('file', file);

      // Backend only extracts text (and, if it can, subject/difficulty metadata).
      // It does NOT need to know about Supabase.
      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Upload failed');
      }

      // Backend may or may not return useful metadata — handle both cases.
      const result = await response.json().catch(() => ({} as any));

      const title = result.title || titleFromFilename(file.name);
      const subject = result.subject || guessSubject(file.name);
      const difficulty = result.difficulty || subject;
      const estimated_duration = result.estimated_duration || Math.max(10, Math.round(file.size / 20000)); // rough page-count proxy

      // This is the step that was missing: actually create the course
      // that the dashboard's "Active Courses" section reads.
      const { error: insertError } = await supabase.from('courses').insert({
        user_id: userId,
        title,
        subject,
        difficulty,
        estimated_duration,
        progress_percentage: 0,
        xp_earned: 0,
      });

      if (insertError) throw insertError;

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
