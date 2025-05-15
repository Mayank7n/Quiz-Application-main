import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./styles/admin.css";

// Lazy load components
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Signup = lazy(() => import('./pages/Signup'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const CreateQuizPage = lazy(() => import('./pages/CreateQuizPage'));
const QuizList = lazy(() => import('./pages/QuizList'));
const AttemptQuiz = lazy(() => import('./pages/AttemptQuiz'));
const Ranking = lazy(() => import('./pages/Ranking'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Loading component
const LoadingFallback = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

// Main App component
const AppContent = () => {
  const { user } = useAuth();

  // Create protected route component
  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (!user) {
      return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
    }
    if (adminOnly && user.role !== 'admin') {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="app">
        <Navbar />
        <Suspense fallback={<div className="text-center p-5">Loading...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" replace /> : <LoginPage />} 
            />
            <Route 
              path="/signup" 
              element={user ? <Navigate to="/" replace /> : <Signup />} 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-quiz" 
              element={
                <ProtectedRoute adminOnly>
                  <CreateQuizPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/quiz" element={<QuizList />} />
            <Route 
              path="/quiz/attempt/:id" 
              element={
                <ProtectedRoute>
                  <AttemptQuiz />
                </ProtectedRoute>
              } 
            />
            <Route path="/ranking" element={<Ranking />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
