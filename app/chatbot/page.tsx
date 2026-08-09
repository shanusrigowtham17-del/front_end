'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { 
  Send, Upload, FileText, Loader2, Bot, User, Database, 
  LayoutDashboard, MessageSquare, HelpCircle, Calendar, Zap 
} from "lucide-react";

// Hardcoded for demo purposes
const supabase = createClient(
  'https://gftrjvljhtqkercsiskp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHJqdmxqaHRxa2VyY3Npc2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTQ4NTUsImV4cCI6MjEwMDE5MDg1NX0.hWY-QP3Ulb1uJPBhuSGCZo07tJr1aXm7GhXalX03uIs'
);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://pdf-course-api.onrender.com";

type DBFile = { id: string; file_name: string };

export default function StudyChatbot() {
  const [user, setUser] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dbFiles, setDbFiles] = useState<DBFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  
  const [isUploaded, setIsUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch User Profile and ALL Existing Files
  const loadInitialData = useCallback(async () => {
    setPageLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const activeUserId = session.user.id;

      // Fetch Profile Data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUserId)
        .single();
        
      setUser({ ...profileData, email: session.user.email });
    }

    // Fetch ALL Uploaded Resources (Removed the user_id filter so all files show)
    const { data: resourceData } = await supabase
      .from('resources')
      .select('id, file_name')
      .order('created_at', { ascending: false });

    if (resourceData) {
      setDbFiles(resourceData);
    }
    
    setPageLoading(false);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Upload a NEW PDF
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${BACKEND_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        // Capture the new file's id from the backend so chat requests
        // are scoped to the document that was just uploaded.
        const newFileId = data.file_id || data.id || null;
        setSelectedFileId(newFileId);

        // Reflect the new file in the "Select from Database" list right away,
        // instead of waiting for a full page reload to see it.
        if (newFileId) {
          setDbFiles((prev) => [{ id: newFileId, file_name: file.name }, ...prev]);
        }

        setIsUploaded(true);
        setMessages([{ role: "bot", text: `"${file.name}" has been processed and analyzed. What would you like to know about it?` }]);
      } else {
        alert("Upload failed. Please check the server connection.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error connecting to the backend server.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Select an EXISTING PDF
  const handleSelectDbFile = (fileId: string, fileName: string) => {
    setFile(null);
    setSelectedFileId(fileId);
    setIsUploaded(true);
    setMessages([{ role: "bot", text: `You selected "${fileName}". How can I help you study this material?` }]);
  };

  // 4. Send chat queries
  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const currentInput = input;
    const newMessages = [...messages, { role: "user" as const, text: currentInput }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentInput, file_id: selectedFileId }),
      });

      const data = await res.json();
      setMessages([...newMessages, { role: "bot", text: data.response || data.answer }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages([...newMessages, { role: "bot", text: "⚠️ Connection lost. Could not reach the AI server." }]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 3).toLowerCase() || 'usr';
  };

  if (pageLoading) {
    return (
      <div className="h-screen w-full bg-[#0B1437] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#0B1437] font-sans overflow-hidden text-gray-200">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="w-[72px] md:w-[220px] xl:w-[280px] h-full bg-[#0B1437] border-r border-gray-800 flex flex-col justify-between py-8 shrink-0 transition-[width] duration-200">
        <div>
          <div className="px-4 md:px-6 xl:px-8 mb-12 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
            </div>
            <div className="hidden md:block overflow-hidden">
              <h2 className="text-[22px] font-extrabold text-white tracking-tight leading-tight truncate">StudySpark</h2>
              <p className="text-[10px] font-black text-gray-400 tracking-[0.15em] uppercase truncate">Edu Platform</p>
            </div>
          </div>

          <div className="px-2 md:px-3 xl:px-4 space-y-2">
            <p className="hidden md:block px-4 text-[11px] font-black text-gray-500 tracking-[0.1em] uppercase mb-4">Main Menu</p>
            
            <Link href="/" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-[#111C44] transition-all group">
              <LayoutDashboard className="w-5 h-5 shrink-0 group-hover:text-indigo-400 transition-colors" />
              <span className="hidden md:inline font-bold truncate">Dashboard</span>
            </Link>
            
            <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-indigo-400 bg-[#1A2556] relative cursor-pointer shadow-lg shadow-indigo-900/20 border border-indigo-500/20">
              <MessageSquare className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline font-bold text-white truncate">AI Chatbot</span>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-500 rounded-l-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
            </div>

            <Link href="/quiz" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-[#111C44] transition-all group">
              <HelpCircle className="w-5 h-5 shrink-0 group-hover:text-indigo-400 transition-colors" />
              <span className="hidden md:inline font-bold truncate">AI Quiz</span>
            </Link>

            <Link href="/schedule" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-[#111C44] transition-all group">
              <Calendar className="w-5 h-5 shrink-0 group-hover:text-indigo-400 transition-colors" />
              <span className="hidden md:inline font-bold truncate">Schedule</span>
            </Link>
          </div>
        </div>

        {user && (
          <div className="px-2 md:px-3 xl:px-5 mt-auto">
            <div className="bg-[#111C44] rounded-[24px] p-3 md:p-5 shadow-sm border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0 uppercase">
                  {getInitials(user.full_name)}
                </div>
                <div className="hidden md:block overflow-hidden">
                  <p className="text-[13px] font-extrabold text-white truncate">{user.full_name || 'Student'}</p>
                  <p className="text-[11px] font-medium text-gray-400 truncate">
                    {user.title || user.email || 'Dynamic Learner'}
                  </p>
                </div>
              </div>
              <div className="hidden md:flex justify-between items-center text-[10px] font-bold mb-2">
                <span className="text-indigo-400">Lv. {user.level || 1} Scholar</span>
                <span className="text-gray-400">{user.xp_points || 0} XP</span>
              </div>
              <div className="hidden md:block w-full h-1.5 bg-[#1A2556] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full" 
                  style={{ width: `${Math.min(100, ((user.xp_points || 0) % 1000) / 10)}%` }}
                />
              </div>
              <p className="hidden md:block text-[9px] font-bold text-gray-500 text-right mt-1.5 uppercase">
                1000 to Lv. {(user.level || 1) + 1}
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col h-full bg-[#0B1437] min-w-0">
        
        {/* HEADER */}
        <header className="h-20 border-b border-gray-800 flex items-center justify-between px-10 shrink-0 bg-[#0B1437]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Bot className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">AI Assistant</h1>
              <p className="text-xs font-medium text-gray-400">Ask questions based on your study materials.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-full border border-emerald-400/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            System Online
          </div>
        </header>

        {/* STEP 1: UPLOAD OR SELECT SCREEN */}
        {!isUploaded ? (
          <div className="flex-1 flex items-center justify-center p-10 overflow-y-auto">
            <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
              
              <div className="bg-[#111C44] border border-gray-800 rounded-[28px] p-8 flex flex-col items-center justify-center text-center shadow-lg transition-transform hover:scale-[1.02]">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
                  <Upload className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Upload New PDF</h2>
                <p className="text-sm text-gray-400 mb-8">Upload a new document from your device to begin analysis.</p>
                
                <form onSubmit={handleUpload} className="w-full">
                  <input
                    type="file"
                    accept=".pdf"
                    ref={fileInputRef}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3.5 mb-3 bg-[#1A2556] border border-gray-700 text-gray-300 font-bold rounded-xl hover:bg-[#23306B] transition-colors"
                  >
                    {file ? file.name : "Browse Files"}
                  </button>
                  
                  {file && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/20 flex justify-center items-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? "Processing..." : "Start Chat"}
                    </button>
                  )}
                </form>
              </div>

              <div className="bg-[#111C44] border border-gray-800 rounded-[28px] p-8 flex flex-col shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shrink-0">
                    <Database className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Select from Database</h2>
                    <p className="text-xs text-gray-400">Choose a previously uploaded file</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 max-h-[300px]">
                  {dbFiles.length > 0 ? (
                    dbFiles.map((dbFile) => (
                      <button
                        key={dbFile.id}
                        onClick={() => handleSelectDbFile(dbFile.id, dbFile.file_name)}
                        className="w-full flex items-center gap-4 p-4 bg-[#1A2556] hover:bg-[#23306B] border border-transparent hover:border-indigo-500/30 rounded-xl transition-all text-left group"
                      >
                        <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white truncate">
                          {dbFile.file_name}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-10 text-sm text-gray-500">
                      No existing files found in your database. Upload a file first!
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* STEP 2: ACTIVE CHAT INTERFACE */
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0B1437] p-8">
            <div className="flex-1 flex flex-col bg-[#111C44] border border-gray-800 rounded-[28px] shadow-xl overflow-hidden relative">
              
              <div className="px-6 py-4 border-b border-gray-800 bg-[#111C44] flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-300">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Active Context: <span className="text-white">{file?.name || 'Database File'}</span>
                </div>
                <button 
                  onClick={() => {
                    setIsUploaded(false);
                    setMessages([]);
                    setFile(null);
                    setSelectedFileId(null);
                  }}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Change File
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0B1437]/30">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      
                      <div className="shrink-0 mt-1">
                        {msg.role === "user" ? (
                          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#1A2556] border border-gray-700 flex items-center justify-center shadow-lg">
                            <Bot className="w-4 h-4 text-indigo-400" />
                          </div>
                        )}
                      </div>

                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-tr-sm shadow-md"
                          : "bg-[#1A2556] border border-gray-700 text-gray-200 rounded-tl-sm shadow-sm"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[80%] flex-row">
                      <div className="shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-[#1A2556] border border-gray-700 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-indigo-400" />
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#1A2556] border border-gray-700 rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-[#111C44] border-t border-gray-800 shrink-0">
                <div className="flex gap-3 max-w-5xl mx-auto relative">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={loading}
                    placeholder="Ask a question about your document..."
                    className="flex-1 bg-[#0B1437] border border-gray-700 text-white placeholder-gray-500 px-6 py-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors pr-16 shadow-inner"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={loading || !input.trim()}
                    className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-xl flex items-center justify-center transition-colors shadow-md"
                  >
                    <Send className="w-5 h-5 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2D3748;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4A5568;
        }
      `}</style>
    </div>
  );
}
