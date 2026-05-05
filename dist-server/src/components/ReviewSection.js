import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Star, ArrowRight, X } from 'lucide-react';
import { reviewService } from '../services/reviewService';
import { counterService } from '../services/counterService';
export function ReviewSection() {
    const [reviews, setReviews] = useState([]);
    const [feedbackCount, setFeedbackCount] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [showAllModal, setShowAllModal] = useState(false);
    const [filterRating, setFilterRating] = useState('all');
    const refreshReviews = () => {
        const stored = reviewService.getReviews();
        const count = reviewService.getFeedbackCount();
        const currentTotalUsers = counterService.getCounts().totalUsers;
        console.log({ feedbackCount: count, totalUsers: currentTotalUsers });
        if (count > currentTotalUsers) {
            console.warn("Feedback count is irregularly larger than total users.");
        }
        let displayReviews = [...stored];
        displayReviews.sort((a, b) => b.rating - a.rating || (b.createdAt || 0) - (a.createdAt || 0));
        setReviews(displayReviews);
        setFeedbackCount(count);
        setTotalUsers(currentTotalUsers);
    };
    useEffect(() => {
        refreshReviews();
        window.addEventListener("feedbackUpdated", refreshReviews);
        window.addEventListener("statsUpdated", refreshReviews);
        return () => {
            window.removeEventListener("feedbackUpdated", refreshReviews);
            window.removeEventListener("statsUpdated", refreshReviews);
        };
    }, []);
    const getFeedbackDisplayText = () => {
        if (feedbackCount === 0)
            return "No feedback yet. Be the first to share.";
        if (feedbackCount < 10)
            return `${feedbackCount} users shared feedback`;
        return `${Math.floor(feedbackCount / 10) * 10}+ users shared feedback`;
    };
    const reviewsToShow = reviews.slice(0, 6);
    const filteredReviews = filterRating === 'all'
        ? reviews.slice(0, 30)
        : reviews.filter(r => r.rating === filterRating).slice(0, 30);
    return (_jsxs("section", { className: "w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10", children: [_jsxs("div", { className: "text-center mb-10", children: [_jsx("h2", { className: "text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white mb-3", children: "What Our Users Say" }), _jsx("p", { className: `text-sm font-medium ${feedbackCount === 0 ? "text-gray-500" : "text-indigo-500"} mb-2`, children: getFeedbackDisplayText() }), _jsx("p", { className: "text-base text-gray-500 dark:text-gray-400", children: "Join the thousands upgrading their prompt engineering workflow." })] }), reviewsToShow.length > 0 ? (_jsxs(_Fragment, { children: [_jsx("div", { className: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${reviewsToShow.length < 6 ? 'justify-center max-w-5xl mx-auto' : ''}`, children: reviewsToShow.map((review, i) => (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: i * 0.1 }, className: "p-5 rounded-2xl backdrop-blur-[14px] bg-white/40 dark:bg-white/[0.04] border border-white/50 dark:border-white/[0.1] shadow-sm flex flex-col h-full transition-transform duration-300 hover:-translate-y-1 group", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0", children: review.name.charAt(0).toUpperCase() }), _jsx("div", { children: _jsx("h4", { className: "text-xs font-semibold text-gray-900 dark:text-gray-100", children: review.name }) })] }), _jsx("div", { className: "flex text-yellow-500 dark:text-yellow-400 shrink-0", children: [...Array(5)].map((_, idx) => (_jsx(Star, { size: 12, className: idx < review.rating ? "fill-current" : "text-gray-200 dark:text-gray-700" }, idx))) })] }), _jsxs("p", { className: "text-xs text-gray-600 dark:text-gray-300 flex-grow relative z-10 leading-relaxed font-medium line-clamp-3", children: ["\"", review.review || 'This tool has significantly improved my AI workflows. Highly recommended!', "\""] })] }, i))) }), _jsx("div", { className: "mt-10 flex justify-center", children: _jsxs("button", { onClick: () => setShowAllModal(true), className: "group flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm", children: ["View All Reviews ", _jsx(ArrowRight, { size: 16, className: "group-hover:translate-x-1 transition-transform" })] }) })] })) : null, showAllModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95, y: 10 }, animate: { opacity: 1, scale: 1, y: 0 }, className: "relative w-full max-w-4xl max-h-[90vh] bg-gray-50 dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 shrink-0", children: [_jsxs("h3", { className: "text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: ["Community Reviews ", _jsxs("span", { className: "text-xs font-semibold px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", children: [reviews.length, " Total"] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "hidden sm:flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg", children: [{ label: 'All', val: 'all' }, { label: '5★', val: 5 }, { label: '4★', val: 4 }, { label: '3★', val: 3 }].map(f => (_jsx("button", { onClick: () => setFilterRating(f.val), className: `px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterRating === f.val ? 'bg-white dark:bg-gray-700 shadow flex items-center justify-center' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`, children: f.label }, f.label))) }), _jsx("button", { onClick: () => setShowAllModal(false), className: "p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors", children: _jsx(X, { size: 20 }) })] })] }), _jsxs("div", { className: "p-6 overflow-y-auto w-full", children: [_jsx("div", { className: "sm:hidden flex items-center gap-1.5 p-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0", children: [{ label: 'All', val: 'all' }, { label: '5★', val: 5 }, { label: '4★', val: 4 }, { label: '3★', val: 3 }].map(f => (_jsx("button", { onClick: () => setFilterRating(f.val), className: `flex-1 py-2 text-xs font-semibold rounded-md transition-all ${filterRating === f.val ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`, children: f.label }, f.label))) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: filteredReviews.length > 0 ? filteredReviews.map((review, i) => (_jsxs("div", { className: "p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-inner shrink-0", children: review.name.charAt(0).toUpperCase() }), _jsxs("div", { className: "flex flex-col", children: [_jsx("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white leading-none", children: review.name }), _jsx("span", { className: "text-[10px] text-gray-400 mt-1", children: review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recent' })] })] }), _jsx("div", { className: "flex gap-0.5 text-yellow-400", children: [...Array(review.rating)].map((_, idx) => (_jsx(Star, { size: 12, className: "fill-current" }, idx))) })] }), _jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed", children: ["\"", review.review || 'Awesome tool!', "\""] })] }, i))) : (_jsx("div", { className: "col-span-1 md:col-span-2 text-center py-10 text-gray-500 dark:text-gray-400 text-sm", children: "No reviews found for this filter." })) }), filteredReviews.length >= 30 && filterRating === 'all' && (_jsx("div", { className: "mt-8 text-center text-xs text-gray-400", children: "Showing maximum of 30 reviews." }))] })] }) }))] }));
}
