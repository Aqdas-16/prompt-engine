import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface GlobalIntroVideoProps {
  onComplete?: () => void;
  forcePlay?: boolean;
}

const Particles = ({ isSweeping, isExiting }: { isSweeping: boolean, isExiting: boolean }) => {
  const particles = React.useMemo(() => Array.from({ length: 25 }).map(() => ({
    angle: Math.random() * Math.PI * 2,
    distance: 40 + Math.random() * 160,
    duration: 1 + Math.random() * 1.5,
    delay: Math.random() * 0.4,
    size: Math.random() * 2 + 1,
  })), []);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 mix-blend-screen">
      {particles.map((p, i) => {
        const x = Math.cos(p.angle) * p.distance;
        const y = Math.sin(p.angle) * p.distance;
        
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: isExiting ? x * 1.2 : (isSweeping ? x : 0),
              y: isExiting ? y * 1.2 : (isSweeping ? y : 0),
              opacity: isExiting ? 0 : (isSweeping ? [0, Math.random() * 0.4 + 0.2, 0] : 0),
              scale: isExiting ? 0 : (isSweeping ? [0, Math.random() * 1 + 0.5, 0] : 0),
            }}
            transition={{
              duration: isExiting ? 0.4 : p.duration,
              delay: isExiting ? 0 : p.delay,
              ease: [0.22, 1, 0.36, 1],
              repeat: isSweeping && !isExiting ? Infinity : 0,
            }}
            className="absolute rounded-full"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: '#00aaff',
              boxShadow: '0 0 6px #00aaff',
            }}
          />
        );
      })}
    </div>
  );
};

export function GlobalIntroVideo({ onComplete, forcePlay = false }: GlobalIntroVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [exitPhase, setExitPhase] = useState<0 | 1 | 2 | 3>(0);
  const [isSweeping, setIsSweeping] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    let t1: NodeJS.Timeout, t2: NodeJS.Timeout;
    if (exitPhase === 1) {
      t1 = setTimeout(() => setExitPhase(2), 200);
      t2 = setTimeout(() => setExitPhase(3), 400);
    }
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [exitPhase]);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('pe_seen');
    if (!hasSeenIntro || forcePlay) {
      setIsPlaying(true);
      setExitPhase(0);
      setIsSweeping(false);
      setVideoError(false);
      sessionStorage.setItem('pe_seen', 'true');
    } else {
      if (onComplete) onComplete();
    }
  }, [forcePlay, onComplete]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const { duration, currentTime } = videoRef.current;
      
      if (duration > 0) {
        // Trigger sweet spot for sweeping, roughly centered
        if (currentTime > duration * 0.25 && currentTime < duration * 0.70 && !isSweeping) {
          setIsSweeping(true);
        } else if (currentTime > duration * 0.70 && isSweeping) {
          setIsSweeping(false);
        }

        // Tiered exit transition starting 1.5s from end real video time (scaling to ~1s real time at 1.4x)
        if (duration - currentTime <= 1.5 && exitPhase === 0) {
          setExitPhase(1);
        }
      }
    }
  };

  const handleEnded = () => {
    if (exitPhase < 3) setExitPhase(3);
    setTimeout(() => {
      setIsPlaying(false);
      if (onComplete) onComplete();
    }, 1000);
  };

  return (
    <>
      {/* Hidden preloader */}
      {!isPlaying && <video src="/intro.mp4" preload="auto" style={{ display: 'none' }} muted playsInline />}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
           initial={{ opacity: forcePlay ? 0 : 1 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden"
        >
          {/* Micro Camera wrapper */}
          <motion.div
            initial={{ scale: 0.98 }}
            animate={{ scale: exitPhase >= 3 ? 0.95 : [0.98, 1, 1.02, 1] }}
            transition={{ duration: exitPhase >= 3 ? 0.8 : 4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full flex items-center justify-center relative"
          >
            {/* Ambient Depth Layer (Glow) */}
            <motion.div
              initial={{ scale: 1, opacity: 0 }}
              animate={{ 
                scale: exitPhase >= 1 ? 1 : (isSweeping ? 1.4 : 1),
                opacity: exitPhase >= 1 ? 0 : (isSweeping ? 0.15 : 0)
              }}
              transition={{ duration: exitPhase >= 1 ? 0.8 : 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#00aaff] blur-[60px] sm:blur-[100px] rounded-full z-0 pointer-events-none"
            />
            
            {/* Logo Video */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: exitPhase >= 2 ? 0 : 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="z-10 w-full h-full flex items-center justify-center p-4 sm:p-0"
            >
              {!videoError ? (
                <video
                  ref={videoRef}
                  src="/intro.mp4" 
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.playbackRate = 1.45;
                    }
                  }}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleEnded}
                  onError={() => setVideoError(true)}
                  className="w-full max-w-4xl max-h-screen object-contain mix-blend-screen"
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  onAnimationComplete={() => {
                    setTimeout(() => {
                      setExitPhase(1);
                      setTimeout(() => handleEnded(), 1200);
                    }, 1500);
                  }}
                  className="w-full h-full flex items-center justify-center bg-black"
                >
                  <img src="/logo.png" alt="Prompt Engine Logo" className="w-48 h-48 object-contain mix-blend-screen" />
                </motion.div>
              )}
            </motion.div>
            
            {/* Particle Spark System */}
            <Particles isSweeping={isSweeping} isExiting={exitPhase >= 2} />
            
            {/* Dynamic Vignette Effect */}
            <motion.div 
               animate={{ opacity: exitPhase >= 2 ? 0.2 : (isSweeping ? 0.8 : 0.4) }}
               transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
               className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,1)_95%)] pointer-events-none z-20"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
