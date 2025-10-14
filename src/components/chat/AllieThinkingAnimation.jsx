import React from 'react';
import './AllieThinkingAnimation.css';

const AllieThinkingAnimation = ({ isThinking = false, size = 80 }) => {
  return (
    <div className={`allie-thinking-container ${isThinking ? 'thinking' : ''}`}>
      <svg
        className="allie-stick-family"
        viewBox="0 0 400 200"
        width={size * 2}
        height={size}
      >
        {/* Stick figure family - purple theme */}
        <g className="family-group">
          {/* Mom */}
          <g className="family-member mom">
            <circle cx="60" cy="50" r="12" fill="none" stroke="#9333ea" strokeWidth="2" />
            {/* Hair */}
            <path d="M 48 45 Q 45 40, 48 35" fill="none" stroke="#9333ea" strokeWidth="2" />
            <path d="M 72 45 Q 75 40, 72 35" fill="none" stroke="#9333ea" strokeWidth="2" />
            {/* Face */}
            <circle cx="55" cy="48" r="1.5" fill="#9333ea" />
            <circle cx="65" cy="48" r="1.5" fill="#9333ea" />
            <path d="M 55 54 Q 60 57, 65 54" fill="none" stroke="#9333ea" strokeWidth="1.5" strokeLinecap="round" />
            {/* Body - dress */}
            <line x1="60" y1="62" x2="60" y2="85" stroke="#9333ea" strokeWidth="2" />
            <path d="M 60 85 L 45 115 L 75 115 Z" fill="none" stroke="#9333ea" strokeWidth="2" />
            {/* Arms */}
            <line x1="60" y1="70" x2="45" y2="85" stroke="#9333ea" strokeWidth="2" />
            <line x1="60" y1="70" x2="75" y2="85" stroke="#9333ea" strokeWidth="2" />
            {/* Legs */}
            <line x1="50" y1="115" x2="50" y2="140" stroke="#9333ea" strokeWidth="2" />
            <line x1="70" y1="115" x2="70" y2="140" stroke="#9333ea" strokeWidth="2" />
          </g>

          {/* Child 1 */}
          <g className="family-member child1">
            <circle cx="130" cy="70" r="10" fill="none" stroke="#a855f7" strokeWidth="2" />
            {/* Face */}
            <circle cx="126" cy="68" r="1.5" fill="#a855f7" />
            <circle cx="134" cy="68" r="1.5" fill="#a855f7" />
            <path d="M 126 73 Q 130 75, 134 73" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" />
            {/* Body */}
            <line x1="130" y1="80" x2="130" y2="100" stroke="#a855f7" strokeWidth="2" />
            {/* Arms */}
            <line x1="130" y1="85" x2="120" y2="95" stroke="#a855f7" strokeWidth="2" />
            <line x1="130" y1="85" x2="140" y2="95" stroke="#a855f7" strokeWidth="2" />
            {/* Legs */}
            <line x1="130" y1="100" x2="125" y2="120" stroke="#a855f7" strokeWidth="2" />
            <line x1="130" y1="100" x2="135" y2="120" stroke="#a855f7" strokeWidth="2" />
          </g>

          {/* Child 2 - smaller */}
          <g className="family-member child2">
            <circle cx="190" cy="80" r="8" fill="none" stroke="#c084fc" strokeWidth="2" />
            {/* Face */}
            <circle cx="187" cy="78" r="1.5" fill="#c084fc" />
            <circle cx="193" cy="78" r="1.5" fill="#c084fc" />
            <path d="M 187 82 Q 190 84, 193 82" fill="none" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />
            {/* Body - dress */}
            <line x1="190" y1="88" x2="190" y2="100" stroke="#c084fc" strokeWidth="2" />
            <path d="M 190 100 L 183 115 L 197 115 Z" fill="none" stroke="#c084fc" strokeWidth="2" />
            {/* Arms */}
            <line x1="190" y1="92" x2="183" y2="100" stroke="#c084fc" strokeWidth="2" />
            <line x1="190" y1="92" x2="197" y2="100" stroke="#c084fc" strokeWidth="2" />
            {/* Legs */}
            <line x1="186" y1="115" x2="186" y2="125" stroke="#c084fc" strokeWidth="2" />
            <line x1="194" y1="115" x2="194" y2="125" stroke="#c084fc" strokeWidth="2" />
          </g>

          {/* Child 3 - smallest */}
          <g className="family-member child3">
            <circle cx="240" cy="85" r="7" fill="none" stroke="#e9d5ff" strokeWidth="2" />
            {/* Face */}
            <circle cx="238" cy="83" r="1" fill="#e9d5ff" />
            <circle cx="242" cy="83" r="1" fill="#e9d5ff" />
            <path d="M 238 87 Q 240 88, 242 87" fill="none" stroke="#e9d5ff" strokeWidth="1.5" strokeLinecap="round" />
            {/* Body */}
            <line x1="240" y1="92" x2="240" y2="105" stroke="#e9d5ff" strokeWidth="2" />
            {/* Arms */}
            <line x1="240" y1="95" x2="235" y2="100" stroke="#e9d5ff" strokeWidth="2" />
            <line x1="240" y1="95" x2="245" y2="100" stroke="#e9d5ff" strokeWidth="2" />
            {/* Legs */}
            <line x1="240" y1="105" x2="237" y2="115" stroke="#e9d5ff" strokeWidth="2" />
            <line x1="240" y1="105" x2="243" y2="115" stroke="#e9d5ff" strokeWidth="2" />
          </g>

          {/* Dad */}
          <g className="family-member dad">
            <circle cx="300" cy="50" r="12" fill="none" stroke="#7c3aed" strokeWidth="2" />
            {/* Hair (spiky) */}
            <line x1="300" y1="38" x2="300" y2="42" stroke="#7c3aed" strokeWidth="2" />
            <line x1="295" y1="39" x2="297" y2="43" stroke="#7c3aed" strokeWidth="2" />
            <line x1="305" y1="39" x2="303" y2="43" stroke="#7c3aed" strokeWidth="2" />
            {/* Face */}
            <circle cx="295" cy="48" r="1.5" fill="#7c3aed" />
            <circle cx="305" cy="48" r="1.5" fill="#7c3aed" />
            <path d="M 295 54 Q 300 57, 305 54" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
            {/* Body */}
            <line x1="300" y1="62" x2="300" y2="100" stroke="#7c3aed" strokeWidth="2" />
            {/* Arms */}
            <line x1="300" y1="70" x2="285" y2="85" stroke="#7c3aed" strokeWidth="2" />
            <line x1="300" y1="70" x2="315" y2="85" stroke="#7c3aed" strokeWidth="2" />
            {/* Legs */}
            <line x1="300" y1="100" x2="290" y2="140" stroke="#7c3aed" strokeWidth="2" />
            <line x1="300" y1="100" x2="310" y2="140" stroke="#7c3aed" strokeWidth="2" />
          </g>

          {/* Dog */}
          <g className="family-member pet">
            <ellipse cx="350" cy="120" rx="15" ry="8" fill="none" stroke="#a855f7" strokeWidth="2" />
            {/* Head */}
            <circle cx="365" cy="115" r="6" fill="none" stroke="#a855f7" strokeWidth="2" />
            {/* Ears */}
            <path d="M 360 112 Q 357 108, 360 110" fill="none" stroke="#a855f7" strokeWidth="2" />
            <path d="M 370 112 Q 373 108, 370 110" fill="none" stroke="#a855f7" strokeWidth="2" />
            {/* Face */}
            <circle cx="363" cy="114" r="1" fill="#a855f7" />
            <circle cx="367" cy="114" r="1" fill="#a855f7" />
            {/* Legs */}
            <line x1="345" y1="125" x2="345" y2="135" stroke="#a855f7" strokeWidth="2" />
            <line x1="350" y1="125" x2="350" y2="135" stroke="#a855f7" strokeWidth="2" />
            <line x1="355" y1="125" x2="355" y2="135" stroke="#a855f7" strokeWidth="2" />
            <line x1="360" y1="125" x2="360" y2="135" stroke="#a855f7" strokeWidth="2" />
            {/* Tail */}
            <path d="M 335 118 Q 330 110, 335 105" fill="none" stroke="#a855f7" strokeWidth="2" className="tail-wag" />
          </g>

          {/* Holding hands lines */}
          <line x1="75" y1="85" x2="120" y2="95" stroke="#9333ea" strokeWidth="1" opacity="0.5" strokeDasharray="2,2" />
          <line x1="140" y1="95" x2="183" y2="100" stroke="#a855f7" strokeWidth="1" opacity="0.5" strokeDasharray="2,2" />
          <line x1="197" y1="100" x2="235" y2="100" stroke="#c084fc" strokeWidth="1" opacity="0.5" strokeDasharray="2,2" />
          <line x1="245" y1="100" x2="285" y2="85" stroke="#e9d5ff" strokeWidth="1" opacity="0.5" strokeDasharray="2,2" />
        </g>
      </svg>
    </div>
  );
};

export default AllieThinkingAnimation;