import React, { useEffect, useRef, useState } from 'react';
import './VoiceOrb.css';

const VoiceOrb = ({
  isListening = false,
  isSpeaking = false,
  audioLevel = 0,
  size = 120,
  className = ''
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [particles, setParticles] = useState([]);

  // Initialize particles for ambient effect
  useEffect(() => {
    const particleCount = 12;
    const newParticles = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        angle: (Math.PI * 2 * i) / particleCount,
        radius: size * 0.3,
        speed: 0.02 + Math.random() * 0.02,
        size: 2 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.3
      });
    }
    setParticles(newParticles);
  }, [size]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw main orb with gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);

      if (isSpeaking) {
        // Warm purple gradient when speaking
        gradient.addColorStop(0, 'rgba(147, 51, 234, 0.9)'); // purple-600
        gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.6)'); // purple-500
        gradient.addColorStop(1, 'rgba(196, 181, 253, 0.3)'); // purple-300
      } else if (isListening) {
        // Cool blue gradient when listening
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)'); // blue-500
        gradient.addColorStop(0.5, 'rgba(96, 165, 250, 0.6)'); // blue-400
        gradient.addColorStop(1, 'rgba(191, 219, 254, 0.3)'); // blue-200
      } else {
        // Neutral gray when idle
        gradient.addColorStop(0, 'rgba(107, 114, 128, 0.6)'); // gray-500
        gradient.addColorStop(0.5, 'rgba(156, 163, 175, 0.4)'); // gray-400
        gradient.addColorStop(1, 'rgba(209, 213, 219, 0.2)'); // gray-300
      }

      // Draw main circle with pulsing effect
      const pulseScale = 1 + (Math.sin(time * 0.003) * 0.05);
      const activeScale = isListening || isSpeaking ? 1.1 : 1;
      const finalScale = pulseScale * activeScale;

      ctx.beginPath();
      ctx.arc(centerX, centerY, (size / 2) * finalScale, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw audio level ring when active
      if ((isListening || isSpeaking) && audioLevel > 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (size / 2 + 10) * finalScale, 0, Math.PI * 2);
        ctx.strokeStyle = isListening
          ? `rgba(59, 130, 246, ${audioLevel})`
          : `rgba(147, 51, 234, ${audioLevel})`;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Secondary ring for emphasis
        ctx.beginPath();
        ctx.arc(centerX, centerY, (size / 2 + 20) * finalScale * (1 + audioLevel * 0.1), 0, Math.PI * 2);
        ctx.strokeStyle = isListening
          ? `rgba(96, 165, 250, ${audioLevel * 0.5})`
          : `rgba(168, 85, 247, ${audioLevel * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw orbiting particles
      particles.forEach((particle, index) => {
        const angle = particle.angle + time * particle.speed;
        const radiusOffset = Math.sin(time * 0.002 + index) * 10;
        const x = centerX + Math.cos(angle) * (particle.radius + radiusOffset) * finalScale;
        const y = centerY + Math.sin(angle) * (particle.radius + radiusOffset) * finalScale;

        ctx.beginPath();
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = isListening
          ? `rgba(59, 130, 246, ${particle.opacity * (isListening ? 1 : 0.3)})`
          : isSpeaking
          ? `rgba(147, 51, 234, ${particle.opacity * (isSpeaking ? 1 : 0.3)})`
          : `rgba(156, 163, 175, ${particle.opacity * 0.3})`;
        ctx.fill();
      });

      time++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening, isSpeaking, audioLevel, particles, size]);

  return (
    <div className={`voice-orb-container ${className}`}>
      <canvas
        ref={canvasRef}
        width={size * 2}
        height={size * 2}
        className="voice-orb-canvas"
        style={{ width: size, height: size }}
      />
      <div className="voice-orb-status">
        {isSpeaking && <span className="text-purple-600 font-medium">Speaking...</span>}
        {isListening && <span className="text-blue-600 font-medium">Listening...</span>}
        {!isSpeaking && !isListening && <span className="text-gray-500">Ready</span>}
      </div>
    </div>
  );
};

export default VoiceOrb;