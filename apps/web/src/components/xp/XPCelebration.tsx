/**
 * XP Celebration - Animated celebration effects for achievements
 */

import React, { useEffect, useState, useRef } from 'react';

interface CelebrationEvent {
  userId: string;
  celebrationType: 'level_up' | 'milestone' | 'perfect_streak' | 'first_achievement' | 'bonus_earned';
  intensity: 'minimal' | 'standard' | 'epic';
  animation: string;
  message: string;
  duration: number;
  sound?: string;
  effects: CelebrationEffect[];
}

interface CelebrationEffect {
  type: 'confetti' | 'sparkles' | 'badge_shine' | 'xp_counter' | 'progress_bar';
  duration: number;
  delay: number;
  properties: Record<string, any>;
}

interface XPCelebrationProps {
  celebration: CelebrationEvent;
  onComplete: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  shape: 'square' | 'circle' | 'triangle';
}

export const XPCelebration: React.FC<XPCelebrationProps> = ({
  celebration,
  onComplete
}) => {
  const [isActive, setIsActive] = useState(true);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [sparkles, setSparkles] = useState<any[]>([]);
  const animationRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Play sound if specified
    if (celebration.sound) {
      playSound(celebration.sound);
    }

    // Initialize effects
    initializeEffects();

    // Set completion timer
    const completionTimer = setTimeout(() => {
      setIsActive(false);
      setTimeout(onComplete, 500); // Allow fade out
    }, celebration.duration);

    return () => {
      clearTimeout(completionTimer);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [celebration, onComplete]);

  useEffect(() => {
    if (isActive && (confetti.length > 0 || sparkles.length > 0)) {
      animate();
    }
  }, [isActive, confetti, sparkles]);

  const playSound = (soundFile: string) => {
    try {
      const audio = new Audio(`/sounds/${soundFile}`);
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Sound play failed:', e));
    } catch (e) {
      console.log('Sound loading failed:', e);
    }
  };

  const initializeEffects = () => {
    celebration.effects.forEach((effect, index) => {
      setTimeout(() => {
        switch (effect.type) {
          case 'confetti':
            generateConfetti(effect);
            break;
          case 'sparkles':
            generateSparkles(effect);
            break;
          case 'badge_shine':
            // Badge shine is handled by CSS animation
            break;
          case 'xp_counter':
            // XP counter animation is handled separately
            break;
        }
      }, effect.delay);
    });
  };

  const generateConfetti = (effect: CelebrationEffect) => {
    const count = celebration.intensity === 'epic' ? 100 : 
                  celebration.intensity === 'standard' ? 60 : 30;
    const colors = effect.properties.colors || ['#fbbf24', '#f59e0b', '#3b82f6', '#ef4444', '#10b981'];
    
    const newConfetti: ConfettiPiece[] = [];
    
    for (let i = 0; i < count; i++) {
      newConfetti.push({
        id: Date.now() + i,
        x: Math.random() * window.innerWidth,
        y: -20,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        shape: ['square', 'circle', 'triangle'][Math.floor(Math.random() * 3)] as any
      });
    }
    
    setConfetti(newConfetti);
  };

  const generateSparkles = (effect: CelebrationEffect) => {
    const count = celebration.intensity === 'epic' ? 50 : 
                  celebration.intensity === 'standard' ? 30 : 15;
    const newSparkles = [];
    
    for (let i = 0; i < count; i++) {
      newSparkles.push({
        id: Date.now() + i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        scale: Math.random() * 0.5 + 0.5,
        opacity: Math.random() * 0.7 + 0.3,
        delay: Math.random() * 2000,
        duration: Math.random() * 1000 + 1000
      });
    }
    
    setSparkles(newSparkles);
  };

  const animate = () => {
    if (!isActive) return;

    // Update confetti physics
    setConfetti(prev => prev
      .map(piece => ({
        ...piece,
        x: piece.x + piece.vx,
        y: piece.y + piece.vy,
        rotation: piece.rotation + piece.rotationSpeed,
        vy: piece.vy + 0.1 // gravity
      }))
      .filter(piece => piece.y < window.innerHeight + 20)
    );

    animationRef.current = requestAnimationFrame(animate);
  };

  const getCelebrationIcon = () => {
    switch (celebration.celebrationType) {
      case 'level_up':
        return '🎉';
      case 'milestone':
        return '🏆';
      case 'perfect_streak':
        return '⭐';
      case 'first_achievement':
        return '🎯';
      case 'bonus_earned':
        return '💎';
      default:
        return '🎊';
    }
  };

  const getAnimationClass = () => {
    return `${celebration.animation} ${celebration.intensity}`;
  };

  if (!isActive) return null;

  return (
    <div className={`celebration-overlay ${getAnimationClass()}`}>
      {/* Canvas for particle effects */}
      <canvas
        ref={canvasRef}
        className="effects-canvas"
        width={window.innerWidth}
        height={window.innerHeight}
      />

      {/* Confetti particles */}
      {confetti.map(piece => (
        <div
          key={piece.id}
          className={`confetti-piece ${piece.shape}`}
          style={{
            left: piece.x,
            top: piece.y,
            transform: `rotate(${piece.rotation}deg)`,
            backgroundColor: piece.color,
            width: piece.size,
            height: piece.size
          }}
        />
      ))}

      {/* Sparkles */}
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="sparkle"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            transform: `scale(${sparkle.scale})`,
            opacity: sparkle.opacity,
            animationDelay: `${sparkle.delay}ms`,
            animationDuration: `${sparkle.duration}ms`
          }}
        >
          ✨
        </div>
      ))}

      {/* Main celebration message */}
      <div className="celebration-message">
        <div className="celebration-icon">
          {getCelebrationIcon()}
        </div>
        <div className="celebration-text">
          {celebration.message}
        </div>
        {celebration.celebrationType === 'level_up' && (
          <div className="celebration-subtitle">
            Keep up the amazing work!
          </div>
        )}
      </div>

      {/* Celebration rings */}
      <div className="celebration-rings">
        <div className="ring ring-1"></div>
        <div className="ring ring-2"></div>
        <div className="ring ring-3"></div>
      </div>

      {/* Achievement badge (for level ups and milestones) */}
      {(celebration.celebrationType === 'level_up' || celebration.celebrationType === 'milestone') && (
        <div className="achievement-badge">
          <div className="badge-shine"></div>
          <div className="badge-content">
            {celebration.celebrationType === 'level_up' ? '🏅' : '🏆'}
          </div>
        </div>
      )}

      <style jsx>{`
        .celebration-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .effects-canvas {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
        }

        .confetti-piece {
          position: absolute;
          pointer-events: none;
          z-index: 10000;
        }

        .confetti-piece.square {
          border-radius: 2px;
        }

        .confetti-piece.circle {
          border-radius: 50%;
        }

        .confetti-piece.triangle {
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 8px solid currentColor;
        }

        .sparkle {
          position: absolute;
          pointer-events: none;
          font-size: 16px;
          animation: sparkleFloat 2s ease-in-out infinite;
          z-index: 10001;
        }

        .celebration-message {
          text-align: center;
          color: white;
          z-index: 10002;
          animation: messageAppear 0.8s ease-out;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          padding: 40px 60px;
          border-radius: 20px;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .celebration-icon {
          font-size: 80px;
          margin-bottom: 20px;
          animation: iconBounce 1.2s ease-out infinite;
        }

        .celebration-text {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 10px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          animation: textGlow 2s ease-in-out infinite alternate;
        }

        .celebration-subtitle {
          font-size: 18px;
          opacity: 0.9;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .celebration-rings {
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
        }

        .ring {
          position: absolute;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          animation: ringExpand 2s ease-out infinite;
        }

        .ring-1 {
          width: 200px;
          height: 200px;
          border-color: rgba(251, 191, 36, 0.5);
          animation-delay: 0s;
        }

        .ring-2 {
          width: 300px;
          height: 300px;
          border-color: rgba(59, 130, 246, 0.5);
          animation-delay: 0.3s;
        }

        .ring-3 {
          width: 400px;
          height: 400px;
          border-color: rgba(239, 68, 68, 0.5);
          animation-delay: 0.6s;
        }

        .achievement-badge {
          position: absolute;
          top: 20%;
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 30px rgba(251, 191, 36, 0.5);
          z-index: 10003;
          animation: badgeFloat 3s ease-in-out infinite;
          overflow: hidden;
        }

        .badge-shine {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 70%
          );
          animation: shineMove 2s ease-in-out infinite;
        }

        .badge-content {
          font-size: 48px;
          z-index: 1;
          animation: badgePulse 2s ease-in-out infinite;
        }

        /* Intensity variations */
        .celebration-overlay.epic .celebration-icon {
          font-size: 120px;
        }

        .celebration-overlay.epic .celebration-text {
          font-size: 48px;
        }

        .celebration-overlay.minimal .celebration-icon {
          font-size: 60px;
        }

        .celebration-overlay.minimal .celebration-text {
          font-size: 24px;
        }

        /* Animation keyframes */
        @keyframes messageAppear {
          from {
            opacity: 0;
            transform: scale(0.5) translateY(50px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes iconBounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-20px);
          }
          60% {
            transform: translateY(-10px);
          }
        }

        @keyframes textGlow {
          from {
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          }
          to {
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.3);
          }
        }

        @keyframes ringExpand {
          from {
            transform: scale(0);
            opacity: 1;
          }
          to {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes sparkleFloat {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(90deg);
          }
          50% {
            transform: translateY(0) rotate(180deg);
          }
          75% {
            transform: translateY(10px) rotate(270deg);
          }
        }

        @keyframes badgeFloat {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          33% {
            transform: translateY(-10px) rotate(5deg);
          }
          66% {
            transform: translateY(5px) rotate(-5deg);
          }
        }

        @keyframes shineMove {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          50% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
          100% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
        }

        @keyframes badgePulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .celebration-message {
            padding: 30px 40px;
            margin: 0 20px;
          }

          .celebration-icon {
            font-size: 60px;
          }

          .celebration-text {
            font-size: 24px;
          }

          .celebration-subtitle {
            font-size: 16px;
          }

          .achievement-badge {
            width: 80px;
            height: 80px;
          }

          .badge-content {
            font-size: 32px;
          }
        }

        @media (max-width: 480px) {
          .celebration-message {
            padding: 20px 30px;
          }

          .celebration-icon {
            font-size: 48px;
          }

          .celebration-text {
            font-size: 20px;
          }

          .celebration-subtitle {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};