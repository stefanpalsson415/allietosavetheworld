// src/components/dashboard/styles.js
// Global styles for radar chart and dashboard components with Nordic-inspired design

const styles = `
  .animation-bounce-in {
    animation: bounceIn 0.5s;
  }
  
  @keyframes bounceIn {
    0% { transform: scale(0.8); opacity: 0; }
    70% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); }
  }
  
  /* New animations for habit card */
  .streak-badge {
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); }
    100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
  }
  
  .completion-button {
    transition: all 0.2s ease;
  }
  
  .completion-button:hover {
    transform: scale(1.05);
  }
  
  .identity-badge {
    position: relative;
    overflow: hidden;
  }
  
  .identity-badge:after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg, 
      rgba(255, 255, 255, 0) 0%, 
      rgba(255, 255, 255, 0.2) 50%, 
      rgba(255, 255, 255, 0) 100%
    );
    animation: shine 3s infinite;
  }
  
  @keyframes shine {
    to {
      left: 100%;
    }
  }
  
  .pulse-animation {
    animation: pulseBg 2s infinite;
  }
  
  @keyframes pulseBg {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  /* Nordic-inspired design styles */
  .radar-chart-grid {
    stroke: #D1D5DB; /* stone-300 color */
    stroke-width: 1.5;
  }
  
  .mama-radar {
    fill: #8E8EE0; /* lavender color */
    fill-opacity: 0.15;
    stroke: #8E8EE0;
    stroke-width: 3;
  }
  
  .papa-radar {
    fill: #5C8A64; /* pine color */
    fill-opacity: 0.15;
    stroke: #5C8A64;
    stroke-width: 3;
  }
  
  .history-radar {
    stroke-dasharray: 4 4;
    stroke-width: 1.5;
  }
  
  /* Step cards */
  .step-card {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #F3F4F6; /* gray-100 */
    padding: 1rem;
  }
  
  /* Progress indicators */
  .progress-step {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .progress-step.completed {
    background-color: #8E8EE0; /* lavender */
    color: white;
  }
  
  .progress-step.current {
    background-color: white;
    color: #8E8EE0;
    border: 2px solid #8E8EE0;
  }
  
  .progress-step.upcoming {
    background-color: #F3F4F6; /* gray-100 */
    color: #9CA3AF; /* gray-400 */
    border: 1px solid #E5E7EB; /* gray-200 */
  }
  
  /* Status tags */
  .status-tag {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-weight: 500;
  }
  
  .status-tag.completed {
    color: #10B981; /* emerald-500 */
    background-color: #ECFDF5; /* emerald-50 */
  }
  
  .status-tag.in-progress {
    color: #6366F1; /* indigo-500 */
    background-color: #EEF2FF; /* indigo-50 */
  }
  
  .status-tag.locked {
    color: #9CA3AF; /* gray-400 */
    background-color: #F3F4F6; /* gray-100 */
  }
  
  /* Animations */
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .animate-slideLeft {
    animation: slideLeft 0.4s ease-out;
  }
  
  @keyframes slideLeft {
    from { transform: translateX(20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  /* Confetti animation for completion */
  .confetti-burst {
    position: relative;
  }
  
  .confetti-burst::after {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    width: calc(100% + 20px);
    height: calc(100% + 20px);
    background-image: 
      radial-gradient(circle, #8E8EE0 2px, transparent 2px),
      radial-gradient(circle, #5C8A64 3px, transparent 3px),
      radial-gradient(circle, #F27575 2px, transparent 2px),
      radial-gradient(circle, #FBBF24 3px, transparent 3px);
    background-size: 20px 20px;
    background-position: 0 0, 10px 10px, 15px 5px, 5px 15px;
    animation: confettiFade 0.6s ease-out forwards;
    pointer-events: none;
    opacity: 0;
  }
  
  @keyframes confettiFade {
    0% { transform: scale(0.5); opacity: 0; }
    50% { opacity: 0.5; }
    100% { transform: scale(1.2); opacity: 0; }
  }
`;

export default styles;