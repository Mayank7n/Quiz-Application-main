import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import Signup from "./pages/Signup";
import AdminPanel from "./pages/AdminPanel";
import Navbar from "./components/Navbar";
import CreateQuizPage from "./pages/CreateQuizPage";
import QuizList from "./pages/QuizList";
import AttemptQuiz from "./pages/AttemptQuiz";
import Ranking from "./pages/Ranking";
import "./styles/admin.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/create-quiz" element={<CreateQuizPage />} />
          <Route path="/quiz" element={<QuizList />} />
          <Route path="/attempt-quiz/:id" element={<AttemptQuiz />} />
          <Route path="/ranking" element={<Ranking />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
