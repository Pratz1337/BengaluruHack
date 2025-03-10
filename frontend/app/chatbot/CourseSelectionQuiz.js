import { useState, useEffect } from "react";
import { XIcon } from 'lucide-react';
import { Button } from "@nextui-org/button";
import axios from "axios";
import styles from "./CourseSelectionQuiz.module.css";

const CourseSelectionQuiz = ({ onClose }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentQ = questions[currentQuestion];

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${process.env.API_URL ? process.env.API_URL : "http://localhost:5000"}/quiz/questions`);
      setQuestions(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitQuiz = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.API_URL ? process.env.API_URL : "http://localhost:5000"}/quiz/submit`, {
        answers,
        questions,
      });
      setRecommendations(response.data.gemini_recommendations);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setRecommendations("Unable to generate recommendations");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (recommendations) {
    return (
      <div className={`${styles.modalOverlay} ${styles.resultScreen}`}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2>Your Course Recommendations</h2>
            <Button auto light onClick={onClose}>
              <XIcon />
            </Button>
          </div>
          <div className={styles.recommendationsContainer}>
            {recommendations.split("\n").map((rec, index) => {
              const [course, reason] = rec.split(": ");
              return (
                <div key={index} className={styles.recommendation}>
                  <h3>{course}</h3>
                  <p>{reason}</p>
                </div>
              );
            })}
          </div>
          <Button onClick={onClose} className={styles.closeButton}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Course Selection Quiz</h2>
          <Button auto light onClick={onClose}>
            <XIcon />
          </Button>
        </div>
        <div className={styles.quizContent}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            ></div>
          </div>
          {currentQ ? (
            <>
              <h3 className={styles.questionText}>{currentQ.question}</h3>
              <div className={styles.optionsContainer}>
                {currentQ.options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleAnswer(currentQ._id, option)}
                    className={`${styles.option} ${
                      answers[currentQ._id] === option ? styles.selectedOption : ""
                    }`}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              <div className={styles.navigationButtons}>
                <Button
                  auto
                  light
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </Button>
                <Button
                  auto
                  onClick={handleNext}
                  disabled={!answers[currentQ._id]}
                >
                  {currentQuestion === questions.length - 1 ? "Submit" : "Next"}
                </Button>
              </div>
            </>
          ) : (
            <h3>No questions available</h3>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseSelectionQuiz;

