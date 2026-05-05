import React, { useState, useEffect } from 'react';

export function CountUp({ end, suffix = "" }: { end: number | null, suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (end === null) return;
    
    let startTimestamp: number | null = null;
    const duration = 1500; // ms
    const startValue = 0;
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
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

  if (end === null) return <span>...</span>;

  let display = count.toString();
  if (count >= 1000) {
    display = (count / 1000).toFixed(count % 1000 >= 100 ? 1 : 0) + 'k';
  }

  return <span>{display}{suffix}</span>;
}
