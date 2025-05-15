import React, { useState, useEffect } from "react";
import { useAuth, useNavigate } from "../context/AuthContext";
import { Container, Row, Col, Button, Alert, Card, CardGroup, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { BookOpen, Clock, Award, Trash2, RefreshCw, AlertTriangle, CheckCircle, XCircle, User } from "lucide-react";
import "../styles/AdminPanel.css";
import "../styles/animatedBackground.css";

const API_URL = process.env.NODE_ENV === 'production' 
  ? "https://your-production-api-url.com/api" 
  : "http://localhost:5000/api";

const AdminPanel = () => {
  const { user, navigate } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [attemptCounts, setAttemptCounts] = useState({});
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showAttemptsModal, setShowAttemptsModal] = useState(false);
  const [userAttempts, setUserAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      return <div>You must be an admin to access this page</div>;
    }
    fetchQuizzes();
    // eslint-disable-next-line
  }, [activeTab, user]);

  const fetchQuizzes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/admin/quizzes`, {
        headers: { 
          'Accept': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch quizzes: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      setQuizzes(data);
      
      // Fetch attempt counts for each quiz
      const counts = {};
      await Promise.all(
        data.map(async (quiz) => {
          try {
            const resp = await fetch(`${API_URL}/admin/quiz/${quiz._id}/attempts`, {
              headers: { 
                'Accept': 'application/json',
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            });
            if (resp.ok) {
              const result = await resp.json();
              counts[quiz._id] = result.count || 0;
            } else {
              console.error(`Failed to fetch attempts for quiz ${quiz._id}:`, resp.status);
              counts[quiz._id] = 0;
            }
          } catch (err) {
            console.error(`Error fetching attempts for quiz ${quiz._id}:`, err);
            counts[quiz._id] = 0;
          }
        })
      );
      setAttemptCounts(counts);
    } catch (err) {
      console.error('Error in fetchQuizzes:', err);
      setError(err.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAttempts = async (quizId) => {
    setLoadingAttempts(true);
    setError("");
    try {
      console.log('Fetching attempts for quiz:', quizId);
      
      // Fetch quiz attempts
      const attemptsRes = await fetch(`${API_URL}/admin/quiz/${quizId}/user-attempts`, {
        headers: { 
          'Accept': 'application/json',
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!attemptsRes.ok) {
        const errorText = await attemptsRes.text();
        console.error('Attempts API error:', errorText);
        throw new Error(`Failed to fetch attempts: ${attemptsRes.status}`);
      }
      
      let attemptsData = await attemptsRes.json();
      console.log('Attempts API response:', attemptsData);
      
      // Handle different response formats
      if (attemptsData && !Array.isArray(attemptsData)) {
        if (Array.isArray(attemptsData.attempts)) {
          attemptsData = attemptsData.attempts;
        } else if (Array.isArray(attemptsData.data)) {
          attemptsData = attemptsData.data;
        } else if (Array.isArray(attemptsData.results)) {
          attemptsData = attemptsData.results;
        }
      }
      
      // Format the data for display
      let formattedAttempts = [];
      
      if (Array.isArray(attemptsData) && attemptsData.length > 0) {
        formattedAttempts = attemptsData.map(attempt => {
          console.log('Processing attempt:', attempt);
          
          // If attempt is just a user object, format it
          if (attempt.name || attempt.username || attempt.email) {
            return {
              _id: attempt._id || Math.random().toString(),
              user: {
                name: attempt.name || attempt.username || 'Anonymous',
                email: attempt.email || ''
              },
              score: attempt.score || 0,
              completedAt: attempt.completedAt || attempt.createdAt || new Date().toISOString()
            };
          }
          
          // Otherwise, handle as a standard attempt object
          const userInfo = attempt.user || {};
          const userName = userInfo.name || 
                          attempt.userName || 
                          userInfo.username ||
                          (userInfo.firstName || userInfo.lastName ? 
                            `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() : 
                            'Anonymous');
          
          return {
            _id: attempt._id || Math.random().toString(),
            user: {
              name: userName,
              email: userInfo.email || '',
              ...userInfo
            },
            score: attempt.score !== undefined ? attempt.score : 0,
            completedAt: attempt.completedAt || attempt.createdAt || new Date().toISOString()
          };
        });
      }
      
      console.log('Formatted attempts:', formattedAttempts);
      
      if (formattedAttempts.length === 0) {
        console.log('No attempts data available');
        setError('No attempt data found for this quiz');
      } else {
        setUserAttempts(formattedAttempts);
        setSelectedQuiz(quizzes.find(q => q._id === quizId));
        setShowAttemptsModal(true);
      }
    } catch (err) {
      console.error('Error in fetchUserAttempts:', err);
      setError(err.message || 'Failed to load user attempts');
    } finally {
      setLoadingAttempts(false);
    }
  };

  const closeModal = () => {
    setShowAttemptsModal(false);
    setSelectedQuiz(null);
    setUserAttempts([]);
    setActiveTab('all');
  };

  const handleCreateQuiz = () => {
    navigate('/create-quiz');
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/quiz/${quizId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) throw new Error("Failed to delete quiz");
      setQuizzes(quizzes.filter((q) => q._id !== quizId));
      // Remove attempt count for deleted quiz
      const newCounts = { ...attemptCounts };
      delete newCounts[quizId];
      setAttemptCounts(newCounts);
    } catch (err) {
      alert(err.message || "Error deleting quiz");
    }
  };

  // Filter attempts based on active tab
  const filteredAttempts = userAttempts;

  return (
    <div className="admin-panel">
      <div className="animated-background">
        <div className="bg-shape" style={{ animationDelay: '0s' }}></div>
        <div className="bg-shape" style={{ animationDelay: '2s' }}></div>
        <div className="bg-shape" style={{ animationDelay: '4s' }}></div>
      </div>
      <Container fluid className="p-4">
        <Row className="mb-4">
          <Col>
            <h1 className="mb-3 text-shadow">Admin Panel</h1>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <Button variant="primary" as={Link} to="/create-quiz" className="me-2">
                  <BookOpen className="me-2" /> Create New Quiz
                </Button>
              </div>
              <div className="tabs d-flex gap-2">
                <button 
                  className={`tab active`}
                >
                  All Quizzes
                </button>
              </div>
            </div>
          </Col>
        </Row>

        {loading ? (
          <Row className="text-center py-5">
            <Col>
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2 text-shadow">Loading quizzes...</p>
            </Col>
          </Row>
        ) : (
          <Row>
            {quizzes.length === 0 ? (
              <Col className="text-center py-5">
                <BookOpen size={48} className="text-muted mb-3" />
                <h4 className="text-shadow">No quizzes found</h4>
                <p className="text-muted text-shadow">Create your first quiz!</p>
              </Col>
            ) : (
              <CardGroup className="mb-4">
                {quizzes.map((quiz) => (
                  <Col key={quiz._id} md={6} lg={4} className="mb-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <h5 className="card-title mb-0 text-shadow">{quiz.title}</h5>
                          <div className="d-flex gap-2">
                            <button 
                              className="btn-delete"
                              onClick={() => handleDeleteQuiz(quiz._id)}
                            >
                              <XCircle /> Delete
                            </button>
                            <Button 
                              variant="outline-success"
                              size="sm"
                              onClick={() => fetchUserAttempts(quiz._id)}
                              title="Show Details"
                            >
                              <CheckCircle className="me-2 text-success" /> Details
                            </Button>
                          </div>
                        </div>
                        <div className="mb-3">
                          <Clock className="me-2" />
                          <span className="text-muted">{quiz.questions.length} questions</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex gap-2">
                            <span className="badge bg-primary text-shadow">{attemptCounts[quiz._id] || 0} attempts</span>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </CardGroup>
            )}
          </Row>
        )}
      </Container>

      {/* User Attempts Modal */}
      {showAttemptsModal && selectedQuiz && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Attempts: {selectedQuiz.title}</h2>
              <button onClick={closeModal} className="close-btn">
                <XCircle />
              </button>
            </div>
            
            <div className="attempts-list">
              {loadingAttempts ? (
                <div className="loading">Loading attempts...</div>
              ) : !Array.isArray(filteredAttempts) || filteredAttempts.length === 0 ? (
                <div className="no-attempts">
                  No attempts found
                </div>
              ) : (
                filteredAttempts.map((attempt) => {
                  if (!attempt || typeof attempt !== 'object') {
                    console.warn('Invalid attempt data:', attempt);
                    return null;
                  }
                  
                  return (
                    <div key={attempt._id || Math.random()} className="attempt-item">
                      <div className="attempt-user">
                        <User className="user-icon" />
                        <div className="user-info">
                          {attempt.user.name}
                        </div>
                      </div>
                      <div className="attempt-details">
                        <span className="status completed">
                          <CheckCircle className="me-2 text-success" /> Completed
                        </span>
                        <span className="score">Score: {attempt.score || 0}</span>
                        {attempt.completedAt && (
                          <span className="date">
                            {new Date(attempt.completedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
