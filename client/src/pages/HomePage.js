import API_URL from '../config';
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, Users, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

const popVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 30 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.3,
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  }),
};



const Home = () => {
  const { user } = useAuth();
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
    // eslint-disable-next-line
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
      // Remove attempt count for deleted quiz
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

  return (
    <div className="home-container">
      <motion.h1
        className="hero-title"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Welcome to <span>Quiz Portal</span>
        </motion.h1>

      {/* Static Info Cards Section */}
      <div className="cards-container">
        <motion.div className="card" whileHover={{ scale: 1.05 }}>
          <BookOpen size={40} />
          <h3>Wide Variety of Quizzes</h3>
          <p>Choose from multiple categories and challenge yourself.</p>
        </motion.div>

        <motion.div className="card" whileHover={{ scale: 1.05 }}>
          <Clock size={40} />
          <h3>Time-Based Challenges</h3>
          <p>Test your speed and accuracy with timed quizzes.</p>
        </motion.div>

        <motion.div className="card" whileHover={{ scale: 1.05 }}>
          <Users size={40} />
          <h3>Compete with Friends</h3>
          <p>Compare scores and climb the leaderboard.</p>
        </motion.div>

        <motion.div className="card" whileHover={{ scale: 1.05 }}>
          <Shield size={40} />
          <h3>Secure & Fair</h3>
          <p>Ensuring a cheat-free and fair quiz experience.</p>
        </motion.div>
      </div>
      {user && (
        <motion.h2
          className="user-name floating"
          variants={popVariants}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          {user.name && user.name.trim() !== "" ? user.name : (user.email ? user.email : "User")}
        </motion.h2>
      )}
      {/* Admin Panel Section */}
      {user && user.role === "admin" && (
        <div className="admin-panel-container" style={{marginTop: 40}}>
          <h1 className="admin-title">Admin Panel</h1>
          <button className="auth-btn" style={{marginBottom: 24, background: '#c0392b', color: '#fff', fontWeight: 600, fontSize: '1rem'}} onClick={handleCreateQuiz}>
            + Create Quiz
          </button>
          {loading ? (
            <div className="admin-container"><h2>Loading...</h2></div>
          ) : (
            <>
              {error && <div className="error-message">{error}</div>}
              <div className="cards-container">
                {quizzes.length === 0 ? (
                  <div>No quizzes created yet.</div>
                ) : (
                  quizzes.map((quiz) => (
                    <div className="card" key={quiz._id}>
                      <h2>{quiz.title}</h2>
                      <button
                        className="btn delete-btn"
                        onClick={() => handleDeleteQuiz(quiz._id)}
                        style={{ margin: "10px 0", background: "#e74c3c", color: "#fff" }}
                      >
                        Delete Quiz
                      </button>
                      <div className="attempt-count" style={{ marginTop: "10px", fontWeight: "bold" }}>
                        Users Attempted: {attemptCounts[quiz._id] ?? 0}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;

