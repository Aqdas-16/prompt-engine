import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Search, Clock, Zap } from 'lucide-react';

export function HistoryPage({ onClose, user }: { onClose: () => void, user?: any }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = () => {
    const userId = user ? user.uid : "anonymous";
    const storedHistory = localStorage.getItem(`prompt_history_user_${userId}`);
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      } catch (e) {}
    } else {
      setHistory([]);
    }
  };

  useEffect(() => {
    fetchHistory();
    window.addEventListener("pe-analytics-updated", fetchHistory);
    return () => window.removeEventListener("pe-analytics-updated", fetchHistory);
  }, [user]);

  const filteredHistory = history.filter(item => {
    const term = searchTerm.toLowerCase();
    return (item.title || '').toLowerCase().includes(term) || (item.input || '').toLowerCase().includes(term);
  });

  const highlightMatch = (text: string, term: string) => {
    if (!term) return text;
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === term.toLowerCase() ? <mark key={index} className="bg-indigo-100 text-indigo-900 rounded px-0.5">{part}</mark> : part
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
             <button onClick={onClose} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:scale-105 transition">
               <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300"/>
             </button>
             <h2 className="text-2xl font-bold dark:text-white">Full Prompt History</h2>
          </div>
          <button 
            onClick={() => {
              const userId = user ? user.uid : "anonymous";
              localStorage.removeItem(`prompt_history_user_${userId}`);
              setHistory([]);
              window.dispatchEvent(new Event("pe-analytics-updated"));
            }}
            className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-semibold text-sm px-3 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            Clear History
          </button>
        </div>
        
        <div className="mb-6 relative">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
           <input 
             type="text" 
             placeholder="Search your prompts by title or keyword..." 
             className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
           {filteredHistory.length === 0 ? (
             <div className="text-center py-10 text-gray-500">{history.length === 0 ? "No prompts found. Generate a prompt to see history." : "No prompts found matching your search."}</div>
           ) : (
             <div className="flex flex-col">
               {filteredHistory.map((item, i) => (
                 <motion.div 
                   key={item.id || i}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.05 }}
                   className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                 >
                   <div className="flex-1 min-w-0">
                     <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
                       {highlightMatch(item.title || item.input || 'Untitled', searchTerm)}
                     </h3>
                     <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                       <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-md">
                         <Clock size={12} /> {new Date(item.createdAt || item.timestamp || Date.now()).toLocaleString()}
                       </span>
                       <span className={`px-2 py-1 rounded-md font-semibold ${item.mode === 'advanced' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                         {item.mode}
                       </span>
                     </div>
                   </div>
                   <button className="hidden sm:flex text-indigo-600 dark:text-indigo-400 text-sm font-semibold gap-1 items-center hover:underline">
                      <Zap size={14} /> Reuse
                   </button>
                 </motion.div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
