import React, { useState } from 'react';
import { SparklesIcon, ArrowRightIcon, UserIcon, ClipboardIcon } from '../utils/icons';

interface SplashScreenProps {
  onComplete: (persona: 'caseworker' | 'supervisor') => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleGetStarted = () => {
    setIsTransitioning(true);
    // Wait for fade out animation
    setTimeout(() => {
      setShowOptions(true);
      setIsTransitioning(false);
    }, 500);
  };

  const handlePersonaSelect = (persona: 'caseworker' | 'supervisor') => {
    setIsTransitioning(true);
    // Wait for fade out before completing
    setTimeout(() => {
      onComplete(persona);
    }, 500);
  };

  return (
    <div className="splash-screen">
      {/* Animated Background */}
      <div className="splash-animated-background">
        <div className="gradient-layer-1"></div>
        <div className="gradient-layer-2"></div>
        <div className="gradient-layer-3"></div>
      </div>

      {/* Content */}
      <div className="splash-content">
        {!showOptions ? (
          <div className={`welcome-container ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
            <div className="icon-container">
              <SparklesIcon className="splash-icon" />
            </div>
            <h1 className="welcome-title glossy-text">
              <span>Social Work</span><br />
              <span className="highlight">Coaching Simulator</span>
            </h1>
            <p className="welcome-subtitle">
              An AI partner to help you practice, get feedback, and grow your professional skills
            </p>
            <button 
              className="get-started-btn glossy-button"
              onClick={handleGetStarted}
            >
              <span>Get Started</span>
              <ArrowRightIcon className="w-6 h-6" />
            </button>
          </div>
        ) : (
          <div className={`options-preview ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
            <h2 className="options-title">Who are you?</h2>
            <p className="welcome-subtitle" style={{marginBottom: 'var(--unit-8)'}}>
              Select your role to personalize your experience
            </p>
            <div className="option-cards">
              <div className="option-card persona-card" onClick={() => handlePersonaSelect('caseworker')}>
                <UserIcon className="persona-icon" />
                <h3>Caseworker</h3>
                <p>Practice counseling simulations and receive AI feedback</p>
              </div>
              <div className="option-card persona-card" onClick={() => handlePersonaSelect('supervisor')}>
                <ClipboardIcon className="persona-icon" />
                <h3>Supervisor</h3>
                <p>Review transcripts and provide coaching feedback</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;
