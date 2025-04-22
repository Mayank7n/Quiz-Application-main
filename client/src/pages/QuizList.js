import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import "../styles/quizList.css";



const QuizList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [attemptedQuizzes, setAttemptedQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // DEBUG: show user and loading info in the UI
  console.log('QuizList user:', user, 'loading:', loading);

  // No localStorage filtering needed; backend filters terminated quizzes per user
  const filteredAvailableQuizzes = availableQuizzes;

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminQuizzes();
    } else {
      fetchAllQuizzes();
    }
    // Listen for storage changes to update quiz list immediately after termination
    const handleStorage = () => {
      if (user && user.role !== 'admin') fetchAllQuizzes();
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('quizTerminated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('quizTerminated', handleStorage);
    };
    // eslint-disable-next-line
  }, [user]);

  const fetchAdminQuizzes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/quizzes`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch admin quizzes');
      const data = await res.json();
      console.log("Admin quizzes fetched:", data);
      // Deep sanitize: only keep real objects with a title
      setAvailableQuizzes(Array.isArray(data) ? data.filter(q => q && typeof q === 'object' && typeof q.title === 'string') : []);
    } catch (err) {
      setError(err.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllQuizzes = async () => {
    try {
      // Fetch available quizzes
      const availableResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/quiz/all`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      // Fetch attempted quizzes
      const attemptedResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/quiz/attempted`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });


      if (!availableResponse.ok || !attemptedResponse.ok) {
        const availableError = await availableResponse.text();
        const attemptedError = await attemptedResponse.text();
        throw new Error(`Failed to fetch quizzes: ${availableError} - ${attemptedError}`);
      }

      const availableData = await availableResponse.json();
      const attemptedData = await attemptedResponse.json();

      setAvailableQuizzes(availableData);
      setAttemptedQuizzes(attemptedData);
    } catch (err) {
      console.error("Error fetching quizzes:", err);
      setError(err.message || "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleAttemptQuiz = (quizId) => {
    if (user && user.role === 'admin') return;
    navigate(`/attempt-quiz/${quizId}`);
  };

  if (loading) {
    return <div className="quiz-list-container">
      <div style={{color:'orange',fontWeight:700}}>DEBUG: loading={String(loading)}, user={JSON.stringify(user)}</div>
      Loading quizzes...
    </div>;
  }

  if (user && user.role === 'admin') {
    return (
      <div className="quiz-list-container">
        <h2 style={{ color: '#c0392b', marginBottom: 24 }}>My Quizzes</h2>
        <div style={{ color: 'blue', fontWeight: 900, fontSize: 20, margin: '16px 0' }}>My Quizzes ({availableQuizzes.length})</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          {(Array.isArray(availableQuizzes) ? availableQuizzes : []).filter(q => q && typeof q === 'object' && typeof q.title === 'string').length === 0 ? (
            <div>No quizzes created yet.</div>
          ) : (
            (Array.isArray(availableQuizzes) ? availableQuizzes : [])
              .filter(q => q && typeof q === 'object' && typeof q.title === 'string')
              .map((quiz, idx) => (
                <div
                  key={quiz._id || idx}
                  className="card"
                >
                  <h3 style={{ marginBottom: 8, color: '#c0392b' }}>{quiz.title}</h3>
                  <div style={{ fontSize: 15, marginBottom: 12 }}>Questions: {Array.isArray(quiz.questions) ? quiz.questions.length : 0}</div>
                  {user?.role === 'admin' && (
                    <button
                      style={{ background: '#c0392b', color: '#fff', border: 'none', borderRadius: 5, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-end' }}
                      onClick={async () => {
                        if (!window.confirm('Are you sure you want to delete this quiz?')) return;
                        try {
                          const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/quiz/${quiz._id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${user.token}` },
                          });
                          if (!res.ok) throw new Error('Failed to delete quiz');
                          setAvailableQuizzes(prev =>
                            (Array.isArray(prev) ? prev.filter(q => q && typeof q === 'object' && typeof q.title === 'string' && q._id !== quiz._id) : [])
                          );
                        } catch (err) {
                          alert(err.message || 'Error deleting quiz');
                        }
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
          )}
        </div>
      </div>
    );
  }

  // NON-ADMIN USER: robust filtering to prevent null/TypeError
  return (
    <div className="quiz-list-container">
      <h2 style={{ color: '#c0392b', marginBottom: 24 }}>Available Quizzes</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        {filteredAvailableQuizzes.length === 0 ? (
          <div>No quizzes available.</div>
        ) : (
          filteredAvailableQuizzes.map((quiz, idx) => (
            <div
              key={quiz._id || idx}
              className="card"
              onClick={() => handleAttemptQuiz(quiz._id)}
            >
              <h3 style={{ marginBottom: 8, color: '#2980b9' }}>{quiz.title}</h3>
              <div style={{ fontSize: 15, marginBottom: 12 }}>Questions: {Array.isArray(quiz.questions) ? quiz.questions.length : 0}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (error) {
    return <div className="quiz-list-container error">{error}</div>;
  }

  return (
    <div className="quiz-list-container">
      <section className="available-quizzes">
        <h2>Available Quizzes</h2>
        {filteredAvailableQuizzes.length === 0 ? (
          <div className="no-quiz-container">
            <div className="maze-animation"></div>
            <p className="no-quiz-message">No new quizzes available!</p>
            <p className="sub-message">Check back later for new challenges</p>
          </div>
        ) : (
          <div className="quiz-grid">
            {filteredAvailableQuizzes.map((quiz) => (
              <div key={quiz._id} className="quiz-card">
                <h3>{quiz.title}</h3>
                <p>{quiz.questions.length} Questions</p>
                <button
                  className="attempt-btn"
                  onClick={() => handleAttemptQuiz(quiz._id)}
                >
                  Attempt Quiz
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="attempted-quizzes">
        <h2>Completed Quizzes</h2>
        {attemptedQuizzes.length === 0 ? (
          <div className="no-quiz-container">
            <div className="maze-animation"></div>
            <p className="no-quiz-message">No completed quizzes yet!</p>
            <p className="sub-message">Start attempting quizzes to see your progress here</p>
          </div>
        ) : (
          <div className="quiz-grid">
            {attemptedQuizzes.map((result) => (
              <div key={result.quiz._id} className="quiz-card completed">
                <h3>{result.quiz.title}</h3>
                <div className="score-info">
                  <p className="score">Score: {result.score.toFixed(2)}%</p>
                  <p className="completed-date">
                    Completed: {new Date(result.completedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mini-chart">
                  <BarChart width={150} height={100} data={[{
                    name: 'Score',
                    value: result.score,
                    fill: result.score >= 70 ? '#4CAF50' : result.score >= 40 ? '#FFC107' : '#f44336'
                  }]}>
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Bar dataKey="value" />
                  </BarChart>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default QuizList;
