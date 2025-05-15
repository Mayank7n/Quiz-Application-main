import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, AnimatePresenceProps } from 'framer-motion';
import { HelpCircle, X, ChevronRight, Sparkles } from 'lucide-react';
import './GuideBot.css';

// Add Google Fonts
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

const GuideBot = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentTip, setCurrentTip] = useState(0);
  
  const tips = [
    {
      id: 'welcome',
      title: '👋 Welcome to QuizMaster!',
      message: 'I\'m your guide! Let me show you around and help you get started.',
      selector: ''
    },
    {
      id: 'start-quiz',
      title: '🎯 Start a Quiz',
      message: 'Click on any quiz card to begin testing your knowledge! Try to beat your high score!',
      selector: '.quiz-card',
      emoji: '📝'
    },
    {
      id: 'check-ranking',
      title: '🏆 Check Rankings',
      message: 'Compete with friends and see who tops the leaderboard!',
      selector: 'a[href="/leaderboard"]',
      emoji: '📊'
    },
    {
      id: 'create-quiz',
      title: '✨ Create Your Own Quiz',
      message: 'Unleash your creativity and share your own quizzes with the community!',
      selector: 'a[href="/create-quiz"]',
      emoji: '🎨'
    },
    {
      id: 'profile',
      title: '👤 Your Profile',
      message: 'Track your progress, see your achievements, and manage your account.',
      selector: 'a[href="/profile"]',
      emoji: '📈'
    }
  ];

  const [isHighlighted, setIsHighlighted] = useState(false);
  const highlightedElement = useRef(null);

  useEffect(() => {
    // Add highlight class to current tip's element
    const currentTipData = tips[currentTip];
    if (currentTipData && currentTipData.selector) {  // Check if selector exists and is not empty
      try {
        const element = document.querySelector(currentTipData.selector);
        if (element) {
          // Remove highlight from previous element
          if (highlightedElement.current) {
            highlightedElement.current.classList.remove('highlight-element');
          }
          
          // Add highlight to new element
          element.classList.add('highlight-element');
          highlightedElement.current = element;
          
          // Scroll to element if not in viewport
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (error) {
        console.warn('Error highlighting element:', error);
      }
    }

    return () => {
      // Clean up highlight when component unmounts or tip changes
      if (highlightedElement.current) {
        try {
          highlightedElement.current.classList.remove('highlight-element');
        } catch (error) {
          console.warn('Error removing highlight:', error);
        }
      }
    };
  }, [currentTip]);

  // Save visibility state to localStorage
  useEffect(() => {
    localStorage.setItem('guideBotVisible', JSON.stringify(isVisible));
  }, [isVisible]);

  // Load initial state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('guideBotVisible');
    if (savedState !== null) {
      setIsVisible(JSON.parse(savedState));
    }
  }, []);

  return (
    <>
      {/* Floating Action Button to reopen the bot */}
      <AnimatePresence>
        {!isVisible && (
          <motion.button
            className="guide-fab"
            onClick={() => setIsVisible(true)}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Need help?"
            aria-label="Open help guide"
          >
            <HelpCircle size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVisible && (
        <motion.div 
          className="guide-bot"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: {
              type: 'spring',
              damping: 20,
              stiffness: 300
            }
          }}
          exit={{ 
            opacity: 0, 
            y: 20, 
            scale: 0.95,
            transition: {
              duration: 0.2
            }
          }}
          whileHover={{
            scale: 1.01,
            transition: { duration: 0.3 }
          }}
        >
          <div className="guide-bot-header">
            <div className="d-flex align-items-center">
              <Sparkles size={16} className="me-2" fill="#FBBF24" stroke="#F59E0B" />
              <span>{tips[currentTip]?.title || 'Your Guide'}</span>
            </div>
            <button 
              className="close-btn"
              onClick={() => setIsVisible(false)}
              aria-label="Close guide"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="guide-bot-body">
            <div className="bot-avatar">
              <motion.div
                animate={{
                  y: [0, -5, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  y: {
                    duration: 4,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut'
                  },
                  rotate: {
                    duration: 8,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut'
                  }
                }}
              >
                <svg width="80" height="80" viewBox="0 0 200 200">
                  {/* Head */}
                  <circle cx="100" cy="100" r="80" fill="#7E22CE" />
                  
                  {/* Shine effect */}
                  <circle cx="140" cy="70" r="30" fill="rgba(255,255,255,0.1)" />
                  
                  {/* Eyes */}
                  <g className="eyes">
                    <circle cx="70" cy="80" r="15" fill="white">
                      <animate 
                        attributeName="r" 
                        values="15;12;15" 
                        dur="3s" 
                        repeatCount="indefinite" 
                      />
                    </circle>
                    <circle cx="130" cy="80" r="15" fill="white">
                      <animate 
                        attributeName="r" 
                        values="15;12;15" 
                        dur="3s" 
                        repeatCount="indefinite" 
                        begin="0.5s"
                      />
                    </circle>
                    
                    {/* Eyeballs */}
                    <circle cx="70" cy="80" r="5" fill="#4B0082" />
                    <circle cx="130" cy="80" r="5" fill="#4B0082" />
                    
                    {/* Eye shine */}
                    <circle cx="72" cy="78" r="2" fill="white" />
                    <circle cx="132" cy="78" r="2" fill="white" />
                  </g>
                  
                  {/* Smile */}
                  <motion.path 
                    d="M70 140 Q100 170 130 140" 
                    stroke="white" 
                    strokeWidth="6" 
                    fill="transparent"
                    strokeLinecap="round"
                    initial={{ d: 'M70 140 Q100 170 130 140' }}
                    animate={{
                      d: [
                        'M70 140 Q100 170 130 140',
                        'M70 140 Q100 190 130 140',
                        'M70 140 Q100 170 130 140',
                      ]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: 'easeInOut'
                    }}
                  />
                  
                  {/* Cheeks */}
                  <circle cx="50" cy="120" r="10" fill="#9F7AEA" />
                  <circle cx="150" cy="120" r="10" fill="#9F7AEA" />
                </svg>
              </motion.div>
            </div>
            
            <motion.p 
              className="bot-message"
              key={currentTip}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {tips[currentTip]?.message || 'Welcome to our amazing quiz platform!'}
            </motion.p>
          </div>
          
          <div className="guide-bot-footer">
            <motion.button 
              className="next-tip"
              onClick={() => setCurrentTip((prev) => (prev + 1) % tips.length)}
              whileTap={{ scale: 0.95 }}
            >
              {currentTip === tips.length - 1 ? 'Start Over' : 'Next Tip'}
              <ChevronRight size={16} className="ms-1" />
            </motion.button>
            
            {/* Progress dots */}
            <div className="d-flex justify-content-center mt-2 mb-2" style={{ gap: '6px' }}>
              {tips.map((_, index) => (
                <motion.div
                  key={index}
                  className="progress-dot"
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: index === currentTip ? '#9333EA' : '#E9D5FF',
                    cursor: 'pointer'
                  }}
                  onClick={() => setCurrentTip(index)}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GuideBot;
