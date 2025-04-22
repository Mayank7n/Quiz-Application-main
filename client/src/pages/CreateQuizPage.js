// import React, { useState } from "react";
// import "../styles/createQuiz.css";

// const CreateQuizPage = () => {
//   const [quizTitle, setQuizTitle] = useState("");
//   const [quizDesc, setQuizDesc] = useState("");
//   const [questions, setQuestions] = useState([{ question: "", options: ["", "", "", ""], correctAnswer: 0 }]);

//   const handleQuestionChange = (index, field, value) => {
//     const updatedQuestions = [...questions];
//     if (field === "question") {
//       updatedQuestions[index].question = value;
//     } else {
//       updatedQuestions[index].options[field] = value;
//     }
//     setQuestions(updatedQuestions);
//   };

//   const handleCorrectAnswerChange = (index, value) => {
//     const updatedQuestions = [...questions];
//     updatedQuestions[index].correctAnswer = parseInt(value);
//     setQuestions(updatedQuestions);
//   };
//           type="text"
//           placeholder="Quiz Title"
//           value={quizTitle}
//           onChange={(e) => setQuizTitle(e.target.value)}
//         />
//         <textarea
//           placeholder="Quiz Description"
//           value={quizDesc}
//           onChange={(e) => setQuizDesc(e.target.value)}
//         />

//         {questions.map((q, index) => (
//           <div key={index} className="question-block">
//             <input
//               type="text"
//               placeholder={`Question ${index + 1}`}
//               value={q.question}
//               onChange={(e) => handleQuestionChange(index, "question", e.target.value)}
//             />
//             {q.options.map((opt, optIndex) => (
//               <input
//                 key={optIndex}
//                 type="text"
//                 placeholder={`Option ${optIndex + 1}`}
//                 value={opt}
//                 onChange={(e) => handleQuestionChange(index, optIndex, e.target.value)}
//               />
//             ))}
//             <select
//               value={q.correctAnswer}
//               onChange={(e) => handleCorrectAnswerChange(index, e.target.value)}
//             >
//               {q.options.map((_, idx) => (
//                 <option key={idx} value={idx}>Correct: Option {idx + 1}</option>
//               ))}
//             </select>
//           </div>
//         ))}

//         <button type="button" onClick={addQuestion}>+ Add Question</button>
//         <button type="submit">Create Quiz</button>
//       </form>
//     </div>
//   );
// };

// export default CreateQuizPage;
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/createQuiz.css";

const API_URL = "https://quiz-application-main.onrender.com";

const CreateQuizPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizTitle, setQuizTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], correctAnswer: 0 },
  ]);

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    if (field === "question") {
      updatedQuestions[index].question = value;
    } else {
      updatedQuestions[index].options[field] = value;
    }
    setQuestions(updatedQuestions);
  };

  const handleCorrectAnswerChange = (index, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].correctAnswer = parseInt(value);
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: "", options: ["", "", "", ""], correctAnswer: 0 },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user || !user.token) {
      setError("You must be logged in to create a quiz");
      return;
    }

    // Validate inputs
    if (!quizTitle.trim()) {
      setError("Quiz title is required");
      return;
    }

    const invalidQuestions = questions.some(
      (q) => !q.question.trim() || q.options.some((opt) => !opt.trim())
    );

    if (invalidQuestions) {
      setError("All questions and options must be filled out");
      return;
    }

    try {
      // Format questions according to the server model
      const formattedQuestions = questions.map((q) => ({
        questionText: q.question,
        options: q.options,
        correctAnswer: q.options[q.correctAnswer],
      }));

      const quizData = {
        title: quizTitle,
        questions: formattedQuestions,
        timeLimit: timeLimit ? Number(timeLimit) : undefined,
      };

      const response = await fetch(`${API_URL}/quiz/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(quizData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create quiz");
      }

      setSuccess("Quiz created successfully!");
      // Reset form
      setQuizTitle("");
      setQuestions([{ question: "", options: ["", "", "", ""], correctAnswer: 0 }]);
      // Redirect to quiz list so admin sees the new quiz
      setTimeout(() => navigate("/quiz"), 500);
    } catch (err) {
      console.error("Create quiz error:", err);
      setError(err.message || "Failed to create quiz");
    }
  };

  return (
    <div className="create-quiz-container">
      <h2>Create a New Quiz</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Quiz Title"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
          required
        />
        <input
          type="number"
          min="1"
          placeholder="Time Limit (minutes, optional)"
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value)}
          style={{ marginBottom: '1rem' }}
        />

        {questions.map((q, index) => (
          <div key={index} className="question-block">
            <textarea
              placeholder={`Question ${index + 1}`}
              value={q.question}
              onChange={(e) => handleQuestionChange(index, "question", e.target.value)}
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
            />
            {q.options.map((opt, optIndex) => (
              <input
                key={optIndex}
                type="text"
                placeholder={`Option ${optIndex + 1}`}
                value={opt}
                onChange={(e) =>
                  handleQuestionChange(index, optIndex, e.target.value)
                }
                required
              />
            ))}
            <select
              value={q.correctAnswer}
              onChange={(e) => handleCorrectAnswerChange(index, e.target.value)}
              required
            >
              {q.options.map((_, idx) => (
                <option key={idx} value={idx}>
                  Correct: Option {idx + 1}
                </option>
              ))}
            </select>
          </div>
        ))}

        <button type="button" onClick={addQuestion}>
          + Add Question
        </button>
        <button type="submit">Create Quiz</button>
      </form>
    </div>
  );
};

export default CreateQuizPage;
