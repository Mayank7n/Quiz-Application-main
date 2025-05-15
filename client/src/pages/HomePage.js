import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { 
  Container, 
  Row, 
  Col, 
  Button, 
  Spinner, 
  Alert,
  Navbar,
  Nav,
  Badge,
  Card
} from "react-bootstrap";
import { 
  BookOpen, 
  Clock, 
  Users, 
  Shield, 
  PlusCircle, 
  BarChart2,
  Award,
  CheckCircle,
  ArrowRight,
  PlayCircle,
  Trash2
} from "react-feather";
import "../styles/home.css";

const API_URL = "https://quiz-application-main-alpha.vercel.app/api";

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attemptCounts, setAttemptCounts] = useState({});

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchQuizzes();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchQuizzes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/admin/quizzes`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch quizzes");
      const data = await res.json();
      setQuizzes(data);
      
      // Fetch attempt counts for each quiz
      const counts = {};
      await Promise.all(
        data.map(async (quiz) => {
          const resp = await fetch(`${API_URL}/admin/quiz/${quiz._id}/attempts`, {
            headers: { Authorization: `Bearer ${user.token}` },
          });
          const result = await resp.json();
          counts[quiz._id] = result.count || 0;
        })
      );
      setAttemptCounts(counts);
    } catch (err) {
      setError(err.message || "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
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
      const newCounts = { ...attemptCounts };
      delete newCounts[quizId];
      setAttemptCounts(newCounts);
    } catch (err) {
      alert(err.message || "Error deleting quiz");
    }
  };

  const handleCreateQuiz = () => {
    navigate("/create-quiz");
  };

  const featureCards = [
    {
      icon: <BookOpen size={40} className="text-primary mb-3" />,
      title: "Wide Variety of Quizzes",
      description: "Choose from multiple categories and challenge yourself."
    },
    {
      icon: <Clock size={40} className="text-warning mb-3" />,
      title: "Time-Based Challenges",
      description: "Test your speed and accuracy with timed quizzes."
    },
    {
      icon: <Users size={40} className="text-success mb-3" />,
      title: "Compete with Friends",
      description: "Compare scores and climb the leaderboard."
    },
    {
      icon: <Shield size={40} className="text-info mb-3" />,
      title: "Secure & Fair",
      description: "Ensuring a cheat-free and fair quiz experience."
    }
  ];

  return (
    <div className="home-page">
      <div className="page-content">

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <Container className="hero-content">
          <Row className="align-items-center min-vh-75 py-5">
            <Col lg={6} className="text-center text-lg-start mb-5 mb-lg-0">
              <Badge bg="primary" className="mb-3 px-3 py-2 rounded-pill">
                <Award size={18} className="me-2" /> #1 Quiz Platform
              </Badge>
              <h1 className="display-3 fw-bold mb-4">Test Your Knowledge with Our Interactive Quizzes</h1>
              <p className="lead mb-4">Challenge yourself, learn new things, and track your progress with our engaging quiz platform.</p>
              <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
                <Button size="lg" className="px-4" href={user ? "/quizzes" : "/signup"}>
                  <PlayCircle size={20} className="me-2" />
                  Start Quizzing
                </Button>
                <Button variant="outline-light" size="lg" className="px-4" href="#features">
                  Learn More
                </Button>
              </div>
            </Col>
            <Col lg={6} className="text-center">
              <div className="hero-illustration">
                <BookOpen size={120} className="text-primary mb-3" />
                <div className="floating-icon" style={{
                  position: 'absolute',
                  top: '20px',
                  right: '40px',
                  animation: 'float 3s ease-in-out infinite'
                }}>
                  <CheckCircle size={32} className="text-success" />
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="py-5 bg-light">
        <Container className="py-5">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Why Choose QuizMaster?</h2>
            <p className="lead text-muted">Discover the features that make our platform the best choice for your learning journey</p>
          </div>
          <Row className="g-4">
            <Col md={4} className="feature-item">
              <div className="p-4 h-100">
                <div className="feature-icon mb-4">
                  <BookOpen size={40} className="text-primary" />
                </div>
                <h3 className="h4 mb-3">Diverse Topics</h3>
                <p className="text-muted mb-0">
                  Explore a wide range of subjects from science to pop culture. Our quizzes are designed to challenge and educate.
                </p>
              </div>
            </Col>
            <Col md={4} className="feature-item">
              <div className="p-4 h-100">
                <div className="feature-icon mb-4">
                  <BarChart2 size={40} className="text-primary" />
                </div>
                <h3 className="h4 mb-3">Track Progress</h3>
                <p className="text-muted mb-0">
                  Monitor your improvement with detailed analytics and performance reports. See how you stack up against others.
                </p>
              </div>
            </Col>
            <Col md={4} className="feature-item">
              <div className="p-4 h-100">
                <div className="feature-icon mb-4">
                  <Users size={40} className="text-primary" />
                </div>
                <h3 className="h4 mb-3">Compete</h3>
                <p className="text-muted mb-0">
                  Challenge your friends and compete on leaderboards. See who comes out on top in our weekly challenges.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      </div>
      <footer className="py-3 text-center bg-light mt-5">
        <Container>
          <p className="mb-0">
            &copy; {new Date().getFullYear()} Mayank Sharma. All rights reserved.
          </p>
        </Container>
      </footer>
    </div>
  );
};

export default Home;

