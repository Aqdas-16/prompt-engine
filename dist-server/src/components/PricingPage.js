import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Check, ArrowLeft, X } from "lucide-react";
import { auth } from "../lib/firebase";
export default function PricingPage({ onClose, userData, setUserData, refreshUser }) {
    const [isYearly, setIsYearly] = useState(false);
    const [hovered, setHovered] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
    }, []);
    const PLAN_RANK = { free: 0, pro: 1, premium: 2 };
    const CYCLE_RANK = { monthly: 0, yearly: 1 };
    const getButtonState = (plan, cycle) => {
        const currentPlan = userData?.plan || "free";
        const currentCycle = userData?.billingCycle || "monthly";
        // FREE PLAN RULE (ABSOLUTE)
        if (plan === "free") {
            return { label: "Free", disabled: true };
        }
        if (!userData) {
            return { label: "Upgrade", disabled: false };
        }
        const currentPlanRank = PLAN_RANK[currentPlan];
        const targetPlanRank = PLAN_RANK[plan];
        const currentCycleRank = CYCLE_RANK[currentCycle];
        const targetCycleRank = CYCLE_RANK[cycle];
        // EXACT MATCH
        if (currentPlan === plan && currentCycle === cycle) {
            return { label: "Current Plan", disabled: true };
        }
        // SAME PLAN (CYCLE UPGRADE / DOWNGRADE)
        if (currentPlan === plan) {
            if (targetCycleRank > currentCycleRank) {
                return { label: "Upgrade to Yearly", disabled: false };
            }
            else {
                return { label: "Already upgraded to yearly", disabled: true };
            }
        }
        // HIGHER PLAN ALREADY ACTIVE
        if (currentPlanRank > targetPlanRank) {
            return { label: "Already on higher plan", disabled: true };
        }
        // LOWER PLAN → ALLOW UPGRADE
        return {
            label: plan === "premium" ? "Go Premium" : "Upgrade",
            disabled: false,
        };
    };
    const handlePayment = async () => {
        if (loading)
            return;
        try {
            if (!selectedPlan || selectedPlan === "free")
                return;
            if (!auth.currentUser) {
                alert("Please log in first.");
                return;
            }
            setLoading(true);
            const reqBillingCycle = isYearly ? "yearly" : "monthly";
            const btnState = getButtonState(selectedPlan, reqBillingCycle);
            if (btnState.disabled) {
                alert(btnState.label);
                setLoading(false);
                return;
            }
            const token = await auth.currentUser.getIdToken(true);
            const billingCycle = reqBillingCycle;
            const res = await fetch("/api/create-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ plan: selectedPlan, billingCycle }),
            });
            const orderText = await res.text();
            let order;
            try {
                order = JSON.parse(orderText);
                console.log("ORDER:", order);
                console.log("USER:", userData);
            }
            catch (e) {
                console.error("Order JSON Error:", orderText.slice(0, 100));
                throw new Error("Failed to parse order response");
            }
            if (!res.ok || order.error)
                throw new Error(order.error || "Failed to create order");
            if (order.mock) {
                alert("Mock order detected. Payment blocked.");
                setLoading(false);
                return;
            }
            const options = {
                key: order.key_id || import.meta.env.VITE_RAZORPAY_KEY || "your_key_here",
                amount: order.amount,
                currency: "INR",
                order_id: order.id,
                name: "PromptEngine",
                description: `Upgrade to ${selectedPlan}`,
                handler: async function (response) {
                    const token = await auth.currentUser.getIdToken(true);
                    const verifyRes = await fetch("/api/verify-payment", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            selectedPlan,
                            billingCycle
                        }),
                    });
                    const verifyData = await verifyRes.json();
                    if (!verifyData.success) {
                        alert("Payment verification failed");
                        setLoading(false);
                        return;
                    }
                    await refreshUser();
                    await new Promise(res => setTimeout(res, 300));
                    setLoading(false);
                    setShowPaymentModal(false);
                    onClose();
                },
                prefill: {
                    email: auth.currentUser?.email,
                },
                theme: {
                    color: "#2563EB",
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                }
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function () {
                setLoading(false);
            });
            rzp.open();
            setShowPaymentModal(false);
        }
        catch (e) {
            console.error(e);
            alert(e.message || "Payment failed / Error connecting to server.");
            setShowPaymentModal(false);
            setLoading(false);
        }
    };
    const plans = [
        {
            id: "free",
            name: "FREE",
            priceMonthly: "₹0 / $0",
            priceYearly: "₹0 / $0",
            priceINRM: 0,
            priceINRY: 0,
            features: [
                "5 prompts total",
                "Normal + Advanced access",
                "Basic experience",
            ],
            buttonText: "Current Plan",
            disabled: true,
            popular: false,
        },
        {
            id: "pro",
            name: "PRO",
            priceMonthly: "₹49 / $1",
            priceYearly: "₹470 / $10",
            priceINRM: 49,
            priceINRY: 470,
            features: [
                "30 normal prompts/month",
                "10 advanced prompts/month",
                "Faster performance",
                "Stable output",
            ],
            buttonText: "Upgrade to Pro",
            disabled: false,
            popular: false,
        },
        {
            id: "premium",
            name: "PREMIUM",
            priceMonthly: "₹149 / $3",
            priceYearly: "₹1199 / $24",
            priceINRM: 149,
            priceINRY: 1199,
            features: [
                "Unlimited prompts",
                "Full advanced access",
                "Best quality output",
                "Priority processing",
            ],
            buttonText: "Go Premium",
            disabled: false,
            popular: true,
        },
    ];
    return (_jsxs("div", { className: "w-full relative min-h-screen flex flex-col justify-center items-center py-6 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden transition-colors duration-300 bg-gray-50 text-gray-900 dark:bg-[#0b0f1a] dark:text-white", children: [_jsxs("button", { onClick: onClose, className: "fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-lg bg-white/30 dark:bg-white/10 border border-white/20 text-sm font-medium hover:scale-105 transition-all duration-200", children: [_jsx(ArrowLeft, { size: 18 }), " Back"] }), _jsxs("div", { className: "absolute inset-0 overflow-hidden pointer-events-none mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-100 transition-opacity duration-300", children: [_jsx("div", { className: "absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-300/40 dark:bg-blue-600/20 rounded-full blur-[100px]" }), _jsx("div", { className: "absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-300/40 dark:bg-purple-600/20 rounded-full blur-[100px]" })] }), _jsxs("div", { className: "relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center", children: [_jsxs("div", { className: "text-center mb-8 w-full flex flex-col items-center", children: [_jsx(motion.h2, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight", children: "Pricing Built for Scale" }), _jsx(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 }, className: "mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-lg", children: "Start free, then unlock limitless creativity with our premium features." }), _jsx(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { delay: 0.2 }, className: "mt-6 inline-flex", children: _jsxs("div", { className: "relative p-1 bg-white/20 dark:bg-white/10 backdrop-blur-lg rounded-full border border-white/20 flex items-center shadow-sm dark:shadow-lg transition-colors duration-300", children: [_jsx("button", { onClick: () => setIsYearly(false), className: `relative rounded-full py-1.5 px-6 text-sm font-semibold transition-all duration-300 ${!isYearly
                                                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md border border-gray-200/50 dark:border-white/10"
                                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`, children: "Monthly" }), _jsxs("button", { onClick: () => setIsYearly(true), className: `relative rounded-full py-1.5 px-6 text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${isYearly
                                                ? "bg-blue-600 dark:bg-indigo-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] dark:shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-blue-400/50 dark:border-indigo-400/50"
                                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`, children: ["Yearly ", _jsx("span", { className: isYearly ? "text-blue-100 dark:text-indigo-200" : "text-blue-600 dark:text-indigo-400", children: "(Save 20%)" })] })] }) })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 w-full items-center", children: plans.map((p, index) => {
                            const isHovered = hovered === p.id;
                            const isOtherHovered = hovered !== null && !isHovered;
                            let scalingClasses = "scale-100 z-0 opacity-100";
                            if (isHovered) {
                                scalingClasses = "scale-[1.05] -translate-y-1 z-20 opacity-100 shadow-xl";
                            }
                            else if (isOtherHovered) {
                                scalingClasses = "scale-[0.95] z-0 opacity-60";
                            }
                            else if (p.popular) {
                                scalingClasses = "scale-[1.05] z-10 opacity-100";
                            }
                            return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 + index * 0.1, duration: 0.4 }, onMouseEnter: () => setHovered(p.id), onMouseLeave: () => setHovered(null), className: `relative flex flex-col p-5 rounded-2xl transition-all duration-300 backdrop-blur-lg shadow-md hover:shadow-xl hover:-translate-y-1 border ${scalingClasses} ${p.popular
                                    ? "bg-white/80 dark:bg-white/10 dark:bg-gradient-to-b dark:from-blue-500/10 dark:via-purple-500/10 dark:to-transparent border-purple-300/50 dark:border-purple-400/30 ring-1 ring-purple-400/30 dark:ring-purple-500/20"
                                    : "bg-white/70 border-gray-200 dark:bg-white/10 dark:border-white/20"} ${isHovered && "shadow-[0_10px_40px_-10px_rgba(139,92,246,0.3)] dark:shadow-[0_10px_40px_-10px_rgba(139,92,246,0.5)] border-purple-400/50 dark:border-purple-400/50 ring-1 ring-purple-400/40 dark:ring-purple-400/40"}`, children: [p.popular && (_jsx("div", { className: "absolute -top-3 left-0 right-0 flex justify-center", children: _jsx("span", { className: "bg-gradient-to-r from-blue-500 to-purple-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]", children: "Most Popular" }) })), _jsxs("div", { className: "mb-4 text-center", children: [_jsx("h3", { className: `text-sm font-bold tracking-widest uppercase mb-1 ${p.popular ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-300 dark:to-purple-300" : "text-gray-700 dark:text-gray-300"}`, children: p.name }), _jsx("div", { className: "flex justify-center items-baseline text-gray-900 dark:text-white", children: _jsx("span", { className: "text-2xl lg:text-3xl font-extrabold tracking-tight", children: isYearly ? p.priceYearly : p.priceMonthly }) }), _jsx("p", { className: "text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium", children: p.id === "free" ? "Forever" : (isYearly ? "Per year" : "Per month") })] }), _jsx("div", { className: "flex-1", children: _jsx("ul", { className: "space-y-2 mt-2", children: p.features.map((feature, idx) => (_jsxs("li", { className: "flex items-start text-xs lg:text-sm", children: [_jsx("div", { className: `mt-[3px] mr-2 flex-shrink-0 flex items-center justify-center h-3.5 w-3.5 rounded-full ${p.popular ? "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300" : "bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-300"}`, children: _jsx(Check, { className: "h-2 w-2" }) }), _jsx("span", { className: "text-gray-700 dark:text-gray-300 leading-tight", children: feature })] }, idx))) }) }), _jsx("div", { className: "mt-6", children: (() => {
                                            const cycleId = isYearly ? "yearly" : "monthly";
                                            const btnState = getButtonState(p.id, cycleId);
                                            const isDisabled = loading || !userData || btnState.disabled;
                                            const isLoadingThis = loading && selectedPlan === p.id;
                                            return (_jsx("button", { onClick: () => {
                                                    if (isDisabled)
                                                        return;
                                                    setSelectedPlan(p.id);
                                                    setShowPaymentModal(true);
                                                }, disabled: isDisabled, className: `w-full py-2 px-4 rounded-xl text-xs lg:text-sm font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900 active:scale-95 ${loading || !userData ? "opacity-50 cursor-not-allowed bg-gray-300 dark:bg-gray-700 text-gray-500" :
                                                    btnState.disabled
                                                        ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-200 dark:border-white/5"
                                                        : p.popular
                                                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-[0_4px_15px_rgba(139,92,246,0.3)] dark:shadow-[0_0_15px_rgba(139,92,246,0.4)] focus:ring-purple-500 border border-purple-400/50"
                                                            : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all border border-transparent"}`, children: isLoadingThis ? "Connecting..." : !userData ? "Loading..." : btnState.label }));
                                        })() })] }, p.id));
                        }) })] }), showPaymentModal && selectedPlan && (_jsx("div", { className: "fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "bg-white dark:bg-[#0b0f1a] w-full max-w-sm rounded-2xl shadow-2xl p-6 relative", children: [_jsx("button", { onClick: () => setShowPaymentModal(false), className: "absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors", children: _jsx(X, { size: 20 }) }), _jsx("h2", { className: "text-xl font-bold text-gray-900 dark:text-white mb-2", children: "Confirm Payment" }), _jsxs("p", { className: "text-gray-500 dark:text-gray-400 mb-6 text-sm", children: ["You are about to subscribe to the ", _jsx("span", { className: "font-bold text-gray-800 dark:text-gray-200", children: selectedPlan.toUpperCase() }), " plan (", isYearly ? "Yearly" : "Monthly", ")."] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => setShowPaymentModal(false), className: "flex-1 py-2 rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 font-medium transition-colors", children: "Cancel" }), _jsx("button", { onClick: handlePayment, className: "flex-1 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-medium transition-colors shadow-md shadow-blue-500/20", children: "Proceed to Pay" })] })] }) }))] }));
}
