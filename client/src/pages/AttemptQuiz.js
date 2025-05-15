import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Clock, AlertTriangle, ArrowLeft, Check, X, Award, BarChart2, Home } from "lucide-react";
import 'bootstrap/dist/css/bootstrap.min.css';

import "../styles/attemptQuiz.css";

// Support both local and production environments
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://localhost:5000/api" 
  : "https://quiz-application-main-alpha.vercel.app/api";

// Format time in seconds to MM:SS format
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const AttemptQuiz = () => {
  // Timer state
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fullscreenPrompt, setFullscreenPrompt] = useState(true);
  const [terminated, setTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState(null);

  // Fullscreen helpers
  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      const requestFullscreen = 
        elem.requestFullscreen || 
        elem.mozRequestFullScreen || 
        elem.webkitRequestFullscreen || 
        elem.msRequestFullscreen;
      
      if (requestFullscreen) {
        await requestFullscreen.call(elem);
        setFullscreenPrompt(false);
      } else {
        console.warn('Fullscreen API is not supported in this browser');
        setFullscreenPrompt(false); // Continue without fullscreen
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
      // Continue without fullscreen if there's an error
      setFullscreenPrompt(false);
    }
  };
  
  const exitFullscreen = async () => {
    try {
      // Only try to exit fullscreen if document is active
      if (document.hasFocus && typeof document.hasFocus === 'function' && !document.hasFocus()) {
        return;
      }
      
      // Check if any fullscreen element exists
      const fullscreenElement = 
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;
      
      if (!fullscreenElement) return; // Already not in fullscreen
      
      // Try to exit fullscreen using the standard method first
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } 
      // Fallback for older browsers
      else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } 
      else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } 
      else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (err) {
      console.warn('Error exiting fullscreen:', err);
      // Continue execution even if fullscreen exit fails
    }  // Ignore errors when exiting fullscreen
  };

  // On mount, check if quiz was previously terminated in localStorage
  useEffect(() => {
    const terminatedFlag = localStorage.getItem(`quiz_terminated_${id}`);
    if (terminatedFlag === 'true') {
      setTerminated(true);
      setTerminationReason("Quiz terminated: You have previously violated quiz rules.");
      setScore(0);
    }
    // eslint-disable-next-line
  }, [id]);

  // Detect cheating or leaving fullscreen
  useEffect(() => {
    if (fullscreenPrompt || showResults || terminated) return;
    // Copy/cut/contextmenu
    const handleCheat = (e) => {
      setTerminated(true);
      setTerminationReason("Quiz terminated: Copying or cheating detected.");
      setScore(0);
      // Mark quiz as terminated for this user in backend
      fetch(`${API_URL}/quiz/terminate/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      });
      exitFullscreen();
    };
    // Window/tab switch or fullscreen exit
    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && !showResults && !terminated) {
        setTerminated(true);
        setTerminationReason("Quiz terminated: Switched window or minimized.");
        setScore(0);
        // Only set terminated flag for this user
        localStorage.setItem(`quiz_terminated_${id}`, 'true');
        localStorage.removeItem(`availableQuizzes`);
        exitFullscreen().catch(err => console.error('Exit fullscreen error:', err));
      }
    };
    
    const handleFullscreenChange = () => {
      const isInFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      
      if (!isInFullscreen && !showResults && !terminated && !fullscreenPrompt) {
        setTerminated(true);
        setTerminationReason("Quiz terminated: Exited full screen mode.");
        setScore(0);
        // Only set terminated flag for this user
        localStorage.setItem(`quiz_terminated_${id}`, 'true');
        localStorage.removeItem(`availableQuizzes`);
      }
    };
    window.addEventListener("copy", handleCheat);
    window.addEventListener("cut", handleCheat);
    window.addEventListener("contextmenu", handleCheat);
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("blur", handleVisibility);
    return () => {
      window.removeEventListener("copy", handleCheat);
      window.removeEventListener("cut", handleCheat);
      window.removeEventListener("contextmenu", handleCheat);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("blur", handleVisibility);
    };
  }, [fullscreenPrompt, showResults, terminated]);

  // Prompt for fullscreen before quiz interaction
  useEffect(() => {
    if (!fullscreenPrompt) {
      // Try to enter fullscreen, but don't block quiz if it fails
      enterFullscreen().catch(err => {
        console.error('Failed to enter fullscreen:', err);
        // Continue with the quiz even if fullscreen fails
      });
    }
  }, [fullscreenPrompt]);


  useEffect(() => {
    if (user?.token) {
      fetchQuiz();
    }
  }, [id, user?.token]); // Added dependencies

  const fetchQuiz = async () => {
    try {
      if (!id || !user?.token) {
        setError("Missing quiz ID or user token");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/quiz/${id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch quiz");
      }

      const data = await response.json();
      
      if (!data || !data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("Invalid quiz data received");
      }
      
      setQuiz(data);
      setAnswers(new Array(data.questions.length).fill(null));
      setStartTime(new Date());
      
      if (typeof data.timeLimit === 'number' && data.timeLimit > 0) {
        setSecondsLeft(data.timeLimit * 60); // convert minutes to seconds
      } else {
        console.warn('Quiz timeLimit missing or zero, defaulting to 2 minutes');
        setSecondsLeft(120); // fallback: 2 minutes
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching quiz:", err);
      setError(err.message || "Failed to load quiz");
      setLoading(false);
    }
  };

  const handleAnswerSelect = (selectedOption) => {
    console.log(`Selected option ${selectedOption} for question ${currentQuestion + 1}`);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedOption;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResults = () => {
    if (!quiz || !quiz.questions) return { correctAnswers: 0, totalQuestions: 0, percentage: 0, passed: false };
    
    // Log the answers and correct answers for debugging
    console.log('User answers:', answers);
    console.log('Quiz questions with correct answers:', quiz.questions);
    
    let correctCount = 0;
    let detailedResults = [];
    
    // Check each question
    quiz.questions.forEach((question, index) => {
      const userAnswer = answers[index];
      
      // The correct answer could be stored in different formats
      // It might be a string, a number, or even the actual option text
      let correctAnswer = question.correctAnswer;
      
      // Try to normalize the correct answer to match our index-based selection
      if (correctAnswer !== null && correctAnswer !== undefined) {
        // If correctAnswer is a string that can be parsed as a number
        if (typeof correctAnswer === 'string' && !isNaN(correctAnswer)) {
          correctAnswer = parseInt(correctAnswer, 10);
        }
        // If correctAnswer is a string that might be the actual option text
        else if (typeof correctAnswer === 'string' && question.options) {
          // Find the index of the option that matches the correctAnswer text
          const optionIndex = question.options.findIndex(
            option => option.toLowerCase() === correctAnswer.toLowerCase()
          );
          if (optionIndex !== -1) {
            correctAnswer = optionIndex;
          }
        }
      }
      
      const isCorrect = userAnswer === correctAnswer;
      
      if (isCorrect) {
        correctCount++;
      }
      
      detailedResults.push({
        questionNumber: index + 1,
        questionText: question.questionText,
        userAnswer: userAnswer !== null ? userAnswer : 'Not answered',
        correctAnswer: correctAnswer,
        userAnswerText: userAnswer !== null && question.options ? question.options[userAnswer] : 'Not answered',
        correctAnswerText: correctAnswer !== null && question.options ? question.options[correctAnswer] : 'Unknown',
        isCorrect
      });
      
      console.log(`Question ${index + 1}: User answered ${userAnswer} (${userAnswer !== null && question.options ? question.options[userAnswer] : 'Not answered'}), ` +
        `Correct is ${correctAnswer} (${correctAnswer !== null && question.options ? question.options[correctAnswer] : 'Unknown'}), ` +
        `Match: ${isCorrect}`);
    });
    
    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = percentage >= (quiz.passingScore || 60);
    
    console.log(`Results: ${correctCount}/${totalQuestions} correct (${percentage}%)`);
    console.log('Detailed results:', detailedResults);
    
    return { 
      correctAnswers: correctCount, 
      totalQuestions, 
      percentage, 
      passed, 
      detailedResults 
    };
  };

  // Simplified submission to avoid API issues
  const handleSubmit = async () => {
    if (!quiz || !quiz.questions) {
      setError('Missing quiz data');
      return;
    }
    
    // Prevent double submission
    if (submitting) return;
    
    // Calculate results and get percentage at the start
    const results = calculateResults();
    const { percentage, correctAnswers, totalQuestions } = results;
    
    try {
      setSubmitting(true);
      
      // Calculate final time spent
      const now = new Date();
      let finalTimeSpent = timeSpent;
      if (startTime) {
        finalTimeSpent = Math.floor((now - startTime) / 1000);
      }
      
      // Try to submit to the server if user is authenticated
      if (user?.token) {
        try {
          const response = await fetch(`${API_URL}/quiz/${id}/submit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`,
            },
            body: JSON.stringify({
              answers,
              score: Math.round(percentage),
              timeSpent: finalTimeSpent,
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to submit quiz to server');
          }
          
          // Mark quiz as completed in local storage
          const completedQuizzes = JSON.parse(localStorage.getItem('completedQuizzes') || '[]');
          if (!completedQuizzes.includes(id)) {
            completedQuizzes.push(id);
            localStorage.setItem('completedQuizzes', JSON.stringify(completedQuizzes));
          }
          
          // Notify any parent components through window events
          window.dispatchEvent(new CustomEvent('quizCompleted', { detail: { quizId: id } }));
        } catch (apiError) {
          console.error('API submission error:', apiError);
          // Continue with local storage fallback
        }
      }
      
      // Store results locally as a fallback
      try {
        const existingAttempts = JSON.parse(localStorage.getItem('quiz_attempts') || '[]');
        existingAttempts.push({
          quizId: id,
          quizTitle: quiz.title || 'Unknown Quiz',
          score: Math.round(percentage),
          correctAnswers,
          totalQuestions,
          timeSpent: finalTimeSpent,
          completedAt: new Date().toISOString()
        });
        localStorage.setItem('quiz_attempts', JSON.stringify(existingAttempts));
      } catch (localError) {
        console.error('Local storage error:', localError);
      }
      
      // Exit fullscreen mode when showing results
      exitFullscreen();
      
      // Update UI
      setScore(percentage);
      setShowResults(true);
      
      // Scroll to top when showing results
      window.scrollTo(0, 0);
      
    } catch (err) {
      console.error('Error in quiz submission process:', err);
      setError('There was an issue saving your results. Your score has been recorded locally.');
      setScore(percentage);
      setShowResults(true);
      exitFullscreen();
    } finally {
      setSubmitting(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (!quiz || showResults || terminated || secondsLeft === null) return;
    
    // Update time spent
    if (startTime) {
      const now = new Date();
      const elapsed = Math.floor((now - startTime) / 1000);
      setTimeSpent(elapsed);
    }
    
    if (secondsLeft === 0) {
      setTimerExpired(true);
      handleSubmit();
      return;
    }
    
    const timer = setTimeout(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [secondsLeft, quiz, showResults, terminated, startTime]);

  if (loading) {
    return (
      <div className="quiz-attempt-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3" style={{ color: '#4b5563', fontSize: '1.1rem' }}>Preparing your quiz...</p>
      </div>
    );
  }

  // Fullscreen prompt modal
  if (fullscreenPrompt) {
    return (
      <div className="fullscreen-prompt">
        <div className="fullscreen-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          </svg>
        </div>
        <h2>Full Screen Required</h2>
        <p>To ensure a fair testing environment, please switch to full screen mode before starting the quiz.</p>
        <button 
          className="quiz-btn" 
          onClick={async () => {
            setFullscreenPrompt(false);
            try {
              await enterFullscreen();
            } catch (err) {
              console.error('Failed to enter fullscreen:', err);
              // Continue with the quiz even if fullscreen fails
            }
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          </svg>
          Continue in Full Screen
        </button>
      </div>
    );
  }

  if (terminated) {
    return (
      <div className="quiz-attempt-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', color: '#dc2626', marginBottom: '1rem' }}>
            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 style={{ color: '#1f2937', marginBottom: '1rem' }}>Quiz Terminated</h2>
          <p style={{ color: '#6b7280', fontSize: '1.1rem', marginBottom: '2rem' }}>{terminationReason}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              className="quiz-btn quiz-btn-outline"
              onClick={() => navigate('/')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Home size={18} />
              Home
            </button>
            <button 
              className="quiz-btn"
              onClick={() => navigate('/quiz')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ArrowLeft size={18} />
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-attempt-container" style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '4rem', color: '#dc2626', marginBottom: '1rem' }}>
          <AlertTriangle size={48} />
        </div>
        <h2 style={{ color: '#1f2937', marginBottom: '1rem' }}>Something went wrong</h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>{error}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            className="quiz-btn quiz-btn-outline"
            onClick={() => window.location.reload()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18-6M22 12.5a10 10 0 0 1-18 6"></path>
            </svg>
            Retry
          </button>
          <button 
            className="quiz-btn"
            onClick={() => navigate('/quiz')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={18} />
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return <div className="quiz-attempt-container">Quiz not found</div>;
  }

  if (showResults) {
    const { correctAnswers, totalQuestions, percentage, passed } = calculateResults();

    // Prepare data for chart
    const chartData = [
      { name: 'Correct', value: correctAnswers, fill: '#10b981' },
      { name: 'Incorrect', value: totalQuestions - correctAnswers, fill: '#ef4444' },
    ];

    // Calculate time taken
    const endTime = new Date();
    const timeTaken = Math.round((endTime - startTime) / 1000); // in seconds
    const timePerQuestion = Math.round(timeTaken / totalQuestions);

    return (
      <div className="quiz-attempt-container">
        <div className="quiz-results">
          <h2>Quiz Completed!</h2>
          
          <div className="quiz-score">
            {percentage}%
            <div style={{ fontSize: '1rem', color: passed ? '#10b981' : '#ef4444', marginTop: '0.5rem' }}>
              {passed ? 'Passed' : 'Failed'}
            </div>
          </div>
          
          <div className="quiz-message">
            You answered <strong>{correctAnswers}</strong> out of <strong>{totalQuestions}</strong> questions correctly.
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            margin: '2rem 0'
          }}>
            <div style={{ 
              background: '#f8fafc', 
              padding: '1.5rem', 
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>Time Taken</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1e293b' }}>
                {formatTime(timeTaken)}
              </div>
            </div>
            
            <div style={{ 
              background: '#f8fafc', 
              padding: '1.5rem', 
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>Avg. Time per Question</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1e293b' }}>
                {formatTime(timePerQuestion)}
              </div>
            </div>
            
            <div style={{ 
              background: '#f8fafc', 
              padding: '1.5rem', 
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>Passing Score</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1e293b' }}>
                {quiz.passingScore || 60}%
              </div>
            </div>
          </div>
          
          <div style={{ margin: '2rem 0', height: '300px' }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#334155' }}>Performance Overview</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  tick={{ fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar 
                  dataKey="value" 
                  name="Questions" 
                  radius={[4, 4, 0, 0]}
                  fill="#4f46e5"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              className="quiz-btn quiz-btn-outline"
              onClick={() => {
                window.scrollTo(0, 0);
                setShowResults(false);
                setCurrentQuestion(0);
                setAnswers(new Array(quiz.questions.length).fill(null));
                setSecondsLeft(quiz.timeLimit * 60 || 120);
                setTimerExpired(false);
                setStartTime(new Date());
                setTimeSpent(0);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v6h6M23 20v-6h-6"></path>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
              </svg>
              Retake Quiz
            </button>
            <button 
              className="quiz-btn"
              onClick={() => {
                // Update local storage to mark this quiz as completed
                const completedQuizzes = JSON.parse(localStorage.getItem('completedQuizzes') || '[]');
                if (!completedQuizzes.includes(quiz._id)) {
                  completedQuizzes.push(quiz._id);
                  localStorage.setItem('completedQuizzes', JSON.stringify(completedQuizzes));
                }
                // Navigate to home
                navigate('/');
              }}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                backgroundColor: '#10b981'
              }}
            >
              <Home size={18} />
              Back to Home
            </button>
            <button 
              className="quiz-btn"
              onClick={() => navigate('/quiz')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Award size={18} />
              View All Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get current question
  const currentQ = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  
  // Timer display class based on time remaining
  const getTimerClass = () => {
    if (!secondsLeft) return '';
    const minutesLeft = Math.ceil(secondsLeft / 60);
    if (minutesLeft <= 1) return 'critical';
    if (minutesLeft <= 3) return 'warning';
    return '';
  };

  // Quiz question view
  return (
    <div className="quiz-attempt-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className={`quiz-timer ${getTimerClass()}`}>
          <Clock size={18} />
          <span>Time Remaining: {formatTime(secondsLeft)}</span>
        </div>
        <div className="question-counter">
          Question {currentQuestion + 1} of {quiz.questions.length}
        </div>
      </div>
      
      <div className="progress-container">
        <div className="progress-info">
          <span>Progress</span>
          <span>{Math.round(((currentQuestion) / quiz.questions.length) * 100)}% Complete</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress" 
            style={{ 
              width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
              backgroundColor: timerExpired ? '#ef4444' : '#4f46e5'
            }}
          />
        </div>
      </div>
      
      <div className="question-card">
        <h3>{currentQ.questionText}</h3>
        
        <div className="options">
          {currentQ.options.map((option, index) => (
            <button
              key={index}
              className={`option-btn ${answers[currentQuestion] === index ? 'selected' : ''}`}
              onClick={() => handleAnswerSelect(index)}
            >
              <span style={{ flex: 1 }}>{option}</span>
              {answers[currentQuestion] === index && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
      
      <div className="navigation-buttons">
        <button 
          className="quiz-btn quiz-btn-outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={18} />
          Previous
        </button>
        
        {isLastQuestion ? (
          <button 
            className="quiz-btn"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              backgroundColor: submitting ? '#a5b4fc' : '#4f46e5'
            }}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Submitting...
              </>
            ) : (
              <>
                <Check size={18} />
                Submit Quiz
              </>
            )}
          </button>
        ) : (
          <button 
            className="quiz-btn"
            onClick={handleNext}
            disabled={answers[currentQuestion] === null || answers[currentQuestion] === undefined}
          >
            Next Question
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"></path>
            </svg>
          </button>
        )}
      </div>
      
      <div className="d-flex justify-content-center mt-4">
        <div className="text-muted small">
          Make sure to review your answers before submitting. You can't change them after submission.
        </div>
      </div>
    </div>
  );
};

export default AttemptQuiz;
