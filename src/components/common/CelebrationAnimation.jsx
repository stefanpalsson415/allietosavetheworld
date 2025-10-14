import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, Sparkles, Gift } from 'lucide-react';

// Celebration animation component for successful actions
const CelebrationAnimation = ({ type = 'confetti', duration = 3000, onComplete }) => {
  useEffect(() => {
    let animationTimer;
    
    switch (type) {
      case 'confetti':
        // Fire confetti from multiple angles
        const fireConfetti = () => {
          // Left side
          confetti({
            particleCount: 100,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']
          });
          
          // Right side
          confetti({
            particleCount: 100,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']
          });
          
          // Center burst
          confetti({
            particleCount: 50,
            angle: 90,
            spread: 70,
            origin: { x: 0.5, y: 0.5 },
            colors: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']
          });
        };
        
        fireConfetti();
        
        // Fire again after a short delay for extended effect
        setTimeout(fireConfetti, 250);
        setTimeout(fireConfetti, 500);
        break;
        
      case 'stars':
        // Create star burst effect
        const count = 200;
        const defaults = {
          origin: { y: 0.7 },
          colors: ['#FFD700', '#FFA500', '#FFFF00']
        };
        
        function fire(particleRatio, opts) {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
            shapes: ['star']
          });
        }
        
        fire(0.25, {
          spread: 26,
          startVelocity: 55,
        });
        fire(0.2, {
          spread: 60,
        });
        fire(0.35, {
          spread: 100,
          decay: 0.91,
          scalar: 0.8
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 25,
          decay: 0.92,
          scalar: 1.2
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 45,
        });
        break;
        
      case 'emojis':
        // Emoji celebration for rewards
        const emojiDefaults = {
          spread: 180,
          ticks: 100,
          gravity: 0.5,
          decay: 0.94,
          startVelocity: 30,
          origin: { y: 0.6 }
        };
        
        confetti({
          ...emojiDefaults,
          particleCount: 60,
          scalar: 1.5,
          shapes: ['circle'],
          colors: ['#FF69B4', '#FFD700', '#00CED1', '#FF6347', '#7FFF00']
        });
        break;
        
      default:
        break;
    }
    
    // Clear confetti and call onComplete after duration
    animationTimer = setTimeout(() => {
      confetti.reset();
      if (onComplete) {
        onComplete();
      }
    }, duration);
    
    return () => {
      clearTimeout(animationTimer);
      confetti.reset();
    };
  }, [type, duration, onComplete]);
  
  // Render floating icons for visual feedback
  const renderFloatingIcons = () => {
    switch (type) {
      case 'stars':
        return (
          <>
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 2) * 20}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.5s'
                }}
              >
                <Star 
                  size={32} 
                  className="text-yellow-400 fill-yellow-400" 
                  style={{
                    filter: 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.5))'
                  }}
                />
              </div>
            ))}
          </>
        );
        
      case 'emojis':
        return (
          <>
            {[...Array(3)].map((_, i) => (
              <div 
                key={i}
                className="absolute animate-ping"
                style={{
                  left: `${30 + i * 20}%`,
                  top: '40%',
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '2s'
                }}
              >
                <Gift 
                  size={40} 
                  className="text-purple-500" 
                  style={{
                    filter: 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.5))'
                  }}
                />
              </div>
            ))}
          </>
        );
        
      default:
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles 
              size={64} 
              className="text-yellow-400 animate-spin" 
              style={{
                animationDuration: '3s',
                filter: 'drop-shadow(0 0 20px rgba(250, 204, 21, 0.5))'
              }}
            />
          </div>
        );
    }
  };
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {renderFloatingIcons()}
    </div>
  );
};

export default CelebrationAnimation;