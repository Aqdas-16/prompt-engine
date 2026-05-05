import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { FileText, Code, TrendingUp, Briefcase, User } from 'lucide-react';
import { useAuth } from './FirebaseProvider';
const categories = [
    { id: "all", name: "All Templates", icon: _jsx(FileText, { size: 16 }) },
    { id: "coding", name: "Coding", icon: _jsx(Code, { size: 16 }) },
    { id: "marketing", name: "Marketing", icon: _jsx(TrendingUp, { size: 16 }) },
    { id: "business", name: "Business", icon: _jsx(Briefcase, { size: 16 }) },
    { id: "user_templates", name: "Your Templates", icon: _jsx(User, { size: 16 }) },
];
const templates = [
    { id: 1, category: "coding", title: "React Component Boilerplate", content: "Create a modern React functional component named [ComponentName] with TypeScript interfaces for props. Include Tailwind CSS for styling and Framer Motion for entrance animations. Ensure it follows best practices for performance and accessibility." },
    { id: 2, category: "coding", title: "API Endpoint Architecture", content: "Design a RESTful API structure for a [AppType] application. Provide a list of endpoints, HTTP methods, required parameters, and standard JSON responses. Include considerations for authentication and rate limiting." },
    { id: 3, category: "marketing", title: "Social Media Launch Plan", content: "Act as a seasoned digital marketing strategist. Develop a 14-day social media launch campaign for a [Product/Service]. Include platforms to target, daily content themes, optimal posting times, and key performance indicators (KPIs)." },
    { id: 4, category: "business", title: "Investor Pitch Deck Outline", content: "Structure a comprehensive 10-slide pitch deck for a seed-stage [Industry] startup. For each slide, detail the headline, key points to discuss, and the narrative arc. Tailor the tone to appeal to venture capitalists." },
    { id: 5, category: "marketing", title: "SEO Blog Outline", content: "Generate a comprehensive outline for an SEO-optimized blog post targeting the keyword '[Keyword]'. Include H1, H2, and H3 headers. Ensure the structure addresses search intent and covers FAQ sections." },
];
export function PromptTemplates({ onSelect }) {
    const [activeTab, setActiveTab] = React.useState("all");
    const { user } = useAuth();
    const [userTemplates, setUserTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (activeTab === "user_templates" && user) {
            setLoading(true);
            user.getIdToken(true).then(token => {
                return fetch("/api/templates/user", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            })
                .then(res => res.json())
                .then(data => {
                if (Array.isArray(data)) {
                    setUserTemplates(data);
                }
            })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [activeTab, user]);
    const filtered = activeTab === "all" ? templates : templates.filter(t => t.category === activeTab);
    return (_jsxs("div", { className: "w-full mb-6 z-10 relative", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-700 dark:text-gray-300", children: "Templates:" }), _jsx("div", { className: "flex gap-2 overflow-x-auto pb-1 custom-scrollbar", children: categories.map((c) => (_jsxs("button", { type: "button", onClick: () => setActiveTab(c.id), className: `whitespace-nowrap px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-all shadow-sm border ${activeTab === c.id
                                ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400"
                                : "border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"}`, children: [c.icon, " ", c.name] }, c.id))) })] }), _jsx("div", { className: "flex gap-3 overflow-x-auto pb-2 snap-x custom-scrollbar", children: activeTab === "user_templates" ? (!user ? (_jsx("div", { className: "text-sm text-gray-500 italic p-3", children: "Login to see your saved templates" })) : loading ? (_jsx("div", { className: "text-sm text-gray-500 italic p-3", children: "Loading..." })) : userTemplates.length === 0 ? (_jsx("div", { className: "text-sm text-gray-500 italic p-3", children: "No saved templates yet" })) : (userTemplates.map((t) => (_jsxs("div", { onClick: () => onSelect(t.content), className: "snap-start min-w-[200px] w-[200px] sm:min-w-[240px] p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all group", children: [_jsx("h4", { className: "text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200 group-hover:text-blue-500 transition-colors line-clamp-1", children: t.title }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 line-clamp-2", children: t.content })] }, t.id))))) : (filtered.map((t) => (_jsxs("div", { onClick: () => onSelect(t.content), className: "snap-start min-w-[200px] w-[200px] sm:min-w-[240px] p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all group", children: [_jsx("h4", { className: "text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200 group-hover:text-blue-500 transition-colors line-clamp-1", children: t.title }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 line-clamp-2", children: t.content })] }, t.id)))) })] }));
}
