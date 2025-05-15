import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Spinner, Alert, Button } from "react-bootstrap";
import { BookOpen, Clock, Award } from "lucide-react";
import "../styles/quizList.css";

// Support both local and production environments
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://localhost:5000/api" 
  : "https://quiz-application-main-alpha.vercel.app/api";

const QuizList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
      // Cleanup function is no longer needed as we're not using localStorage for quiz state anymore

    if (user && user.role === 'admin') {
      fetchAdminQuizzes();
    } else {
      fetchQuizzes();
    }
    
    // Event listener for quiz completion is now handled by the backend
    // No need for manual cleanup
  }, [user]);

  const fetchAdminQuizzes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/admin/quizzes`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch admin quizzes');
      const data = await res.json();
      setAvailableQuizzes(Array.isArray(data) ? data.filter(q => q?.title) : []);
    } catch (err) {
      setError(err.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError("");
      
      // First, fetch all available quizzes with attempt status
      const response = await fetch(`${API_URL}/quiz/all`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }
      
      const allQuizzes = await response.json();
      
      // For non-admin users, we'll show all quizzes but use the attempted status
      // to control the UI state (like disabling the attempt button)
      setAvailableQuizzes(allQuizzes);
      
      // We're now getting the attempted status directly in the quiz objects
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError(err.message || 'Failed to load quizzes');
      setLoading(false);
    }
  };

  const handleTerminateQuiz = async (quizId) => {
    if (!window.confirm("Are you sure you want to remove this quiz from your list?")) return;
    
    try {
      const response = await fetch(`${API_URL}/quiz/terminate/${quizId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to terminate quiz');
      }
      
      // Refresh the quiz list
      fetchQuizzes();
    } catch (err) {
      console.error('Error terminating quiz:', err);
      setError(err.message || 'Failed to remove quiz');
    }
  };

  const handleAttemptQuiz = (quizId) => {
    if (!user) {
      setError("Please log in to attempt a quiz");
      return;
    }
    
    if (user?.role === 'admin') {
      setError("Admin users cannot attempt quizzes");
      return;
    }
    
    const handleStartQuiz = (quizId) => {
      try {
        // Clear any error state
        setError("");
        
        // Navigate to the quiz attempt page
        navigate(`/quiz/attempt/${quizId}`);
      } catch (err) {
        console.error("Error navigating to quiz:", err);
        setError("Failed to start quiz. Please try again.");
      }
    };
    
    handleStartQuiz(quizId);
  };

  // Quiz completion is now handled by the backend

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading quizzes...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (user?.role === 'admin') {
    return (
      <Container className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">My Quizzes</h2>
          <span className="text-muted">{availableQuizzes.length} quizzes</span>
        </div>
        
        {availableQuizzes.length === 0 ? (
          <div className="text-center py-5">
            <BookOpen size={48} className="text-muted mb-3" />
            <h4>No quizzes created yet</h4>
            <p className="text-muted">Create your first quiz to get started</p>
          </div>
        ) : (
          <Row className="g-4">
            {availableQuizzes.map((quiz) => (
              <Col key={quiz._id} md={6} lg={4} className="quiz-section">
                <div className="p-4 border rounded-3 h-100 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h4 className="mb-0">{quiz.title}</h4>
                    <span className="badge bg-primary">
                      {quiz.questions?.length || 0} Questions
                    </span>
                  </div>
                  
                  <div className="mt-auto pt-3">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="w-100"
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this quiz?')) {
                          try {
                            const res = await fetch(`${API_URL}/admin/quiz/${quiz._id}`, {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${user.token}` },
                            });
                            if (!res.ok) throw new Error('Failed to delete quiz');
                            setAvailableQuizzes(prev => prev.filter(q => q._id !== quiz._id));
                          } catch (err) {
                            alert(err.message || 'Error deleting quiz');
                          }
                        }
                      }}
                    >
                      Delete Quiz
                    </Button>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Available Quizzes</h2>
        <span className="text-muted">{availableQuizzes.length} quizzes</span>
      </div>
      
      {availableQuizzes.length === 0 ? (
        <div className="text-center py-5">
          <BookOpen size={48} className="text-muted mb-3" />
          <h4>No quizzes available</h4>
          <p className="text-muted">Check back later for new challenges</p>
        </div>
      ) : (
        <Row className="g-4">
          {availableQuizzes.map((quiz) => (
            <Col key={quiz._id} md={6} lg={4} className="quiz-section">
              <div 
                className="p-4 border rounded-3 h-100 d-flex flex-column hover-shadow"
                style={{ cursor: 'pointer' }}
                onClick={() => handleAttemptQuiz(quiz._id)}
              >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h4 className="mb-0">{quiz.title}</h4>
                  <span className="badge bg-primary">
                    {quiz.questions?.length || 0} Questions
                  </span>
                </div>
                
                <div className="mt-3 d-flex gap-3 text-muted small">
                  <span className="d-flex align-items-center">
                    <Clock size={14} className="me-1" />
                    {quiz.timeLimit || 5} mins
                  </span>
                  <span className="d-flex align-items-center">
                    <Award size={14} className="me-1" />
                    {quiz.passingScore || 60}% to pass
                  </span>
                </div>
                
                {quiz.attempted && (
                  <div className="mt-3 pt-2 border-top">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted small">Attempted</span>
                      <span className="badge bg-success">Completed</span>
                    </div>
                  </div>
                )}
                
                <Button 
                  variant={quiz.attempted ? 'outline-primary' : 'primary'}
                  className="w-100 py-2 quiz-action-btn mt-4"
                  style={{
                    background: quiz.attempted ? 'transparent' : 'linear-gradient(45deg, #4e54c8, #8f94fb)',
                    border: quiz.attempted ? '2px solid #4e54c8' : 'none',
                    color: quiz.attempted ? '#4e54c8' : 'white',
                    fontWeight: '600',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAttemptQuiz(quiz._id);
                  }}
                >
                  {quiz.attempted ? '⟳ Retake Quiz' : '▶ Start Quiz'}
                </Button>
              </div>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default QuizList;
