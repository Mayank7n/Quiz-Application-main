import API_URL from '../config';
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";



const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const handleCreateQuiz = () => {
    navigate("/create-quiz");
  };
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attemptCounts, setAttemptCounts] = useState({});

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchQuizzes();
    // eslint-disable-next-line
  }, [user]);

  const fetchQuizzes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/quizzes`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch quizzes: ${text}`);
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Expected JSON, got: ${text}`);
      }
      const data = await res.json();
      setQuizzes(data);
      // Fetch attempt counts for each quiz
      const counts = {};
      await Promise.all(
        data.map(async (quiz) => {
          const resp = await fetch(`${API_URL}/api/admin/quiz/${quiz._id}/attempts`, {
            headers: { Authorization: `Bearer ${user.token}` },
          });
          if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`Failed to fetch attempts for quiz ${quiz._id}: ${text}`);
          }
          const attemptContentType = resp.headers.get("content-type");
          if (!attemptContentType || !attemptContentType.includes("application/json")) {
            const text = await resp.text();
            throw new Error(`Expected JSON for attempts of quiz ${quiz._id}, got: ${text}`);
          }
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
      const res = await fetch(`${API_URL}/api/admin/quiz/${quizId}`, {
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

  if (loading) return <div className="admin-container"><h2>Loading...</h2></div>;

  return (
    <div className="admin-panel-container">
      <h1 className="admin-title">Admin Panel</h1>
      <button className="auth-btn" style={{marginBottom: 24, background: '#c0392b', color: '#fff', fontWeight: 600, fontSize: '1rem'}} onClick={handleCreateQuiz}>
        + Create Quiz
      </button>
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
    </div>
  );
};

export default AdminPanel;
