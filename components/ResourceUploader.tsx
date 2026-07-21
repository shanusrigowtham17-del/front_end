'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Hardcoded for web demo setup
const supabase = createClient(
  'https://your-project-ref.supabase.co', 
  'your-anon-public-key'
);

export function ResourceUploader({ userId }: { userId: string }) {
  const [uploading, setUploading] = useState(false);
  const [subject, setSubject] = useState('Computer Science');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploading(true);
      const file = e.target.files[0];
      const filePath = `${userId}/${subject}/${Date.now()}_${file.name}`;

      // 1. Upload direct to Supabase Storage bucket
      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Create database row
      const { data: resource, error: dbError } = await supabase
        .from('resources')
        .insert({ user_id: userId, subject, file_name: file.name, storage_path: filePath })
        .select()
        .single();

      if (dbError) throw dbError;

      // 3. Trigger Render backend pipeline 
      // NOTE: Replace this domain with your deployed FastAPI app on Render
      await fetch('https://studyspark-backend.onrender.com/api/process-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_id: resource.id,
          user_id: userId,
          file_path: filePath,
        }),
      });

      alert('Upload complete! AI is generating your custom course in the background.');
    } catch (err) {
      console.error(err);
      alert('Error uploading file. Check console.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        Upload a PDF to instantly generate an AI course, chatbot knowledge base, and quizzes.
      </p>
      <select 
        value={subject} 
        onChange={(e) => setSubject(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-[#F4F7FE] dark:bg-[#0B1437] text-slate-700 dark:text-gray-300 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
      >
        <option value="Computer Science">Computer Science</option>
        <option value="Web Development">Web Development</option>
        <option value="Mathematics">Mathematics</option>
        <option value="Physics">Physics</option>
      </select>
      <div className="w-full relative">
        <input 
          type="file" 
          accept=".pdf" 
          onChange={handleFileUpload} 
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
        />
        <div className={`w-full px-4 py-3 rounded-xl border ${uploading ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111C44]'} flex items-center justify-center text-sm font-semibold transition-all`}>
          <span className={uploading ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-gray-300'}>
            {uploading ? 'Uploading and Processing AI...' : 'Drag & Drop PDF or Click to Browse'}
          </span>
        </div>
      </div>
    </div>
  );
}
