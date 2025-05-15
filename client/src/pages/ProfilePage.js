import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Table, Badge, ProgressBar, Spinner, Alert, Button } from 'react-bootstrap';
import { User, Award, Clock, BarChart2, CheckCircle, XCircle, Edit, LogOut, BookOpen, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

// Support both local and production environments
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://localhost:5000/api" 
  : "https://quiz-application-main-alpha.vercel.app/api";

const popVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    },
  }),
  hover: {
    y: -5,
    transition: { duration: 0.2 }
  }
};

const ProfilePage = () => {
  const { user: currentUser, logout } = useAuth();

  const [userData, setUserData] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!currentUser || !currentUser.token) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch user data
        const userData = {
          name: currentUser?.name || 'User',
          email: currentUser?.email || 'user@example.com',
          role: currentUser?.role || 'user',
          joinedDate: currentUser?.createdAt || new Date().toISOString(),
        };
        
        // Fetch quiz attempts from the API
        const attemptsResponse = await fetch(`${API_URL}/quiz/attempted`, {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        });
        
        if (!attemptsResponse.ok) {
          throw new Error('Failed to fetch quiz attempts');
        }
        
        const attemptsData = await attemptsResponse.json();
        console.log('Quiz attempts data:', attemptsData);
        
        // Process each attempt with the quiz details
        const formattedAttempts = attemptsData
          .filter(attempt => attempt.quiz) // Filter out attempts without quiz data
          .map(attempt => {
            const quiz = attempt.quiz;
            console.log(`Processing attempt for quiz: ${quiz?._id}`, { attempt, quiz });
            
            return {
              id: attempt._id || Math.random().toString(36).substr(2, 9),
              quizId: quiz?._id || 'unknown',
              quizTitle: quiz?.title || 'Untitled Quiz',
              quizCategory: quiz?.category || 'General',
              score: attempt.score || 0,
              totalQuestions: quiz?.questions?.length || 0,
              correctAnswers: Math.round(((attempt.score || 0) / 100) * (quiz?.questions?.length || 0)),
              completedAt: attempt.completedAt || new Date().toISOString(),
              timeTaken: attempt.timeSpent || 0,
            };
          });
        
        setUserData(userData);
        setAttempts(formattedAttempts);
      } catch (err) {
        setError('Failed to load profile data. Please try again later.');
        console.error('Error fetching profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [currentUser]);

  const calculateStats = () => {
    if (attempts.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        accuracy: 0,
      };
    }


    const totalQuizzes = attempts.length;
    const totalScores = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const averageScore = Math.round((totalScores / totalQuizzes) * 10) / 10;
    const bestScore = Math.max(...attempts.map(attempt => attempt.score));
    const totalCorrect = attempts.reduce((sum, attempt) => sum + attempt.correctAnswers, 0);
    const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.totalQuestions, 0);
    const accuracy = Math.round((totalCorrect / totalQuestions) * 100);

    return {
      totalQuizzes,
      averageScore,
      bestScore,
      totalCorrect,
      totalQuestions,
      accuracy,
    };
  };

  const stats = calculateStats();

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getScoreVariant = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'primary';
    return 'danger';
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading profile...</p>
        </div>
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

  return (
    <div className="min-vh-100">
      <Container className="py-5">
        {/* Profile Header Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-body-secondary rounded-3 p-4 mb-5 shadow-sm"
        >
          <Row className="align-items-center">
            <Col md="auto" className="mb-4 mb-md-0">
              <motion.div 
                className="d-flex align-items-center justify-content-center border border-2 border-dark rounded-circle" 
                style={{ width: '100px', height: '100px' }}
                whileHover={{ scale: 1.05 }}
              >
                <User size={40} className="text-dark" />
              </motion.div>
            </Col>
            <Col>
              <div className="d-flex flex-column h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h1 className="h3 fw-bold mb-0">{userData?.name || 'User'}</h1>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    className="rounded-pill px-3"
                  >
                    <Edit size={16} className="me-1" /> Edit
                  </Button>
                </div>
                <p className="text-muted mb-3">
                  <i className="bi bi-envelope me-2"></i>
                  {userData?.email || 'user@example.com'}
                </p>
                <div className="mt-auto d-flex flex-wrap gap-2">
                  <span className="badge bg-primary px-3 py-2">
                    <i className="bi bi-award me-1"></i>
                    {userData?.role ? userData.role.toUpperCase() : 'MEMBER'}
                  </span>
                  <span className="badge bg-light text-dark px-3 py-2">
                    <i className="bi bi-calendar3 me-1"></i>
                    Member since {userData?.joinedDate ? format(new Date(userData.joinedDate), 'MMMM yyyy') : 'recently'}
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </motion.section>

        {/* Stats Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-body-secondary rounded-3 p-4 mb-5 shadow-sm"
        >
          <h2 className="h5 fw-bold mb-4 d-flex align-items-center">
            <BarChart2 size={20} className="me-2 text-primary" />
            Your Statistics
          </h2>
          <Row className="g-4">
            <Col md={6} lg={3}>
              <div className="p-3 border rounded-3">
                <div className="d-flex align-items-center mb-2">
                  <div className="border border-2 border-dark rounded p-2 me-3">
                    <BookOpen size={20} className="text-dark" />
                  </div>
                  <div>
                    <div className="h4 fw-bold mb-0">{stats.totalQuizzes}</div>
                    <div className="text-muted small">Quizzes Taken</div>
                  </div>
                </div>
              </div>
            </Col>
            <Col md={6} lg={3}>
              <div className="p-3 border rounded-3">
                <div className="d-flex align-items-center mb-2">
                  <div className="border border-2 border-dark rounded p-2 me-3">
                    <BarChart2 size={20} className="text-dark" />
                  </div>
                  <div>
                    <div className="h4 fw-bold mb-0">{stats.averageScore}%</div>
                    <div className="text-muted small">Average Score</div>
                  </div>
                </div>
              </div>
            </Col>
            <Col md={6} lg={3}>
              <div className="p-3 border rounded-3">
                <div className="d-flex align-items-center mb-2">
                  <div className="border border-2 border-dark rounded p-2 me-3">
                    <CheckCircle size={20} className="text-dark" />
                  </div>
                  <div>
                    <div className="h4 fw-bold mb-0">{stats.accuracy}%</div>
                    <div className="text-muted small">Accuracy</div>
                  </div>
                </div>
              </div>
            </Col>
            <Col md={6} lg={3}>
              <div className="p-3 border rounded-3">
                <div className="d-flex align-items-center mb-2">
                  <div className="border border-2 border-dark rounded p-2 me-3">
                    <Award size={20} className="text-dark" />
                  </div>
                  <div>
                    <div className="h4 fw-bold mb-0">{stats.bestScore}%</div>
                    <div className="text-muted small">Best Score</div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </motion.section>

        {/* Quiz History Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-body-secondary rounded-3 p-4 shadow-sm"
        >
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="h5 fw-bold mb-0 d-flex align-items-center">
              <Activity size={20} className="me-2 text-primary" />
              Quiz History
            </h2>
            <Button variant="outline-primary" size="sm" className="rounded-pill">
              View All
            </Button>
          </div>
        <div className="table-responsive">
          {attempts.length > 0 ? (
            <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Quiz</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Correct</th>
                  <th>Time</th>
                  <th className="pe-4">Status</th>
                </tr>
              </thead>
                <tbody>
                  {attempts.map((attempt) => (
                    <tr key={attempt.id} className="align-middle">
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          <div className="border border-2 border-dark rounded p-2 me-3">
                            <BookOpen size={18} className="text-dark" />
                          </div>
                          <div>
                            <h6 className="mb-0 fw-semibold">{attempt.quizTitle || 'Unknown Quiz'}</h6>
                            <small className="text-muted">ID: {attempt.quizId || attempt.id || 'Unknown'}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge bg="light" text="dark" className="text-uppercase px-2 py-1">
                          {attempt.quizCategory || 'General'}
                        </Badge>
                      </td>
                      <td>
                        <div className="fw-medium">
                          {attempt.completedAt ? format(new Date(attempt.completedAt), 'MMM d, yyyy') : 'Unknown date'}
                        </div>
                        <div className="text-muted small">
                          {attempt.completedAt ? format(new Date(attempt.completedAt), 'h:mm a') : ''}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <strong className={`me-2 text-${getScoreVariant(attempt.score)}`}>{attempt.score}%</strong>
                          <div style={{ width: '80px' }}>
                            <ProgressBar
                              now={attempt.score}
                              variant={getScoreVariant(attempt.score)}
                              style={{ height: '6px' }}
                              className="rounded-pill"
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="fw-medium">{Math.round(attempt.correctAnswers)}</span>
                        <span className="text-muted"> / {attempt.totalQuestions}</span>
                      </td>
                      <td className="text-nowrap">
                        <Clock size={16} className="me-1 text-muted" />
                        {attempt.timeTaken ? formatTime(attempt.timeTaken) : '00:00'}
                      </td>
                      <td className="pe-4">
                        <Badge 
                          bg={attempt.score >= 70 ? 'success' : 'warning'} 
                          className="px-2 py-1"
                        >
                          {attempt.score >= 70 ? 'Passed' : 'Failed'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </Table>
          ) : (
            <div className="text-center p-5">
              <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                <BookOpen size={32} className="text-muted" />
              </div>
              <h5>No quiz attempts yet</h5>
              <p className="text-muted mb-4">Take a quiz to see your history here</p>
              <Button as={Link} to="/quiz" variant="primary" className="rounded-pill px-4">
                Browse Quizzes
              </Button>
            </div>
          )}
        </div>
        </motion.section>
      </Container>
    </div>
  );
};

export default ProfilePage;
