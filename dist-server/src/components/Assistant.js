import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, Mic, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../lib/firebase";
import { computeAnalytics } from "../services/analyticsEngine";
export default function Assistant({ user, userData, historyItems = [] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [streamingText, setStreamingText] = useState("");
    const [isListening, setIsListening] = useState(false);
    const bottomRef = useRef(null);
    const historyKey = `ai_history_${user?.uid || 'guest'}`;
    useEffect(() => {
        try {
            const saved = localStorage.getItem(historyKey);
            if (saved) {
                setMessages(JSON.parse(saved));
            }
            else {
                setMessages([
                    {
                        id: Date.now().toString(),
                        role: "model",
                        content: "Hi! I'm your AI assistant. How can I help you today?",
                    },
                ]);
            }
        }
        catch (e) {
            console.error("Failed to parse history", e);
        }
    }, [historyKey]);
    useEffect(() => {
        if (messages.length > 0) {
            // Keep only last 3 messages + welcome message usually. Or 3 interactions.
            const toSave = messages.slice(-4);
            localStorage.setItem(historyKey, JSON.stringify(toSave));
        }
        scrollToBottom();
    }, [messages, streamingText, isOpen, historyKey]);
    useEffect(() => {
        const handler = (e) => {
            setIsOpen(true);
            if (e.detail) {
                // Send directly. Using setState with setTimeout is tricky, let's just trigger immediately
                sendMessage(e.detail);
            }
        };
        window.addEventListener('open-assistant', handler);
        return () => window.removeEventListener('open-assistant', handler);
    }, [messages, historyKey]);
    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    const streamText = async (fullText) => {
        setIsTyping(true);
        setStreamingText("");
        let charIndex = 0;
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (charIndex <= fullText.length) {
                    setStreamingText(fullText.substring(0, charIndex));
                    charIndex++;
                }
                else {
                    clearInterval(interval);
                    setStreamingText("");
                    setMessages((prev) => [
                        ...prev,
                        { id: Date.now().toString(), role: "model", content: fullText },
                    ]);
                    setIsTyping(false);
                    resolve();
                }
            }, 10);
        });
    };
    const clearHistory = () => {
        localStorage.removeItem(historyKey);
        setMessages([{
                id: Date.now().toString(),
                role: "model",
                content: "Hi! I'm your AI assistant. How can I help you today?",
            }]);
    };
    const sendMessage = async (messageText) => {
        if (!messageText.trim() || isTyping)
            return;
        const message = messageText.trim();
        const userMessage = {
            id: Date.now().toString(),
            role: "user",
            content: message,
        };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput("");
        setIsTyping(true);
        const liveAnalytics = computeAnalytics(user?.uid);
        const dbPrompts = (userData?.usageCount || 0) + (userData?.normalUsageCount || 0) + (userData?.advancedUsageCount || 0);
        const actualPrompts = Math.max(liveAnalytics.totalPrompts, dbPrompts);
        const statsToPass = {
            ...userData,
            totalPrompts: actualPrompts,
            timeSavedMinutes: actualPrompts * 3,
            productivityInsights: liveAnalytics.insights
        };
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    messages: updatedMessages,
                    userStats: statsToPass,
                    aiContext: {
                        featuresEnabled: ["Prompt Generation", "Advanced AI Engineer", "Analytics Dashboard", "History Tracking", "Billing via Razorpay", "Dark Mode", "Voice Input"],
                        history: historyItems,
                        recentSearches: historyItems?.map(h => h.input).filter(Boolean).slice(0, 10) || []
                    }
                })
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || 'Failed');
            await streamText(data.reply);
        }
        catch (e) {
            console.error(e);
            await streamText("Sorry, I encountered an error. Please try again.");
        }
    };
    const handleSend = async (e) => {
        e?.preventDefault();
        sendMessage(input);
    };
    const toggleListen = () => {
        if (isListening)
            return;
        if (!('webkitSpeechRecognition' in window)) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }
        const SpeechRecognition = window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput((prev) => prev ? prev + " " + transcript : transcript);
        };
        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };
    return (_jsxs("div", { className: "fixed bottom-6 right-6 z-50", children: [_jsx(AnimatePresence, { children: !isOpen && (_jsx(motion.button, { initial: { scale: 0 }, animate: { scale: 1 }, exit: { scale: 0 }, onClick: () => setIsOpen(true), className: "bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl shadow-blue-500/30 transition-all hover:scale-110 active:scale-95", children: _jsx(MessageSquare, { size: 24 }) })) }), _jsx(AnimatePresence, { children: isOpen && (_jsxs(motion.div, { initial: { opacity: 0, y: 20, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 20, scale: 0.95 }, className: "absolute bottom-0 right-0 w-[400px] shadow-2xl rounded-2xl flex flex-col bg-[var(--bg-primary)] border border-[var(--border-color)] overflow-hidden", style: { height: "550px", maxHeight: "85vh", maxWidth: "90vw" }, children: [_jsxs("div", { className: "bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Bot, { size: 20 }), _jsx("span", { className: "font-semibold", children: "Prompt Assistant" })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: clearHistory, title: "Clear History", className: "text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-md transition-colors", children: _jsx(Trash2, { size: 16 }) }), _jsx("button", { onClick: () => setIsOpen(false), className: "text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-md transition-colors", children: _jsx(X, { size: 18 }) })] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50", children: [messages.map((m) => (_jsxs("div", { className: `flex gap-2 max-w-[85%] ${m.role === "user" ? "ml-auto" : "mr-auto"}`, children: [m.role === "model" && (_jsx("div", { className: "w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0", children: _jsx(Bot, { size: 16, className: "text-blue-600 dark:text-blue-400" }) })), _jsx("div", { className: `p-3 rounded-2xl text-sm ${m.role === "user"
                                                ? "bg-blue-600 text-white rounded-tr-sm"
                                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-sm shadow-sm"}`, children: _jsx("p", { className: "whitespace-pre-wrap", dangerouslySetInnerHTML: m.role === 'model' && m.content.includes('<a ') ? { __html: m.content } : undefined, children: m.role === 'model' && m.content.includes('<a ') ? undefined : m.content }) })] }, m.id))), isTyping && streamingText && (_jsxs("div", { className: "flex gap-2 max-w-[85%] mr-auto", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0", children: _jsx(Bot, { size: 16, className: "text-blue-600" }) }), _jsx("div", { className: "p-3 rounded-2xl text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-sm shadow-sm", children: _jsxs("p", { className: "whitespace-pre-wrap", dangerouslySetInnerHTML: streamingText.includes('<a ') ? { __html: streamingText } : undefined, children: [streamingText.includes('<a ') ? undefined : streamingText, _jsx("span", { className: "inline-block w-1.5 h-4 ml-1 align-middle bg-blue-500 animate-pulse" })] }) })] })), isTyping && !streamingText && (_jsxs("div", { className: "flex gap-2 max-w-[85%] mr-auto", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0", children: _jsx(Bot, { size: 16, className: "text-blue-600" }) }), _jsxs("div", { className: "p-4 rounded-2xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-sm flex gap-1", children: [_jsx("div", { className: "w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" }), _jsx("div", { className: "w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" }), _jsx("div", { className: "w-2 h-2 bg-slate-400 rounded-full animate-bounce" })] })] })), _jsx("div", { ref: bottomRef })] }), _jsx("form", { onSubmit: handleSend, className: "p-3 bg-[var(--bg-primary)] border-t border-[var(--border-color)]", children: _jsxs("div", { className: "relative flex items-center", children: [_jsx("input", { type: "text", value: input, onChange: (e) => setInput(e.target.value), placeholder: "Ask me anything...", className: "w-full pl-4 pr-20 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800 text-sm outline-none transition-all dark:text-white", disabled: isTyping }), _jsxs("div", { className: "absolute right-2 flex items-center", children: [_jsx("button", { type: "button", onClick: toggleListen, className: `p-1.5 mr-1 rounded-lg transition-colors ${isListening ? "text-red-500 bg-red-50 dark:bg-red-500/10" : "text-slate-400 hover:text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-700"}`, children: _jsx(Mic, { size: 18 }) }), _jsx("button", { type: "submit", disabled: !input.trim() || isTyping, className: "p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:text-slate-400 disabled:hover:bg-transparent transition-colors", children: _jsx(Send, { size: 18 }) })] })] }) })] })) })] }));
}
