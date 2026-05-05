import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
export function CountUp({ end, suffix = "" }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (end === null)
            return;
        let startTimestamp = null;
        const duration = 1500; // ms
        const startValue = 0;
        const step = (timestamp) => {
            if (!startTimestamp)
                startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // easeOutQuart curve
            const ease = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(ease * (end - startValue) + startValue));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [end]);
    if (end === null)
        return _jsx("span", { children: "..." });
    let display = count.toString();
    if (count >= 1000) {
        display = (count / 1000).toFixed(count % 1000 >= 100 ? 1 : 0) + 'k';
    }
    return _jsxs("span", { children: [display, suffix] });
}
