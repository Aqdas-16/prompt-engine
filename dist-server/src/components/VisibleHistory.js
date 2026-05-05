import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
export function VisibleHistory({ trigger, user }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [history, setHistory] = useState([]);
    useEffect(() => {
        const fetchVisibleHistory = () => {
            try {
                const userId = user ? user.uid : "anonymous";
                const stored = localStorage.getItem(`prompt_history_user_${userId}`);
                if (stored) {
                    setHistory(JSON.parse(stored));
                }
                else {
                    setHistory([]);
                }
            }
            catch (e) {
                console.error('Failed to load prompt history', e);
            }
        };
        fetchVisibleHistory();
        window.addEventListener("pe-analytics-updated", fetchVisibleHistory);
        return () => window.removeEventListener("pe-analytics-updated", fetchVisibleHistory);
    }, [trigger, user]);
    return (_jsxs("div", { id: "prompt-history-section", className: "w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 mb-6 flex flex-col items-center", children: [_jsxs("button", { onClick: () => setIsExpanded(!isExpanded), className: "flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors", children: [_jsx(Clock, { size: 16 }), _jsx("span", { className: "underline underline-offset-4 decoration-blue-300 dark:decoration-blue-700", children: "Check your history" }), isExpanded ? _jsx(ChevronUp, { size: 16 }) : _jsx(ChevronDown, { size: 16 })] }), _jsx(AnimatePresence, { children: isExpanded && (_jsx(motion.div, { initial: { opacity: 0, height: 0, y: -10 }, animate: { opacity: 1, height: 'auto', y: 0 }, exit: { opacity: 0, height: 0, y: -10 }, transition: { duration: 0.3 }, className: "w-full max-w-3xl mt-6 overflow-hidden", children: history.length === 0 ? (_jsx("div", { className: "text-center p-6 text-gray-500 dark:text-gray-400 italic", children: "No recent prompts. Generate a prompt to see history." })) : (_jsx("div", { className: "flex flex-col gap-3", children: history.map((item) => (_jsxs("div", { className: "p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-sm shadow-sm transition hover:shadow-md text-left", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 uppercase tracking-wider", children: item.mode }), _jsx("span", { className: "text-xs text-gray-400", children: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })] }), _jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1", children: item.input }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 line-clamp-2", children: item.output })] }, item.id))) })) })) })] }));
}
