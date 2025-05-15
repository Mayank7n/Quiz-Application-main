import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Container, Row, Col, Card, Button, Spinner, Badge, Modal } from "react-bootstrap";
import { TbTrophy, TbMedal, TbUser, TbArrowBack } from "react-icons/tb";
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
    <Container className="ranking-container py-5">
      <h1 className="text-center mb-5">
        <TbTrophy className="me-2" style={{ color: '#ffd700' }} />
        Quiz Rankings
      </h1>
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading quizzes...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger text-center">{error}</div>
      ) : quizzes.length === 0 ? (
        <div className="text-center my-5">
          <p className="lead">No quiz attempts found.</p>
          <p>Complete some quizzes to see your rankings!</p>
        </div>
      ) : !showLeaderboard ? (
        <div className="quiz-sections">
          {[...new Map(
            quizzes
              .filter(q => q && q._id && q.title)
              .map(q => [q._id, q])
          ).values()].map((quiz, index) => (
            <section key={quiz._id} className="quiz-section">
              <div className="quiz-section-header">
                <h3 className="quiz-section-title">
                  <TbTrophy className="me-2" />
                  {quiz.title}
                </h3>
                <Button 
                  variant="outline-dark" 
                  size="sm"
                  onClick={() => openLeaderboard(quiz._id, quiz.title)}
                  className="ms-auto"
                >
                  View Leaderboard
                </Button>
              </div>
              
              <div className="quiz-section-content">
                {leaderboardLoading && quiz._id === showLeaderboard?.quizId ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading leaderboard...
                  </div>
                ) : leaderboardData && showLeaderboard?.quizId === quiz._id ? (
                  <div className="leaderboard-preview">
                    {leaderboardData.leaderboard.slice(0, 3).map((entry, idx) => (
                      <div key={entry.email} className="leaderboard-preview-item">
                        <div className="d-flex align-items-center">
                          <span className="leaderboard-rank">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                          </span>
                          <span className="ms-2">
                            {entry.name}
                            {leaderboardData.userRank?.email === entry.email && (
                              <Badge bg="primary" className="ms-2">You</Badge>
                            )}
                          </span>
                          <span className="ms-auto fw-bold">{Math.floor(entry.score)}</span>
                        </div>
                      </div>
                    ))}
                    {leaderboardData.userRank && !leaderboardData.leaderboard.some(e => e.email === leaderboardData.userRank.email) && (
                      <div className="leaderboard-preview-item user-rank">
                        <div className="d-flex align-items-center">
                          <span className="leaderboard-rank">
                            #{leaderboardData.userRank.rank}
                          </span>
                          <span className="ms-2">
                            {leaderboardData.userRank.name}
                            <Badge bg="primary" className="ms-2">You</Badge>
                          </span>
                          <span className="ms-auto fw-bold">{Math.floor(leaderboardData.userRank.score)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {/* Leaderboard Modal */}
      <Modal 
        show={!!showLeaderboard} 
        onHide={closeLeaderboard}
        size="lg"
        centered
        className="leaderboard-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="w-100 text-center">
            <h4 className="mb-0">
              <TbTrophy className="me-2" style={{ color: '#ffd700' }} />
              {showLeaderboard?.quizTitle}
            </h4>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {leaderboardLoading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading leaderboard...</p>
            </div>
          ) : leaderboardError ? (
            <div className="alert alert-danger">{leaderboardError}</div>
          ) : leaderboardData ? (
            <div>
              {/* User's rank highlight */}
              {leaderboardData.userRank ? (
                <div className="bg-light p-3 rounded-3 mb-4 shadow-sm">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1">Your Ranking</h5>
                      <div className="d-flex align-items-center">
                        <Badge bg="primary" className="me-2 fs-6">
                          #{leaderboardData.userRank.rank}
                        </Badge>
                        <span className="fw-bold">{leaderboardData.userRank.name}</span>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="text-muted small">Score</div>
                      <div className="h4 mb-0 fw-bold text-primary">
                        {Math.floor(leaderboardData.userRank.score)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="alert alert-info">
                  You have not attempted this quiz yet.
                </div>
              )}

              {/* Leaderboard */}
              <div className="leaderboard-container">
                <h5 className="mb-3 text-muted">Top Performers</h5>
                <div className="list-group">
                  {leaderboardData.leaderboard.map((entry, index) => {
                    const isCurrentUser = leaderboardData.userRank?.email === entry.email;
                    let rankClass = '';
                    
                    if (index === 0) rankClass = 'bg-warning bg-opacity-10';
                    else if (index === 1) rankClass = 'bg-secondary bg-opacity-10';
                    else if (index === 2) rankClass = 'bg-danger bg-opacity-10';
                    
                    return (
                      <div 
                        key={entry.email} 
                        className={`list-group-item list-group-item-action border-0 rounded-3 mb-2 d-flex align-items-center ${rankClass} ${isCurrentUser ? 'border border-primary' : ''}`}
                      >
                        <div className="d-flex align-items-center w-100">
                          <div className="position-relative me-3">
                            {index < 3 ? (
                              <TbMedal 
                                size={24} 
                                className={index === 0 ? 'text-warning' : index === 1 ? 'text-secondary' : 'text-danger'}
                              />
                            ) : (
                              <Badge bg="light" text="dark" className="rank-badge">
                                {index + 1}
                              </Badge>
                            )}
                          </div>
                          <div className="d-flex justify-content-between w-100 align-items-center">
                            <div>
                              <span className="fw-medium">{entry.name}</span>
                              {isCurrentUser && (
                                <Badge bg="primary" className="ms-2">You</Badge>
                              )}
                            </div>
                            <div className="text-end">
                              <div className="fw-bold">{Math.floor(entry.score)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={closeLeaderboard}>
            <TbArrowBack className="me-1" /> Back to Quizzes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Ranking;
