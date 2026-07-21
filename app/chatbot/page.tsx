'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Sidebar } from '@/components/Sidebar';
import { MessageSquare, Loader2, Send, Bot, User } from 'lucide-react';

const BACKEND_URL = 'https://pdf-course-api.onrender.com';

// Initialize Supabase with your actual keys
const supabase = createClient(
  'https://gftrjvljhtqkercsiskp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHJqdmxqaHRxa2VyY3Npc2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTQ4NTUsImV4cCI6MjEwMDE5MDg1NX0.hWY-QP3Ulb1uJPBhuSGCZo07tJr1aXm7GhXalX03uIs'
);

interface Document {
  id: string;
  filename: string;
  created_at: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatbotPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string>('');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Supabase Authentication & Document Fetching
  useEffect(() => {
    async function loadChatbotData() {
      // Check auth session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch real user profile for the Sidebar
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setUser(profileData);

      // Fetch uploaded documents directly from Supabase table
      const { data: docs, error } = await supabase
        .from('documents')
        .select('id, filename, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching documents:", error);
      } else if (docs) {
        setDocuments(docs);
        if (docs.length > 0) setSelectedDoc(docs[0].id);
      }
    }

    loadChatbotData();

    // Listen for sign-outs
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle changing the document (clears chat)
  const handleDocChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDoc(e.target.value);
    setMessages([]); // Clear chat when switching context
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !selectedDoc || loading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Send the question to your Python backend
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          document_id: selectedDoc, 
          message: userMessage
        })
      });
      
      if (!res.ok) throw new Error('Failed to get response');
      
      const data = await res.json();
      
      // Add AI response to UI (Check for 'reply', 'answer', or 'response' keys based on your python code)
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.answer || data.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error connecting to the server. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  // Prevent rendering until user is loaded to avoid layout jumps
  if (!user) return (
    <div className="h-screen w-full bg-[#F4F7FE] dark:bg-[#0B1437] flex items-center justify-center font-bold text-slate-400">
      Loading AI Chat...
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#F4F7FE] dark:bg-[#0B1437] transition-colors duration-300">
      
      {/* Sidebar now uses REAL authenticated user data */}
      <Sidebar user={user} />
      
      <main className="flex-1 overflow-hidden p-8 font-sans flex flex-col h-screen">
        
        {/* Header */}
        <header className="mb-8 shrink-0">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <MessageSquare className="w-10 h-10 text-indigo-500" /> AI Learning Assistant
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Ask complex questions and get instant explanations based on your study materials.
          </p>
        </header>

        {/* Configuration Card */}
        <div className="bg-white dark:bg-[#111C44] p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 mb-6 flex gap-6 items-center shrink-0">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              Active Context Material
            </label>
            <select 
              value={selectedDoc}
              onChange={handleDocChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#F4F7FE] dark:bg-[#0B1437] text-slate-700 dark:text-gray-200 font-medium outline-none focus:border-indigo-500"
            >
              {documents.length === 0 ? <option>No documents uploaded yet</option> : null}
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.filename}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 bg-white dark:bg-[#111C44] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
          
          {/* Message History Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <Bot className="w-16 h-16 text-indigo-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">How can I help you study today?</h3>
                <p className="text-slate-500 dark:text-gray-400 max-w-sm mt-2">
                  Select a document above and ask me to summarize concepts, explain formulas, or find specific details.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  
                  {/* Assistant Avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                      <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`max-w-[75%] p-5 rounded-3xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-sm' 
                      : 'bg-[#F4F7FE] dark:bg-[#0B1437] text-slate-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-bl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>

                  {/* User Avatar */}
                  {msg.role === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                      <User className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </div>
                  )}
                </div>
              ))
            )}
            
            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-4 justify-start">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="bg-[#F4F7FE] dark:bg-[#0B1437] border border-gray-100 dark:border-gray-800 p-5 rounded-3xl rounded-bl-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-gray-50 dark:bg-[#1A2A6C]/20 border-t border-gray-100 dark:border-gray-800">
            <form onSubmit={sendMessage} className="flex gap-3 relative">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={selectedDoc ? "Ask a question about this material..." : "Select a document first..."}
                disabled={!selectedDoc || loading}
                className="flex-1 bg-white dark:bg-[#0B1437] border border-gray-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              />
              <button 
                type="submit"
                disabled={!selectedDoc || !inputValue.trim() || loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl px-6 flex items-center justify-center transition shadow-md disabled:shadow-none"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
