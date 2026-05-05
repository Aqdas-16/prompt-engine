import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Search, Clock, Zap } from 'lucide-react';
export function HistoryPage({ onClose, user }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [history, setHistory] = useState([]);
    const fetchHistory = () => {
        const userId = user ? user.uid : "anonymous";
        const storedHistory = localStorage.getItem(`prompt_history_user_${userId}`);
        if (storedHistory) {
            try {
                const parsed = JSON.parse(storedHistory);
                if (Array.isArray(parsed)) {
                    setHistory(parsed);
                }
            }
            catch (e) { }
        }
        else {
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
    const highlightMatch = (text, term) => {
        if (!term)
            return text;
        const parts = text.split(new RegExp(`(${term})`, 'gi'));
        return parts.map((part, index) => part.toLowerCase() === term.toLowerCase() ? _jsx("mark", { className: "bg-indigo-100 text-indigo-900 rounded px-0.5", children: part }, index) : part);
    };
    return (_jsx("div", { className: "min-h-screen bg-[var(--bg-primary)] pt-24 pb-12 px-4 sm:px-6", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between gap-4 mb-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: onClose, className: "p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:scale-105 transition", children: _jsx(ArrowLeft, { size: 18, className: "text-gray-600 dark:text-gray-300" }) }), _jsx("h2", { className: "text-2xl font-bold dark:text-white", children: "Full Prompt History" })] }), _jsx("button", { onClick: () => {
                                const userId = user ? user.uid : "anonymous";
                                localStorage.removeItem(`prompt_history_user_${userId}`);
                                setHistory([]);
                                window.dispatchEvent(new Event("pe-analytics-updated"));
                            }, className: "text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-semibold text-sm px-3 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors", children: "Clear History" })] }), _jsxs("div", { className: "mb-6 relative", children: [_jsx(Search, { size: 18, className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search your prompts by title or keyword...", className: "w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })] }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden", children: filteredHistory.length === 0 ? (_jsx("div", { className: "text-center py-10 text-gray-500", children: history.length === 0 ? "No prompts found. Generate a prompt to see history." : "No prompts found matching your search." })) : (_jsx("div", { className: "flex flex-col", children: filteredHistory.map((item, i) => (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 }, className: "p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "text-base font-semibold text-gray-900 dark:text-gray-100 truncate mb-1", children: highlightMatch(item.title || item.input || 'Untitled', searchTerm) }), _jsxs("div", { className: "flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400", children: [_jsxs("span", { className: "flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-md", children: [_jsx(Clock, { size: 12 }), " ", new Date(item.createdAt || item.timestamp || Date.now()).toLocaleString()] }), _jsx("span", { className: `px-2 py-1 rounded-md font-semibold ${item.mode === 'advanced' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`, children: item.mode })] })] }), _jsxs("button", { className: "hidden sm:flex text-indigo-600 dark:text-indigo-400 text-sm font-semibold gap-1 items-center hover:underline", children: [_jsx(Zap, { size: 14 }), " Reuse"] })] }, item.id || i))) })) })] }) }));
}
