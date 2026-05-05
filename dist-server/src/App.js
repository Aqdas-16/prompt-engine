import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Terminal, Send, Copy, Check, Eraser, LogOut, Sun, Moon, User, Zap, Mic, Activity } from "lucide-react";
import { useAuth } from "./components/FirebaseProvider";
import { auth } from "./lib/firebase";
import AuthPage from "./components/AuthPage";
import PricingPage from "./components/PricingPage";
import Footer from "./components/Footer";
import Assistant from "./components/Assistant";
import { ReviewModal } from "./components/ReviewModal";
import { ReviewSection } from "./components/ReviewSection";
import { VisibleHistory } from "./components/VisibleHistory";
import { PromptTemplates } from "./components/PromptTemplates";
import { SavedPrompts } from "./components/SavedPrompts";
import { CountUp } from "./components/CountUp";
import { counterService } from "./services/counterService";
import { GlobalIntroVideo } from "./components/GlobalIntroVideo";
import { buildFinalPrompt } from "./services/aiSystem";
import React, { Suspense } from 'react';
const AnalyticsPage = React.lazy(() => import('./components/AnalyticsPage').then(module => ({ default: module.AnalyticsPage })));
const HistoryPage = React.lazy(() => import('./components/HistoryPage').then(module => ({ default: module.HistoryPage })));
export default function App() {
    const { user, signOutUser } = useAuth();
    const [userInput, setUserInput] = useState("");
    const [sessionContextAnswers, setSessionContextAnswers] = useState({});
    const [mode, setMode] = useState("normal");
    const [loading, setLoading] = useState(false);
    const [versions, setVersions] = useState([]);
    const [activeVersion, setActiveVersion] = useState(0);
    const [copied, setCopied] = useState(false);
    const [language, setLanguage] = useState("EN");
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
    const [errorState, setErrorState] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showPricing, setShowPricing] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [userData, setUserData] = useState(null);
    const categories = ["Coding", "Marketing", "Resume", "Business", "Startup"];
    const suggestions = {
        "Coding": ["React component", "API architecture", "Database schema"],
        "Marketing": ["Social media plan", "SEO strategy", "Email campaign"],
        "Resume": ["Software Engineer CV", "Product Manager cover letter"],
        "Business": ["Business plan", "Financial projection", "Pitch deck outline"],
        "Startup": ["SaaS idea", "AI tool", "Marketplace app"],
    };
    const [activeCategory, setActiveCategory] = useState("Startup");
    const [showHistory, setShowHistory] = useState(false);
    const [historyItems, setHistoryItems] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const [globalCounters, setGlobalCounters] = useState({ promptsGenerated: 0, usersCount: 0 });
    const [historyTrigger, setHistoryTrigger] = useState(0);
    useEffect(() => {
        const syncStats = () => {
            const counts = counterService.getCounts();
            setGlobalCounters({ promptsGenerated: counts.totalPrompts || 110, usersCount: counts.totalUsers || 15 });
        };
        syncStats();
        counterService.fetchCounts();
        window.addEventListener('statsUpdated', syncStats);
        // Add popstate listener to handle browser back button mapping to showing/hiding pages
        const onPopState = () => {
            const path = window.location.pathname;
            setShowAnalytics(path === '/analytics');
            setShowPricing(path === '/pricing');
            setShowHistory(path === '/history');
        };
        window.addEventListener('popstate', onPopState);
        onPopState(); // initial evaluation
        return () => {
            window.removeEventListener('popstate', onPopState);
            window.removeEventListener('statsUpdated', syncStats);
        };
    }, []);
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
            setUserInput((prev) => prev ? prev + " " + transcript : transcript);
        };
        recognition.onerror = (event) => {
            console.error(event.error);
            if (event.error === 'not-allowed') {
                alert("Microphone access was denied. Please allow microphone access or try opening the app in a new tab.");
            }
            setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };
    const fetchHistory = async () => {
        const userId = user ? user.uid : "anonymous";
        const st = localStorage.getItem(`prompt_history_user_${userId}`);
        if (st) {
            try {
                setHistoryItems(JSON.parse(st));
            }
            catch {
                setHistoryItems([]);
            }
        }
        else {
            setHistoryItems([]);
        }
    };
    useEffect(() => {
        if (typeof window !== "undefined") {
            const userId = user ? user.uid : "anonymous";
            window.debugData = {
                history: JSON.parse(localStorage.getItem(`prompt_history_user_${userId}`) || '[]'),
                stats: JSON.parse(localStorage.getItem(`user_stats_${userId}`) || '{}'),
                activityLog: JSON.parse(localStorage.getItem(`activity_log_user_${userId}`) || '[]')
            };
        }
        fetchHistory();
    }, [user, historyTrigger]);
    useEffect(() => {
        if (showHistory) {
            fetchHistory();
        }
    }, [showHistory]);
    const deleteHistory = async (id) => {
        const userId = user ? user.uid : "anonymous";
        const st = localStorage.getItem(`prompt_history_user_${userId}`);
        if (st) {
            try {
                let items = JSON.parse(st);
                items = items.filter(h => h.id !== id);
                localStorage.setItem(`prompt_history_user_${userId}`, JSON.stringify(items));
                setHistoryItems(items);
                window.dispatchEvent(new Event("pe-analytics-updated"));
            }
            catch { }
        }
    };
    const saveTemplate = async (content) => {
        if (!user) {
            alert("Login to save");
            return;
        }
        const title = userInput ? userInput.substring(0, 60) : "Generated Template";
        try {
            const token = await user.getIdToken(true);
            await fetch("/api/templates/save", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title, content, tag: activeCategory })
            });
            alert("Template saved!");
        }
        catch {
            alert("Failed to save template");
        }
    };
    const refreshUser = async () => {
        try {
            if (!auth.currentUser)
                return;
            const token = await auth.currentUser.getIdToken(true);
            const res = await fetch("/api/me", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            setUserData(data);
            // Fetch global stats as requested
            counterService.fetchCounts().then(stats => {
                if (stats)
                    setGlobalCounters({ promptsGenerated: stats.totalPrompts, usersCount: stats.totalUsers });
            });
        }
        catch (error) {
            console.error("Failed to refresh user:", error);
        }
    };
    const prevUser = useRef(undefined);
    const [forceIntro, setForceIntro] = useState(false);
    useEffect(() => {
        const unsub = auth.onAuthStateChanged((user) => {
            if (prevUser.current === null && user) {
                setForceIntro(true);
            }
            prevUser.current = user;
            if (!user) {
                setUserData(null);
                return;
            }
            refreshUser();
            fetchHistory(); // ALWAYS FETCH HISTORY
        });
        return () => {
            unsub();
        };
    }, []);
    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        localStorage.setItem("theme", theme);
    }, [theme]);
    // Session storage sync
    useEffect(() => {
        const userId = user ? user.uid : "anonymous";
        const stInput = sessionStorage.getItem(`prompt_input_${userId}`);
        const stVersions = sessionStorage.getItem(`prompt_versions_${userId}`);
        if (stInput)
            setUserInput(stInput);
        else
            setUserInput("");
        if (stVersions) {
            try {
                const parsed = JSON.parse(stVersions);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setVersions(parsed);
                    setActiveVersion(parsed.length - 1);
                }
                else {
                    setVersions([]);
                    setActiveVersion(0);
                }
            }
            catch {
                setVersions([]);
                setActiveVersion(0);
            }
        }
        else {
            setVersions([]);
            setActiveVersion(0);
        }
    }, [user]);
    useEffect(() => {
        const userId = user ? user.uid : "anonymous";
        if (userInput) {
            sessionStorage.setItem(`prompt_input_${userId}`, userInput);
        }
        else {
            sessionStorage.removeItem(`prompt_input_${userId}`);
        }
    }, [userInput, user]);
    useEffect(() => {
        const userId = user ? user.uid : "anonymous";
        if (versions.length > 0) {
            sessionStorage.setItem(`prompt_versions_${userId}`, JSON.stringify(versions));
        }
        else {
            sessionStorage.removeItem(`prompt_versions_${userId}`);
        }
    }, [versions, user]);
    const clearSession = () => {
        const userId = user ? user.uid : "anonymous";
        sessionStorage.removeItem(`prompt_input_${userId}`);
        sessionStorage.removeItem(`prompt_versions_${userId}`);
        setUserInput("");
        setVersions([]);
        setActiveVersion(0);
    };
    const generate = async (selectedMode) => {
        if (!userInput.trim())
            return;
        if (!user) {
            const guestUsage = parseInt(localStorage.getItem("guestUsageCount") || "0");
            if (guestUsage >= 3) {
                setShowLoginModal(true);
                return;
            }
        }
        setLoading(true);
        setErrorState(null);
        setForceIntro(false);
        try {
            const augmentedPrompt = buildFinalPrompt(userInput, sessionContextAnswers);
            const headers = {
                "Content-Type": "application/json",
            };
            if (user) {
                const token = await user.getIdToken(true);
                if (!token)
                    throw new Error("User not authenticated");
                headers["Authorization"] = `Bearer ${token}`;
            }
            const res = await fetch("/api/generate", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    user_input: language === "HI" ? augmentedPrompt + " [Respond with the generated prompt perfectly translated in Hindi]" : augmentedPrompt,
                    mode: selectedMode,
                }),
            });
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            }
            catch {
                throw new Error("Server returned non-JSON response");
            }
            if (res.status === 402 || res.status === 403) {
                setLoading(false);
                if (!user) {
                    setShowLoginModal(true);
                }
                else {
                    setShowUpgradeModal(true);
                }
                return;
            }
            if (res.status === 401) {
                setShowLoginModal(true);
                return;
            }
            if (!res.ok) {
                throw new Error(data?.error || "Request failed");
            }
            if (!user) {
                const guestUsage = parseInt(localStorage.getItem("guestUsageCount") || "0");
                localStorage.setItem("guestUsageCount", (guestUsage + 1).toString());
            }
            setVersions(prev => {
                const next = [...prev, data.prompt];
                setActiveVersion(next.length - 1);
                return next;
            });
            // Update local storage history (max 5)
            try {
                const userId = user ? user.uid : "anonymous";
                const currentHist = JSON.parse(localStorage.getItem(`prompt_history_user_${userId}`) || '[]');
                if (!currentHist.some((h) => h.input === userInput && h.output === data.prompt)) {
                    currentHist.unshift({
                        id: Date.now().toString(),
                        input: userInput,
                        output: data.prompt,
                        mode: selectedMode,
                        timestamp: Date.now()
                    });
                    localStorage.setItem(`prompt_history_user_${userId}`, JSON.stringify(currentHist));
                    setHistoryTrigger(prev => prev + 1);
                    if (user) {
                        const notKey = `notifications_${user.uid}`;
                        const notifs = JSON.parse(localStorage.getItem(notKey) || '[]');
                        notifs.unshift({ id: Date.now().toString(), text: `Generated new ${selectedMode} prompt`, time: new Date().toLocaleTimeString() });
                        if (notifs.length > 5)
                            notifs.length = 5;
                        localStorage.setItem(notKey, JSON.stringify(notifs));
                    }
                    // Unified stats storage
                    const statsKey = `user_stats_${userId}`;
                    const defaultStats = {
                        userId,
                        name: user ? user.displayName || user.email : "anonymous",
                        totalPrompts: 0,
                        timeSaved: 0,
                        lastUpdated: Date.now()
                    };
                    const stats = JSON.parse(localStorage.getItem(statsKey) || JSON.stringify(defaultStats));
                    stats.totalPrompts += 1;
                    stats.timeSaved += 3;
                    stats.lastUpdated = Date.now();
                    localStorage.setItem(statsKey, JSON.stringify(stats));
                    const activityEntry = {
                        userId,
                        timestamp: Date.now(),
                        action: "PROMPT_CREATED",
                        mode: selectedMode
                    };
                    try {
                        const globalLog = JSON.parse(localStorage.getItem('activity_log_global') || '[]');
                        globalLog.push(activityEntry);
                        localStorage.setItem('activity_log_global', JSON.stringify(globalLog));
                        const userLog = JSON.parse(localStorage.getItem(`activity_log_user_${userId}`) || '[]');
                        userLog.push(activityEntry);
                        localStorage.setItem(`activity_log_user_${userId}`, JSON.stringify(userLog));
                    }
                    catch (e) { }
                    counterService.fetchCounts();
                    window.dispatchEvent(new Event("pe-analytics-updated"));
                }
            }
            catch (e) { }
            // Re-fetch history items so UI reacts
            if (user) {
                fetchHistory();
            }
            // Increment prompt counter
            try {
                const newPromptCount = counterService.incrementPrompt();
                setGlobalCounters(prev => ({ ...prev, promptsGenerated: newPromptCount }));
            }
            catch (e) { }
            // Fetch updated user to reflect usage
            if (user) {
                try {
                    const token = await user.getIdToken(true);
                    const userRes = await fetch("/api/me", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (userRes.ok) {
                        const text2 = await userRes.text();
                        try {
                            const updatedUser = JSON.parse(text2);
                            setUserData(updatedUser);
                        }
                        catch (e) { }
                    }
                }
                catch (e) { }
            }
            const uId = user ? user.uid : 'guest';
            const feedbackKey = user ? `feedback_${uId}` : 'feedback_guest';
            let fbState = JSON.parse(localStorage.getItem(feedbackKey) || 'null');
            if (!fbState) {
                fbState = user ? {
                    userId: uId,
                    promptCount: 0,
                    hasGivenFeedback: false,
                    hasSeenPopup: false
                } : {
                    promptCount: 0,
                    hasSeenPopup: false
                };
            }
            fbState.promptCount += 1;
            localStorage.setItem(feedbackKey, JSON.stringify(fbState));
            console.log({
                userId: uId,
                promptCount: fbState.promptCount,
                hasSeenPopup: fbState.hasSeenPopup,
                hasGivenFeedback: fbState.hasGivenFeedback,
            });
            const dismissedThisSession = sessionStorage.getItem('feedbackDismissed') === 'true';
            if (!user) {
                if (fbState.promptCount >= 1 && !dismissedThisSession) {
                    setTimeout(() => setShowReviewModal(true), 1000);
                }
            }
            else {
                if (fbState.promptCount >= 2 && !fbState.hasSeenPopup && !fbState.hasGivenFeedback && !dismissedThisSession) {
                    setTimeout(() => {
                        setShowReviewModal(true);
                        fbState.hasSeenPopup = true;
                        localStorage.setItem(feedbackKey, JSON.stringify(fbState));
                    }, 1000);
                }
            }
        }
        catch (err) {
            console.error(err);
            setErrorState(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    const timeoutRef = useRef();
    const handleGenerate = (e) => {
        e.preventDefault();
        if (timeoutRef.current)
            clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            generate(mode);
        }, 200);
    };
    useEffect(() => {
        const handler = (e) => {
            // Allow ctrl+enter from anywhere to trigger advanced
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                if (timeoutRef.current)
                    clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    generate("advanced");
                }, 200);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [userInput, user, loading]);
    const getCredits = () => {
        if (user && !userData)
            return null;
        if (!user)
            return null;
        const plan = userData.plan;
        if (plan === "free" || !plan) {
            return {
                type: "combined",
                remaining: 5 - (userData.usageCount || 0)
            };
        }
        if (plan === "pro") {
            return {
                type: "split",
                normal: 30 - (userData.normalUsageCount || 0),
                advanced: 10 - (userData.advancedUsageCount || 0)
            };
        }
        return {
            type: "unlimited"
        };
    };
    const credits = getCredits();
    const copy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const exportResult = (text, type) => {
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `prompt.${type}`;
        a.click();
        URL.revokeObjectURL(url);
    };
    const setCategoryAndInput = (cat, text) => {
        setActiveCategory(cat);
        setUserInput(text);
    };
    if (user && !userData && !forceIntro) {
        return _jsx("div", { className: "min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-[var(--bg-primary)] dark:via-gray-900 dark:to-gray-800 transition-colors duration-300" });
    }
    return (_jsxs("div", { className: "min-h-screen flex flex-col bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-[var(--bg-primary)] dark:via-gray-900 dark:to-gray-800 text-[var(--text-primary)] font-sans selection:bg-blue-500/30 transition-colors duration-300", children: [_jsx(GlobalIntroVideo, { forcePlay: forceIntro, onComplete: () => setForceIntro(false) }), _jsxs(Helmet, { children: [_jsx("title", { children: "PromptEngine | Premium AI Prompt Generator" }), _jsx("meta", { name: "description", content: "Generate high-quality, refined, and actionable AI prompts with PromptEngine." }), _jsx("meta", { property: "og:title", content: "PromptEngine | Premium AI Prompt Generator" }), _jsx("meta", { property: "og:description", content: "Generate high-quality AI prompts effortlessly." }), _jsx("meta", { property: "og:url", content: "https://ai-prompt-engine.com/" }), _jsx("meta", { property: "og:type", content: "website" }), _jsx("link", { rel: "canonical", href: "https://ai-prompt-engine.com/" })] }), !showPricing && !showAnalytics && (_jsx("nav", { className: "w-full border-b border-gray-200 bg-white/70 backdrop-blur-md sticky top-0 z-50 dark:border-[var(--header-border)] dark:bg-[var(--header-bg)]", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between h-16", children: [_jsxs("div", { className: "flex items-center gap-2 sm:gap-3 cursor-pointer", onClick: () => setShowPricing(false), children: [_jsx("img", { src: "/logo.png", alt: "Prompt Engine", loading: "lazy", className: "h-8 sm:h-10 object-contain transition-all rounded-md" }), _jsx("h1", { className: "font-semibold tracking-tight text-lg sm:text-xl text-[var(--text-primary)] hidden sm:block", children: "Prompt Engine" })] }), _jsxs("div", { className: "flex items-center gap-2 sm:gap-4", children: [user && (_jsxs("button", { onClick: () => setShowPricing(true), className: "hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-sm transition transform hover:scale-[1.03] active:scale-[0.98]", children: [_jsx(Zap, { size: 16, className: "fill-white" }), !userData ? "..." : userData.plan === "premium" ? "Premium" : userData.plan === "pro" ? "Pro" : "Upgrade"] })), _jsx("button", { onClick: () => setTheme(theme === "dark" ? "light" : "dark"), className: "p-2 text-slate-400 hover:text-[var(--text-primary)] transition-colors", children: theme === "dark" ? _jsx(Sun, { size: 18 }) : _jsx(Moon, { size: 18 }) }), _jsx("button", { onClick: () => setLanguage(language === "EN" ? "HI" : "EN"), className: "px-2 py-1 text-xs font-bold border border-gray-200 dark:border-gray-700 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors", children: language }), _jsx("div", { className: "flex items-center gap-2 relative", children: !user ? (_jsx("button", { onClick: () => setShowLoginModal(true), className: "flex justify-center items-center w-8 h-8 rounded-full hover:scale-105 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all focus:outline-none", children: _jsx(User, { className: "w-6 h-6 text-gray-700 dark:text-gray-300" }) })) : (_jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setShowDropdown(!showDropdown), className: "flex justify-center items-center w-8 h-8 rounded-full hover:scale-105 hover:shadow-[0_0_10px_rgba(139,92,246,0.3)] transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 overflow-hidden", children: _jsx("img", { src: user.photoURL || `https://ui-avatars.com/api/?name=${user.email || 'U'}&background=random`, alt: "User Avatar", className: "w-full h-full object-cover" }) }), _jsx(AnimatePresence, { children: showDropdown && (_jsxs(motion.div, { initial: { opacity: 0, y: 10, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 10, scale: 0.95 }, transition: { duration: 0.2 }, className: "absolute right-0 mt-3 w-48 rounded-xl shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 overflow-hidden z-50 p-1.5", children: [_jsxs("button", { onClick: () => {
                                                                setShowDropdown(false);
                                                                document.getElementById("prompt-history-section")?.scrollIntoView({ behavior: "smooth" });
                                                            }, className: "w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors", children: [_jsx(Terminal, { size: 16 }), " Prompt History"] }), _jsxs("button", { onClick: () => {
                                                                window.history.pushState({}, '', '/analytics');
                                                                setShowAnalytics(true);
                                                                setShowPricing(false);
                                                                setShowDropdown(false);
                                                            }, className: "w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors", children: [_jsx(Activity, { size: 16 }), " Analytics Dashboard"] }), _jsxs("button", { onClick: () => {
                                                                window.history.pushState({}, '', '/pricing');
                                                                setShowPricing(true);
                                                                setShowAnalytics(false);
                                                                setShowDropdown(false);
                                                            }, className: "w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors", children: [_jsx(Zap, { size: 16, className: "text-purple-500" }), " Upgrade"] }), _jsxs("button", { onClick: () => {
                                                                const userId = user?.uid || "anonymous";
                                                                sessionStorage.removeItem(`prompt_input_${userId}`);
                                                                sessionStorage.removeItem(`prompt_versions_${userId}`);
                                                                setUserInput("");
                                                                setVersions([]);
                                                                setActiveVersion(0);
                                                                signOutUser();
                                                                setShowDropdown(false);
                                                            }, className: "w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors mt-0.5", children: [_jsx(LogOut, { size: 16 }), " Logout"] })] })) })] })) })] })] }) })), showPricing ? (_jsx(PricingPage, { onClose: () => { window.history.pushState({}, '', '/'); setShowPricing(false); }, userData: userData, setUserData: setUserData, refreshUser: refreshUser })) : showAnalytics ? (_jsx(Suspense, { fallback: _jsx("div", { className: "min-h-screen flex items-center justify-center bg-[var(--bg-primary)]" }), children: _jsx(AnalyticsPage, { onClose: () => { window.history.pushState({}, '', '/'); setShowAnalytics(false); }, historyItems: historyItems, userData: userData, user: user, onOpenAssistant: () => {
                        window.history.pushState({}, '', '/');
                        setShowAnalytics(false);
                        setTimeout(() => window.dispatchEvent(new CustomEvent('open-assistant', { detail: 'Analyze my usage and give insights' })), 300);
                    } }) })) : showHistory ? (_jsx(Suspense, { fallback: _jsx("div", { className: "min-h-screen flex items-center justify-center bg-[var(--bg-primary)]" }), children: _jsx(HistoryPage, { onClose: () => { window.history.pushState({}, '', '/'); setShowHistory(false); }, user: user }) })) : (_jsx("main", { className: "flex-grow w-full pt-10 sm:pt-16 pb-24 sm:pb-32 transition-all duration-300 ease-in-out", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full", children: [_jsxs("header", { className: "mb-10 sm:mb-16 text-center", children: [_jsx("h1", { className: "text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600", children: "PromptEngine" }), _jsx("p", { className: "text-base sm:text-lg md:text-xl text-slate-500 font-medium px-2", children: "Transform concepts into refined, actionable prompts." }), _jsxs("div", { className: "flex justify-center items-center gap-4 sm:gap-8 mt-6", children: [_jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5", children: globalCounters.promptsGenerated !== null ? _jsx(CountUp, { end: globalCounters.promptsGenerated, suffix: "+" }) : "..." }), _jsx("div", { className: "text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-semibold", children: "Prompts Generated" })] }), _jsx("div", { className: "w-px h-8 bg-gray-200 dark:bg-gray-700 rounded-full" }), _jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5", children: globalCounters.usersCount !== null ? _jsx(CountUp, { end: globalCounters.usersCount, suffix: "+" }) : "..." }), _jsx("div", { className: "text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-semibold", children: "Trusted Users" })] })] })] }), _jsxs(motion.form, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, onSubmit: handleGenerate, className: "w-full max-w-3xl mx-auto px-4 sm:px-6 relative z-10", children: [_jsx(PromptTemplates, { onSelect: (t) => setUserInput(t) }), _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 blur rounded-xl transition" }), _jsx("textarea", { value: userInput, onChange: (e) => setUserInput(e.target.value), placeholder: "Type your idea...", className: "\n                    relative\n                    w-full\n                    min-h-[200px]\n                    px-5 py-4\n                    border border-transparent\n                    rounded-xl\n                    bg-white/60\n                    backdrop-blur-md\n                    text-gray-800\n                    placeholder-gray-400\n                    transition-all duration-300\n                    shadow-[0_8px_30px_rgba(0,0,0,0.05)]\n                    focus:outline-none\n                    focus:ring-2 focus:ring-blue-500/30\n                    hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]\n                    hover:-translate-y-[2px]\n                    dark:bg-[var(--bg-primary)]/60\n                    dark:text-[var(--text-primary)]\n                    dark:placeholder-[var(--text-secondary)]\n                    dark:border-white/10\n                    resize-none\n                    text-left\n                  ", required: true }), _jsxs("div", { className: "absolute right-3 bottom-3 flex items-center gap-2 z-10", children: [_jsx("button", { type: "button", onClick: toggleListen, className: `p-2 transition-colors ${isListening ? "text-red-500" : "text-gray-400 hover:text-blue-500"}`, children: _jsx(Mic, { size: 18 }) }), userInput && (_jsx("button", { type: "button", onClick: () => setUserInput(""), className: "p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors", children: _jsx(Eraser, { size: 18 }) }))] })] }), _jsx("div", { className: "mt-2 w-full", children: _jsxs("div", { className: "text-xs text-gray-500 mt-3 opacity-80 dark:text-gray-400", children: ["Pro Tip: ", mode === "normal"
                                                ? "Normal mode provides solid, basic prompts. Good for standard use cases."
                                                : "Advanced mode generates highly-structured, detailed prompts."] }) }), _jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 w-full", children: [_jsxs("div", { className: "flex flex-col w-full sm:flex-1 gap-2", children: [_jsx("div", { className: "flex w-full bg-[var(--input-bg)] p-1 rounded-full border border-[var(--border-color)]", children: ["normal", "advanced"].map((m) => (_jsx("button", { type: "button", onClick: () => setMode(m), className: `flex-1 py-2 px-6 rounded-full text-sm capitalize ${mode === m
                                                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-md hover:shadow-lg transition transform hover:scale-[1.03] active:scale-[0.98]"
                                                            : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition transform hover:scale-[1.03] active:scale-[0.98]"}`, children: m }, m))) }), _jsxs("div", { className: "text-xs text-slate-500 px-4 text-center sm:text-left transition-all duration-300", children: [mode === "normal" && "Fast, basic prompts", mode === "advanced" && "Structured, high-quality prompts"] }), user && credits && (_jsxs("div", { className: `text-xs font-medium px-4 text-center sm:text-left mt-1 transition-all duration-300 ${(credits.type === "combined" && (credits.remaining ?? 0) <= 2) ||
                                                        (credits.type === "split" && credits[mode] <= 2)
                                                        ? "text-amber-500 dark:text-amber-400"
                                                        : "text-slate-500"}`, children: [credits.type === "combined" && `${credits.remaining} prompts left`, credits.type === "split" && `Normal: ${credits.normal} | Advanced: ${credits.advanced}`, credits.type === "unlimited" && "Unlimited usage"] }))] }), _jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-end gap-2 w-full sm:w-auto self-start mt-1 sm:mt-0", children: [userInput.length > 5 && (_jsx("button", { type: "button", onClick: () => setUserInput(prev => prev.trim() + "\n\n[Please expand on this request. Make it highly detailed, professional, well-structured, and provide actionable insights.]"), className: "px-4 py-2 rounded-full border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 font-medium text-sm hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors w-full sm:w-auto", children: "\u2728 Optimize" })), _jsx("button", { type: "submit", disabled: loading, className: "px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium tracking-wide shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.04] active:scale-[0.97] flex items-center justify-center gap-2 w-full sm:w-auto", children: loading ? "Generating..." : _jsxs(_Fragment, { children: ["Generate ", _jsx(Send, { size: 16 })] }) })] })] })] }), errorState && (_jsx("div", { className: "mt-4 text-sm text-red-600 max-w-3xl mx-auto px-4 sm:px-6", children: "Usage limit reached. Upgrade required." })), _jsx(AnimatePresence, { children: versions.length > 0 && (_jsxs(motion.div, { className: "mt-10 max-w-3xl mx-auto w-full p-6 border rounded-2xl bg-[var(--bg-primary)]", children: [_jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-[var(--border-color)]", children: [_jsx("div", { className: "flex flex-wrap items-center gap-2", children: versions.map((_, i) => (_jsxs("button", { onClick: () => setActiveVersion(i), className: `px-3 py-1.5 rounded-full text-xs font-bold ${activeVersion === i ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-[var(--text-primary)] transition-colors"}`, children: ["v", i + 1] }, i))) }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("button", { onClick: clearSession, className: "text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors text-xs font-bold px-3 py-1.5 border border-red-200 dark:border-red-900 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 mr-2", children: "Clear" }), _jsx("button", { onClick: () => saveTemplate(versions[activeVersion]), className: "text-slate-500 hover:text-[var(--text-primary)] transition-colors text-xs font-bold px-3 py-1.5 border border-[var(--border-color)] rounded-md hover:bg-slate-100 dark:hover:bg-slate-800", children: "Save Template" }), _jsx("button", { onClick: () => exportResult(versions[activeVersion], "txt"), className: "text-slate-500 hover:text-[var(--text-primary)] transition-colors text-xs font-bold px-3 py-1.5 border border-[var(--border-color)] rounded-md hover:bg-slate-100 dark:hover:bg-slate-800", children: ".TXT" }), _jsx("button", { onClick: () => exportResult(versions[activeVersion], "md"), className: "text-slate-500 hover:text-[var(--text-primary)] transition-colors text-xs font-bold px-3 py-1.5 border border-[var(--border-color)] rounded-md hover:bg-slate-100 dark:hover:bg-slate-800", children: ".MD" }), _jsxs("button", { onClick: () => copy(versions[activeVersion]), className: "text-slate-500 hover:text-[var(--text-primary)] transition-colors text-xs font-bold px-3 py-1.5 border border-[var(--border-color)] rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1", children: [copied ? _jsx(Check, { size: 14, className: "text-green-500" }) : _jsx(Copy, { size: 14 }), " Copy"] }), _jsxs("button", { onClick: () => copy(versions[activeVersion]), className: "text-slate-500 hover:text-[var(--text-primary)] transition-colors text-xs font-bold px-3 py-1.5 border border-[var(--border-color)] rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1", children: [_jsx(Copy, { size: 14 }), " Copy Full Prompt"] }), _jsx("button", { onClick: () => generate(mode), className: "px-3 py-1.5 text-xs text-blue-500 border border-blue-500/30 rounded-md hover:bg-blue-500/10 font-bold", children: "Regenerate" })] })] }), _jsx("h3", { className: "text-sm font-bold text-slate-400 uppercase tracking-widest mb-4", children: "Generated Prompt" }), _jsx("pre", { className: "whitespace-pre-wrap font-mono text-sm leading-relaxed text-[var(--text-primary)] bg-[var(--input-bg)] p-4 sm:p-6 rounded-xl border border-[var(--border-color)] overflow-x-auto", children: versions[activeVersion] })] })) })] }) })), _jsx(AnimatePresence, { children: showLoginModal && _jsx(AuthPage, { onClose: () => setShowLoginModal(false) }) }), showUpgradeModal && (_jsx("div", { className: "fixed inset-0 flex items-center justify-center bg-black/70 z-50 backdrop-blur-sm", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, className: "bg-white dark:bg-gray-800 p-8 rounded-3xl w-[360px] text-center shadow-2xl border border-gray-100 dark:border-gray-700 relative overflow-hidden", children: [_jsx("div", { className: "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" }), _jsx("div", { className: "w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-12 relative", children: _jsx(Zap, { size: 32, className: "fill-amber-500" }) }), _jsx("h2", { className: "text-2xl font-semibold tracking-tight mb-3 text-gray-900 dark:text-white", children: "Limit Reached" }), _jsx("p", { className: "text-base text-gray-600 dark:text-gray-400 mb-8 leading-relaxed", children: "You have exhausted your free prompt generations. Upgrade to Premium for limitless creativity." }), _jsx("button", { onClick: () => {
                                setShowUpgradeModal(false);
                                setShowPricing(true);
                            }, className: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3.5 rounded-xl font-bold w-full shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0", children: "View Pricing Plans" }), _jsx("button", { onClick: () => setShowUpgradeModal(false), className: "mt-4 px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors", children: "Maybe later" })] }) })), "       ", !showPricing && !showAnalytics && user && historyItems.length > 0 && (_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 w-full mb-16", children: _jsx(SavedPrompts, {}) })), !showPricing && !showAnalytics && (_jsxs(_Fragment, { children: [_jsx(VisibleHistory, { trigger: historyTrigger, user: user }), _jsx(ReviewSection, {}), _jsx("div", { className: "flex justify-center mb-16 px-4", children: _jsx("button", { onClick: () => setShowReviewModal(true), className: "py-3 px-8 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 text-blue-700 dark:text-blue-300 font-semibold transition-all border border-blue-100 dark:border-blue-800/50 flex items-center gap-2", children: "Give us your valuable feedback" }) }), _jsx(Footer, { onUpgrade: () => { window.history.pushState({}, '', '/pricing'); setShowPricing(true); setShowAnalytics(false); } }), _jsx(Assistant, { user: user, userData: userData, historyItems: historyItems })] })), _jsx(AnimatePresence, { children: showReviewModal && (_jsx(ReviewModal, { onClose: () => {
                        setShowReviewModal(false);
                        sessionStorage.setItem('feedbackDismissed', 'true');
                    }, onSubmit: (data) => {
                        import('./services/reviewService').then(({ reviewService }) => {
                            const res = reviewService.addReview(data);
                            alert(res.message);
                            setShowReviewModal(false);
                            sessionStorage.setItem('feedbackDismissed', 'true');
                            if (user) {
                                const feedbackKey = `feedback_${user.uid}`;
                                let fbState = JSON.parse(localStorage.getItem(feedbackKey) || '{"promptCount":0,"hasSeenPopup":true,"hasGivenFeedback":false}');
                                fbState.hasGivenFeedback = true;
                                localStorage.setItem(feedbackKey, JSON.stringify(fbState));
                            }
                        });
                    } })) })] }));
}
