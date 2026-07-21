'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { BrainCircuit, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const BACKEND_URL = 'https://back-end-45gs.onrender.com';

interface Document {
  id: string;
  filename: string;
  created_at: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer_index: number;
}

export default function QuizPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Fallback demo user to pass to Sidebar
  const demoUser = { full_name: 'Alex Johnson', level: 14, xp_points: 10750 };

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/documents`);
        const data = await res.json();
        if (data.documents) {
          setDocuments(data.documents);
          if (data.documents.length > 0) setSelectedDoc(data.documents[0].id);
        }
      } catch (err) {
        console.error("Failed to load documents", err);
      }
    }
    fetchDocuments();
  }, []);

  const generateQuiz = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    setQuiz(null);
    setIsSubmitted(false);
    setUserAnswers({});
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: selectedDoc, num_questions: numQuestions })
      });
      
      if (!res.ok) throw new Error('Failed to generate quiz');
      
      const data = await res.json();
      setQuiz(data.quiz);
    } catch (err) {
      console.error(err);
      alert('Error generating quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (qIndex: number, optIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const submitQuiz = () => {
    if (!quiz) return;
    let currentScore = 0;
    quiz.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct_answer_index) {
        currentScore++;
      }
    });
    setScore(currentScore);
    setIsSubmitted(true);
  };

  return (
    <div className="flex h-screen w-full bg-[#F4F7FE] dark:bg-[#0B1437] transition-colors duration-300">
      <Sidebar user={demoUser} />
      
      <main className="flex-1 overflow-y-auto p-8 font-sans">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <BrainCircuit className="w-10 h-10 text-pink-500" /> AI Quiz Generator
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Test your knowledge instantly using your uploaded study materials.
          </p>
        </header>

        {/* Configuration Card */}
        <div className="bg-white dark:bg-[#111C44] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 mb-8 flex gap-6 items-end">
          <div className="flex-1">
            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Select Study Material</label>
            <select 
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#F4F7FE] dark:bg-[#0B1437] text-slate-700 dark:text-gray-200"
            >
              {documents.length === 0 ? <option>No documents uploaded yet</option> : null}
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.filename}</option>
              ))}
            </select>
          </div>
          
          <div className="w-32">
            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Questions</label>
            <input 
              type="number" 
              min="1" max="20"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#F4F7FE] dark:bg-[#0B1437] text-slate-700 dark:text-gray-200"
            />
          </div>

          <button 
            onClick={generateQuiz}
            disabled={loading || !selectedDoc}
            className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-pink-500/30 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Now'}
          </button>
        </div>

        {/* Active Quiz Area */}
        {quiz && (
          <div className="space-y-6 max-w-4xl">
            {quiz.map((q, qIdx) => (
              <div key={qIdx} className="bg-white dark:bg-[#111C44] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                  <span className="text-pink-500 mr-2">{qIdx + 1}.</span>
                  {q.question}
                </h3>
                
                <div className="space-y-3">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = userAnswers[qIdx] === oIdx;
                    const isCorrect = q.correct_answer_index === oIdx;
                    
                    let bgClass = "bg-[#F4F7FE] dark:bg-[#0B1437] hover:bg-gray-100 dark:hover:bg-[#1A2A6C]";
                    let borderClass = "border-transparent";

                    if (isSelected) {
                      bgClass = "bg-indigo-50 dark:bg-indigo-900/30";
                      borderClass = "border-indigo-500";
                    }

                    if (isSubmitted) {
                      if (isCorrect) {
                        bgClass = "bg-emerald-50 dark:bg-emerald-900/30";
                        borderClass = "border-emerald-500";
                      } else if (isSelected && !isCorrect) {
                        bgClass = "bg-red-50 dark:bg-red-900/30";
                        borderClass = "border-red-500";
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectAnswer(qIdx, oIdx)}
                        className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all flex justify-between items-center ${bgClass} ${borderClass}`}
                      >
                        <span className="text-slate-700 dark:text-gray-200 font-medium">{opt}</span>
                        {isSubmitted && isCorrect && <CheckCircle2 className="text-emerald-500 w-5 h-5" />}
                        {isSubmitted && isSelected && !isCorrect && <XCircle className="text-red-500 w-5 h-5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Submit / Results Footer */}
            <div className="bg-white dark:bg-[#111C44] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
              {isSubmitted ? (
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  Score: <span className={score === quiz.length ? "text-emerald-500" : "text-indigo-500"}>{score} / {quiz.length}</span>
                </div>
              ) : (
                <p className="text-gray-500 font-medium">Review your answers before submitting.</p>
              )}
              
              <button 
                onClick={isSubmitted ? generateQuiz : submitQuiz}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-indigo-500/30"
              >
                {isSubmitted ? 'Generate Another Quiz' : 'Submit Answers'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
