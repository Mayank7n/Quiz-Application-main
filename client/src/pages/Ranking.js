import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/ranking.css";

const API_URL = "https://quiz-application-main-alpha.vercel.app/api";

const Ranking = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(null); // quizId
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");

  useEffect(() => {
    fetchAttemptedQuizzes();
    // eslint-disable-next-line
  }, []);

  // Fetch only quizzes that the user has attempted (finished)
  const fetchAttemptedQuizzes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/quiz/attempted`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch attempted quizzes");
      const data = await res.json();
      // Flatten attempted quizzes so each quiz has _id and title at top level
      setQuizzes(
        Array.isArray(data)
          ? data.map(q => ({ _id: q.quiz?._id, title: q.quiz?.title, ...q }))
          : []
      );
    } catch (err) {
      setError(err.message || "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const openLeaderboard = async (quizId, quizTitle) => {
    setShowLeaderboard({ quizId, quizTitle });
    setLeaderboardLoading(true);
    setLeaderboardError("");
    setLeaderboardData(null);
    try {
      const res = await fetch(`${API_URL}/quiz/${quizId}/leaderboard`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error("Failed to load leaderboard");
      const data = await res.json();
      setLeaderboardData(data);
    } catch (err) {
      setLeaderboardError(err.message || "Failed to load leaderboard");
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const closeLeaderboard = () => {
    setShowLeaderboard(null);
    setLeaderboardData(null);
    setLeaderboardError("");
  };

  return (
    <div className="ranking-container">
      <h1 className="ranking-title">Quiz Rankings</h1>
      {loading ? (
        <p>Loading quizzes...</p>
      ) : error ? (
        <p style={{ color: "#c0392b" }}>{error}</p>
      ) : quizzes.length === 0 ? (
        <p>No quizzes found.</p>
      ) : (
        !showLeaderboard && (
          <div className="quiz-grid">
            {[...new Map(
              quizzes
                .filter(q => q && q._id && q.title) // Only valid, attempted quizzes
                .map(q => [q._id, q])
            ).values()].map((quiz) => (
              <div className="quiz-card" key={quiz._id}>
                <h2>{quiz.title}</h2>
                <button className="auth-btn" onClick={() => openLeaderboard(quiz._id, quiz.title)}>
                  Leaderboard
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Leaderboard Modal - full page overlay */}
      {showLeaderboard && (
        <div className="leaderboard-modal leaderboard-fullpage">
          <button className="leaderboard-close" onClick={closeLeaderboard}>Hide Leaderboard</button>
          <h2 className="leaderboard-title">Leaderboard - {showLeaderboard.quizTitle}</h2>
          {leaderboardLoading ? (
            <p>Loading leaderboard...</p>
          ) : leaderboardError ? (
            <p style={{ color: "#c0392b" }}>{leaderboardError}</p>
          ) : leaderboardData ? (
            <>
              {/* User's rank at the top if present */}
              {leaderboardData.userRank ? (
                <div className="user-rank-highlight" style={{ marginBottom: 10 }}>
                  <span>Your Rank: <b>{leaderboardData.userRank.rank}</b></span> | 
                  <span>Score: <b>{leaderboardData.userRank.score}</b></span>
                </div>
              ) : (
                <div className="user-rank-highlight" style={{ background: "#ffe1e1", color: "#888" }}>
                  You have not attempted this quiz yet.
                </div>
              )}
              <ul className="leaderboard-list">
                {/* Show logged-in user at the top, then others */}
                {leaderboardData.userRank && (
                  <li key={leaderboardData.userRank.email + '-user'} style={{ background: '#fcecec', fontWeight: 'bold' }}>
                    <span className="rank-badge">{leaderboardData.userRank.rank}</span>
                    <span>{leaderboardData.userRank.name} (You)</span>
                    <span style={{ marginLeft: "auto", fontWeight: 600,}}>{leaderboardData.userRank.score}</span>
                  </li>
                )}
                {leaderboardData.leaderboard
                  .filter(entry => !leaderboardData.userRank || entry.email !== leaderboardData.userRank.email)
                  .map((entry) => (
                    <li key={entry.email + entry.rank}>
                      <span className="rank-badge">{entry.rank}</span>
                      <span>{entry.name}</span>
                      <span style={{ marginLeft: "auto", fontWeight: 600 }}>{entry.score}</span>
                    </li>
                  ))}
              </ul>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Ranking;
