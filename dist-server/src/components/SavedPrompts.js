import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Bookmark, Trash2, Copy, Check } from 'lucide-react';
export function SavedPrompts() {
    const [saved, setSaved] = useState([]);
    const [copied, setCopied] = useState(null);
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
            }
            catch (e) { }
        }
    };
    const copyResult = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };
    const removePrompt = (id) => {
        const next = saved.filter(s => s.id !== id);
        setSaved(next);
        localStorage.setItem('saved_prompts', JSON.stringify(next));
    };
    if (saved.length === 0)
        return null;
    return (_jsxs("div", { className: "w-full mb-10", children: [_jsxs("h2", { className: "text-xl font-semibold tracking-tight mb-4 flex items-center gap-2 text-[var(--text-primary)]", children: [_jsx(Bookmark, { size: 20 }), " Saved / Favorite Prompts"] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: saved.map((item) => (_jsxs("div", { className: "p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 hover:shadow-md transition group", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("h4", { className: "font-semibold text-sm text-[var(--text-primary)]", children: item.title || 'Untitled' }), _jsxs("div", { className: "flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity", children: [_jsx("button", { onClick: () => copyResult(item.content, item.id), className: "text-gray-400 hover:text-blue-500", children: copied === item.id ? _jsx(Check, { size: 16 }) : _jsx(Copy, { size: 16 }) }), _jsx("button", { onClick: () => removePrompt(item.id), className: "text-gray-400 hover:text-red-500", children: _jsx(Trash2, { size: 16 }) })] })] }), _jsx("p", { className: "text-xs text-slate-500 line-clamp-3", children: item.content })] }, item.id))) })] }));
}
