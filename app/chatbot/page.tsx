"use client";
import { useState, useRef } from "react";

// Points exclusively to your Render backend
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://pdf-course-api.onrender.com";

export default function FridayPdfChatApp() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Sends the PDF to Render (where your Python backend handles Supabase storage)
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
        setMessages([{ role: "bot", text: `Protocol initialized. "${file.name}" has been processed and encrypted into the mainframe. Awaiting your query.` }]);
      } else {
        alert("Upload failed. Please check the uplink.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error connecting to Render server.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Sends chat queries to Render (where your Python backend queries Supabase/AI)
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
        body: JSON.stringify({ question: currentInput }),
      });

      const data = await res.json();
      setMessages([...newMessages, { role: "bot", text: data.response || data.answer }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages([...newMessages, { role: "bot", text: "⚠️ Uplink severed. Could not reach the server." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-black text-cyan-400 font-mono selection:bg-cyan-900">
      
      {/* BACKGROUND ARC REACTOR (Pure CSS) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none flex items-center justify-center">
        <div className="w-[400px] h-[400px] rounded-full border border-cyan-800 shadow-[0_0_80px_rgba(34,211,238,0.2),inset_0_0_80px_rgba(34,211,238,0.2)] flex items-center justify-center animate-[spin_20s_linear_infinite]">
          <div className="w-[300px] h-[300px] rounded-full border-4 border-dashed border-cyan-500/50 shadow-[0_0_50px_#22d3ee,inset_0_0_50px_#22d3ee] flex items-center justify-center animate-pulse">
            <div className="w-[200px] h-[200px] rounded-full border-[10px] border-cyan-300 shadow-[0_0_40px_#67e8f9,inset_0_0_40px_#67e8f9] flex items-center justify-center animate-[spin_10s_linear_infinite_reverse]">
              <div className="w-24 h-24 rounded-full bg-cyan-100 shadow-[0_0_60px_#cffafe,0_0_100px_#fff] animate-ping opacity-60"></div>
              <div className="absolute w-20 h-20 rounded-full bg-cyan-100 shadow-[0_0_80px_#fff]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* FOREGROUND CONTENT */}
      <div className="relative z-10 flex flex-col h-full max-w-4xl mx-auto w-full p-6">
        
        <header className="pb-4 mb-4 border-b border-cyan-900/50 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 uppercase">
              Stark Ind. Mainframe
            </h1>
            <p className="text-xs text-cyan-700 uppercase tracking-widest mt-1">PDF Analysis Protocol v3.0</p>
          </div>
          <div className="text-right text-xs text-cyan-600 uppercase">
            <p>System: Online</p>
            <p>Power: 100%</p>
          </div>
        </header>

        {/* STEP 1: UPLOAD SCREEN */}
        {!isUploaded ? (
          <div className="flex-1 flex flex-col items-center justify-center backdrop-blur-sm bg-cyan-950/10 border border-cyan-900/50 rounded-lg p-8 shadow-[0_0_30px_rgba(8,145,178,0.1)]">
            <form onSubmit={handleUpload} className="text-center space-y-8">
              <div className="text-5xl animate-bounce drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                <svg className="w-20 h-20 mx-auto text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
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
                className="px-6 py-3 bg-transparent border border-cyan-500 text-cyan-400 uppercase tracking-widest text-sm hover:bg-cyan-900/40 hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-300 rounded"
              >
                {file ? `Target Acquired: ${file.name}` : "Select Document"}
              </button>
              
              {file && (
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-cyan-600 text-black font-bold uppercase tracking-widest text-sm rounded hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.8)] disabled:opacity-50 disabled:shadow-none transition-all duration-300"
                  >
                    {loading ? "Processing..." : "Initialize Analysis"}
                  </button>
                </div>
              )}
            </form>
          </div>
        ) : (
          /* STEP 2: ACTIVE CHAT INTERFACE */
          <div className="flex-1 flex flex-col justify-between overflow-hidden backdrop-blur-md bg-black/40 border border-cyan-900/50 rounded-lg shadow-[0_0_30px_rgba(8,145,178,0.15)]">
            
            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto space-y-6 p-6 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <span className="text-[10px] text-cyan-700 mb-1 uppercase tracking-wider">
                    {msg.role === "user" ? "Tony Stark" : "F.R.I.D.A.Y"}
                  </span>
                  <div
                    className={`p-4 max-w-[80%] leading-relaxed text-sm ${
                      msg.role === "user"
                        ? "bg-cyan-900/40 border border-cyan-700/50 text-cyan-100 rounded-l-xl rounded-br-xl shadow-[0_0_10px_rgba(8,145,178,0.3)]"
                        : "bg-black/60 border border-cyan-800/50 text-cyan-300 rounded-r-xl rounded-bl-xl drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-cyan-700 mb-1 uppercase tracking-wider">F.R.I.D.A.Y</span>
                  <div className="text-cyan-500 text-sm flex items-center gap-2 p-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                    <span>Analyzing databanks...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Input Box */}
            <div className="p-4 border-t border-cyan-900/50 bg-black/60">
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 p-4 bg-cyan-950/20 border border-cyan-800/50 text-cyan-300 placeholder-cyan-800 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] rounded transition-all"
                  placeholder="Enter command directive..."
                  disabled={loading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading}
                  className="px-8 bg-cyan-950 border border-cyan-700 hover:bg-cyan-900 hover:border-cyan-400 text-cyan-400 hover:text-cyan-100 uppercase tracking-widest text-sm font-bold rounded transition-all duration-300 shadow-[0_0_10px_rgba(8,145,178,0.2)] hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FRIDAY WELCOME NOTE */}
        <div className="mt-4 text-center">
          <p className="text-sm font-light text-cyan-500/80 tracking-[0.2em] uppercase animate-pulse">
            Welcome Master, F.R.I.D.A.Y at your service.
          </p>
        </div>

      </div>
    </div>
  );
}
