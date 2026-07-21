'use client';

import { useState } from 'react';

// Replace with your live Render URL
const BACKEND_URL = 'https://back-end-45gs.onrender.com'; 

export function ResourceUploader() {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploading(true);
      
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      // Send the file directly to your FastAPI backend
      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData, // fetch automatically sets the correct multipart/form-data boundary
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      alert('Upload complete! Your PDF is now ready for AI Quizzes.');
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
        Upload a PDF. Our AI will extract the text and store it securely.
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
