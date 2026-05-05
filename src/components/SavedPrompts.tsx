import React, { useState, useEffect } from 'react';
import { Bookmark, Trash2, Copy, Check } from 'lucide-react';

export function SavedPrompts() {
  const [saved, setSaved] = useState<any[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = () => {
    // Note: since user auth token is needed for the backend API, we'll try to fetch local templates first
    // For now we'll just mock it or grab them if the API was already hooked. 
    // We already have a /api/templates endpoint in saving.
    // Let's assume there's a GET /api/templates endpoint or we do local storage.
    const local = localStorage.getItem('saved_prompts');
    if (local) {
      try {
        setSaved(JSON.parse(local));
      } catch(e) {}
    }
  };

  const copyResult = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const removePrompt = (id: string) => {
    const next = saved.filter(s => s.id !== id);
    setSaved(next);
    localStorage.setItem('saved_prompts', JSON.stringify(next));
  };

  if (saved.length === 0) return null;

  return (
    <div className="w-full mb-10">
      <h2 className="text-xl font-semibold tracking-tight mb-4 flex items-center gap-2 text-[var(--text-primary)]">
        <Bookmark size={20} /> Saved / Favorite Prompts
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {saved.map((item) => (
          <div key={item.id} className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 hover:shadow-md transition group">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-sm text-[var(--text-primary)]">{item.title || 'Untitled'}</h4>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => copyResult(item.content, item.id)} className="text-gray-400 hover:text-blue-500">
                  {copied === item.id ? <Check size={16}/> : <Copy size={16}/>}
                </button>
                <button onClick={() => removePrompt(item.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 line-clamp-3">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
