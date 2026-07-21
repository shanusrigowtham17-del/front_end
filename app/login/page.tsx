'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { BrainCircuit, Loader2 } from 'lucide-react';

// Hardcoded for web demo setup
const supabase = createClient(
  'https://your-project-ref.supabase.co',
  'your-anon-public-key'
);

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Log an existing user in
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.push('/dashboard');
        
      } else {
        // Sign up a brand new user and pass their name to our SQL trigger
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName } // This triggers the SQL COALESCE block we just ran
          }
        });
        if (authError) throw authError;
        alert("Success! You can now log in.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F4F7FE] dark:bg-[#0B1437]">
      <div className="bg-white dark:bg-[#111C44] p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-md">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">StudySpark</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isLogin ? 'Welcome back to your AI Dashboard' : 'Create your AI learning account'}
          </p>
        </div>

        {error && <div className="p-3 mb-4 text-sm font-semibold text-red-600 bg-red-50 rounded-xl border border-red-200 text-center">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1">Full Name</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#F4F7FE] dark:bg-[#0B1437] text-slate-900 dark:text-white outline-none focus:border-indigo-500" placeholder="Alex Johnson" />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#F4F7FE] dark:bg-[#0B1437] text-slate-900 dark:text-white outline-none focus:border-indigo-500" placeholder="alex@university.edu" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#F4F7FE] dark:bg-[#0B1437] text-slate-900 dark:text-white outline-none focus:border-indigo-500" placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-500/30 flex justify-center items-center mt-6">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-indigo-600 font-bold hover:underline">
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
