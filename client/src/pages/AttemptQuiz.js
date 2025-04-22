import API_URL from '../config';
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import "../styles/attemptQuiz.css";



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

  // Fullscreen helpers
  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };
  const exitFullscreen = () => {
    // Only try to exit fullscreen if document is active and in fullscreen
    if (document.hasFocus && typeof document.hasFocus === 'function' && !document.hasFocus()) return;
    if (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    ) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
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
import API_URL from '../config';

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
      if (document.visibilityState === "hidden" && !showResults) {
        setTerminated(true);
        setTerminationReason("Quiz terminated: Switched window or minimized.");
        setScore(0);
        // Only set terminated flag for this user
        localStorage.setItem(`quiz_terminated_${id}`, 'true');
        localStorage.removeItem(`availableQuizzes`);
        exitFullscreen();
      }
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !showResults) {
        setTerminated(true);
        setTerminationReason("Quiz terminated: Exited full screen mode.");
        setScore(0);
        // Only set terminated flag for this user
        localStorage.setItem(`quiz_terminated_${id}`, 'true');
        localStorage.removeItem(`availableQuizzes`);
        exitFullscreen();
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
      enterFullscreen();
    }
  }, [fullscreenPrompt]);


  useEffect(() => {
    fetchQuiz();
  }, [id, user?.token]); // Added dependencies

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`${API_URL}/quiz/${id}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch quiz");
      }

      const data = await response.json();
      setQuiz(data);
      setAnswers(new Array(data.questions.length).fill(null));
      if (typeof data.timeLimit === 'number' && data.timeLimit > 0) {
        setSecondsLeft(data.timeLimit * 60); // convert minutes to seconds
      } else {
        console.warn('Quiz timeLimit missing or zero, defaulting to 2 minutes');
        setSecondsLeft(120); // fallback: 2 minutes
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching quiz:", err);
      setError("Failed to load quiz");
      setLoading(false);
    }
  };

  const handleAnswerSelect = (selectedOption) => {
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

  const calculateScore = () => {
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    return (correctAnswers / quiz.questions.length) * 100;
  };

  const handleSubmit = async () => {
    const finalScore = calculateScore();
    setScore(finalScore);

    // Save the quiz result
    try {
      const response = await fetch(`${API_URL}/quiz/${id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          answers,
          score: finalScore,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit quiz");
      }

      setShowResults(true);
    } catch (err) {
      console.error("Error saving quiz result:", err);
      setError("Failed to submit quiz. Please try again.");
    }
  };

  // Timer effect
  useEffect(() => {
    if (!quiz || showResults || terminated) return;
    if (secondsLeft === 0) {
      setTimerExpired(true);
      handleSubmit();
      return;
    }
    const timer = setTimeout(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, quiz, showResults, terminated]);

  if (loading) {
    return <div className="quiz-attempt-container">Loading quiz...</div>;
  }

  // Fullscreen prompt modal
  if (fullscreenPrompt) {
    return (
      <div className="quiz-attempt-container" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'80vh'}}>
        <div style={{background:'#fff',padding:32,borderRadius:16,boxShadow:'0 2px 16px #aaa',textAlign:'center'}}>
          <h2>Enter Full Screen Mode</h2>
          <p style={{margin:'16px 0'}}>To attempt this quiz, you must enter full screen mode.<br/>This helps prevent cheating and ensures a fair experience.</p>
          <button className="quiz-btn" onClick={()=>setFullscreenPrompt(false)} style={{marginTop:16}}>Enter Full Screen</button>
        </div>
      </div>
    );
  }

  if (terminated) {
    return (
      <div className="quiz-attempt-container" style={{color:'#fff',background:'#111',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:40}}>
        <h2 style={{color:'#ff3b3b'}}>Quiz Terminated</h2>
        <p style={{fontSize:'1.2rem',margin:'24px 0'}}>{terminationReason || "You have violated quiz rules."}</p>
        <button className="quiz-btn" onClick={()=>{exitFullscreen();navigate("/")}} style={{marginTop:20}}>Back to Home Page</button>
      </div>
    );
  }

  // Ensure terminated section is rendered exclusively


  if (error) {
    return <div className="quiz-attempt-container error">{error}</div>;
  }

  if (!quiz) {
    return <div className="quiz-attempt-container">Quiz not found</div>;
  }

  if (showResults) {
    const graphData = [
      {
        name: "Your Score",
        score: score,
        fill: "#8884d8",
      },
      {
        name: "Maximum Score",
        score: 100,
        fill: "#82ca9d",
      },
    ];

    return (
      <div className="quiz-results-container">
        <h2>Quiz Results</h2>
        <div className="score-info">
          <p>Your Score: {score.toFixed(2)}%</p>
          <p>Total Questions: {quiz.questions.length}</p>
          <p>Correct Answers: {Math.round((score * quiz.questions.length) / 100)}</p>
        </div>
        
        <div className="score-graph">
          <BarChart width={600} height={300} data={graphData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="score" name="Score %" />
          </BarChart>
        </div>

        <div className="answer-review">
          <h3>Review Your Answers</h3>
          {quiz.questions.map((question, index) => (
            <div key={index} className={`answer-item ${answers[index] === question.correctAnswer ? "correct" : "incorrect"}`}>
              <p><strong>Question {index + 1}:</strong> {question.question}</p>
              <p>Your Answer: {answers[index] || "Not answered"}</p>
              <p>Correct Answer: {question.correctAnswer}</p>
            </div>
          ))}
        </div>

        <button className="quiz-btn" onClick={() => navigate("/quiz")}>
          Back to Quiz List
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-attempt-container">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <h2>{quiz.title}</h2>
        <div className="quiz-timer" style={{fontWeight:'bold',fontSize:'1.2rem',color:secondsLeft !== null && secondsLeft <= 30 ? 'red' : '#333', background:'#fffbe6', border:'2px solid #f0ad4e', padding:'6px 16px', borderRadius:'8px', marginLeft:'2rem'}}>
          Time Left: {secondsLeft !== null ? `${Math.floor(secondsLeft/60)}:${(secondsLeft%60).toString().padStart(2,'0')}` : 'N/A'}
        </div>
      </div>
      <div className="progress-bar">
        <div 
          className="progress" 
          style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
        ></div>
      </div>
      <p className="question-counter">
        Question {currentQuestion + 1} of {quiz.questions.length}
      </p>

      <div className="question-card">
        <h3>{quiz.questions[currentQuestion].questionText}</h3>
        <div className="options">
          {quiz.questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              className={`option-btn ${answers[currentQuestion] === option ? "selected" : ""}`}
              onClick={() => handleAnswerSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="navigation-buttons">
        <button 
          className="quiz-btn" 
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          Previous
        </button>
        {currentQuestion === quiz.questions.length - 1 ? (
          <button 
            className="quiz-btn submit" 
            onClick={handleSubmit}
            disabled={answers.includes(null)}
          >
            Submit Quiz
          </button>
        ) : (
          <button 
            className="quiz-btn" 
            onClick={handleNext}
            disabled={answers[currentQuestion] === null}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default AttemptQuiz;
