'use client';

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, Send, Upload, FileText, Loader2, Bot, User, Database } from "lucide-react";

// Hardcoded for demo purposes
const supabase = createClient(
  'https://gftrjvljhtqkercsiskp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHJqdmxqaHRxa2VyY3Npc2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTQ4NTUsImV4cCI6MjEwMDE5MDg1NX0.hWY-QP3Ulb1uJPBhuSGCZo07tJr1aXm7GhXalX03uIs'
);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://pdf-course-api.onrender.com";

type DBFile = { id: string; file_name: string };

export default function StudyChatbot() {
  const [file, setFile] = useState<File | null>(null);
  const [dbFiles, setDbFiles] = useState<DBFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  
  const [isUploaded, setIsUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingDocs, setFetchingDocs] = useState(true);
  
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing files from the user's resources table on mount
 // 1. Fetch existing files from the resources table on mount
  useEffect(() => {
    const fetchExistingFiles = async () => {
      setFetchingDocs(true);
      
      // Temporarily fetching ALL resources to test the database connection
      const { data, error } = await supabase
        .from('resources')
        .select('id, file_name')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase error fetching resources:", error.message);
      } else if (data) {
        console.log("Successfully fetched files:", data);
        setDbFiles(data);
      }
      
      setFetchingDocs(false);
    };

    fetchExistingFiles();
  }, []);
  // 1A. Upload a NEW PDF to the backend
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

  // 1B. Select an EXISTING PDF from the database
  const handleSelectDbFile = (fileId: string, fileName: string) => {
    setSelectedFileId(fileId);
    setIsUploaded(true);
    setMessages([{ role: "bot", text: `You selected "${fileName}" from your database. How can I help you study this material?` }]);
  };

  // 2. Send chat queries to the backend
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
        // If selecting a DB file, we pass the ID so the backend knows which context to use
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

  return (
    <div className="flex flex-col h-screen w-full bg-[#0B1437] font-sans overflow-hidden text-gray-200">
      
      {/* HEADER */}
      <header className="h-16 border-b border-gray-800 flex items-center px-6 shrink-0 bg-[#0B1437] z-10 shadow-md">
        <Link 
          href="/" 
          className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="p-2 bg-[#111C44] rounded-lg border border-gray-700 group-hover:bg-[#1A2556] transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </div>
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-extrabold text-white tracking-tight">Study Chatbot</h1>
          </div>
        </Link>
        <div className="ml-auto text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
          AI Online
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-6">
        
        {/* STEP 1: UPLOAD OR SELECT SCREEN */}
        {!isUploaded ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
              
              {/* Option A: Upload New */}
              <div className="bg-[#111C44] border border-gray-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg transition-transform hover:scale-[1.02]">
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
                    className="w-full py-3 mb-3 bg-[#1A2556] border border-gray-700 text-gray-300 font-bold rounded-xl hover:bg-[#23306B] transition-colors"
                  >
                    {file ? file.name : "Browse Files"}
                  </button>
                  
                  {file && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/20 flex justify-center items-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? "Processing..." : "Start Chat"}
                    </button>
                  )}
                </form>
              </div>

              {/* Option B: Select from Database */}
              <div className="bg-[#111C44] border border-gray-800 rounded-3xl p-8 flex flex-col shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 shrink-0">
                    <Database className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Select from Database</h2>
                    <p className="text-xs text-gray-400">Choose a previously uploaded file</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                  {fetchingDocs ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                    </div>
                  ) : dbFiles.length > 0 ? (
                    dbFiles.map((dbFile) => (
                      <button
                        key={dbFile.id}
                        onClick={() => handleSelectDbFile(dbFile.id, dbFile.file_name)}
                        className="w-full flex items-center gap-3 p-3 bg-[#1A2556] hover:bg-[#23306B] border border-transparent hover:border-indigo-500/30 rounded-xl transition-all text-left group"
                      >
                        <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white truncate">
                          {dbFile.file_name}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-10 text-sm text-gray-500">
                      No existing files found in your database.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* STEP 2: ACTIVE CHAT INTERFACE */
          <div className="flex-1 flex flex-col overflow-hidden bg-[#111C44] border border-gray-800 rounded-3xl shadow-xl">
            
            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    
                    {/* Avatar */}
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

                    {/* Message Bubble */}
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-sm shadow-md"
                        : "bg-[#1A2556] border border-gray-700 text-gray-200 rounded-tl-sm"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[80%] flex-row">
                    <div className="shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-[#1A2556] border border-gray-700 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-indigo-400" />
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#1A2556] border border-gray-700 rounded-tl-sm flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Input Box */}
            <div className="p-4 bg-[#0B1437] border-t border-gray-800 shrink-0">
              <div className="flex gap-3 max-w-4xl mx-auto relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={loading}
                  placeholder="Ask a question about your document..."
                  className="flex-1 bg-[#111C44] border border-gray-700 text-white placeholder-gray-500 px-6 py-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors pr-16"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !input.trim()}
                  className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-xl flex items-center justify-center transition-colors"
                >
                  <Send className="w-5 h-5 ml-1" />
                </button>
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
