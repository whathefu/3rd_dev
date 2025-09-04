// src/pages/QuizPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  getVideosByDifficulty,
  getQuizzesByVideoId,
  submitAnswer,
  saveWrongNote
} from '../services/database';
import './QuizPage.css';

const QuizPage = () => {
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);

  // API 명세서 기준 상태 관리
  const [currentView, setCurrentView] = useState('level');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [currentQuizzes, setCurrentQuizzes] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizStats, setQuizStats] = useState({
    total: 0,
    correct: 0,
    time: 0
  });
  const [wrongAnswers, setWrongAnswers] = useState([]);

  // 타이머 관련 상태 및 ref 추가
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  // 타이머 시작 함수
  const startTimer = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = Math.floor((currentTime - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
  };

  // 타이머 중지 함수
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ✅ QuizPage.jsx - formatTime 교체
  const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;

  // 분이 있으면 "0분 18초", 없으면 "18초"
  // 분-초 사이에 줄바꿈 방지 공백(\u00A0) 사용
  return m > 0
    ? `${m}분\u00A0${String(s).padStart(2, '0')}초`
    : `${s}초`;
  };

  const levels = [
    {
      level: 'easy',
      difficulty: 3,
      description: '운전면허 취득을 위한 기본 문제',
      theme: 'green'
    },
    {
      level: 'medium',
      difficulty: 2,
      description: '실제 운전에 필요한 심화 문제',
      theme: 'amber'
    },
    {
      level: 'hard',
      difficulty: 1,
      description: '전문가 수준의 고난도 문제',
      theme: 'rose'
    }
  ];

  // API 명세서 기준: 난이도 선택 → 비디오 목록 조회
  const handleLevelSelect = async (level) => {
    console.log('난이도 선택:', level);
    
    try {
      // 1. 난이도에 맞는 영상 목록 조회 (API 명세서: GET /videos?difficulty=3)
      const levelData = levels.find(l => l.level === level);
      const videos = await getVideosByDifficulty(levelData.difficulty);
      
      if (videos && videos.length > 0) {
        setVideos(videos);
        setSelectedLevel(level);
        setCurrentVideoIndex(0);
        setCurrentVideo(videos[0]);
        setCurrentView('video');
      } else {
        alert('해당 난이도의 영상이 없습니다.');
      }
    } catch (error) {
      console.error('영상 데이터 로드 실패:', error);
      alert('영상을 불러오는 중 오류가 발생했습니다.');
    }
  };

  // API 명세서 기준: 비디오 시청 완료 → 비디오별 퀴즈 조회
  const handleVideoComplete = async () => {
    try {
      // 1. 현재 비디오의 퀴즈 목록 조회 (API 명세서: GET /quizzes/by-video/{video_id})
      const quizzes = await getQuizzesByVideoId(currentVideo.video_id);
      
      if (quizzes && quizzes.length > 0) {
        setCurrentQuizzes(quizzes);
        setCurrentQuizIndex(0);
        setCurrentQuiz(quizzes[0]);
        setQuizStats({
          total: quizzes.length,
          correct: 0,
          time: 0
        });
        setCurrentView('quiz');
        startTimer();
      } else {
        alert('이 영상에 대한 퀴즈가 없습니다.');
        setCurrentView('video');
      }
    } catch (error) {
      console.error('퀴즈 데이터 로드 실패:', error);
      alert('퀴즈를 불러오는 중 오류가 발생했습니다.');
      setCurrentView('video');
    }
  };

  // API 명세서 기준: 정답 제출
  const handleAnswerSubmit = async () => {
    if (selectedAnswer === null) return;
    
    try {
      const timeSpentMs = Date.now() - startTimeRef.current;
      
      // API 명세서 구조: { quiz_id, selected_label, quiz_set_no, time_spent_sec }
      const payload = {
        quiz_id: currentQuiz.quiz_id,
        selected_label: currentQuiz.options[selectedAnswer].label, // label 값 사용
        quiz_set_no: 1, // 임시값
        time_spent_sec: Math.floor(timeSpentMs / 1000)
      };
      
      // 정답 제출 (API 명세서: POST /quizzes/submit)
      const result = await submitAnswer(payload);
      
      // 정답 여부 확인 (하드코딩 데이터 기준)
      const isCorrect = currentQuiz.options[selectedAnswer].is_answer === 1;
      
      // 통계 업데이트
      setQuizStats(prev => ({
        ...prev,
        correct: isCorrect ? prev.correct + 1 : prev.correct
      }));

      // 오답인 경우 오답노트에 추가 (API 명세서: POST /wrong-notes?quiz_id=uuid)
      if (!isCorrect) {
        try {
          await saveWrongNote(currentQuiz.quiz_id);
          setWrongAnswers(prev => [...prev, {
            ...currentQuiz,
            selectedAnswer,
            correct_answer: currentQuiz.options.find(opt => opt.is_answer === 1)?.label,
            explanation: currentQuiz.options[selectedAnswer].explanation_text
          }]);
        } catch (error) {
          console.error('오답노트 저장 실패:', error);
        }
      }

      // 다음 퀴즈로 진행
      const nextQuizIndex = currentQuizIndex + 1;
      
      if (nextQuizIndex < currentQuizzes.length) {
        setCurrentQuizIndex(nextQuizIndex);
        setCurrentQuiz(currentQuizzes[nextQuizIndex]);
        setSelectedAnswer(null);
        // 타이머 재시작
        startTimeRef.current = Date.now();
      } else {
        // 모든 퀴즈 완료
        stopTimer();
        setCurrentView('result');
      }
    } catch (error) {
      console.error('정답 제출 실패:', error);
      alert('정답을 제출하는 중 오류가 발생했습니다.');
    }
  };

  // 결과 화면에서 다시 도전
  const handleRetry = () => {
    setCurrentView('level');
    setSelectedLevel(null);
    setVideos([]);
    setCurrentVideoIndex(0);
    setCurrentVideo(null);
    setCurrentQuizzes([]);
    setCurrentQuizIndex(0);
    setCurrentQuiz(null);
    setSelectedAnswer(null);
    setWrongAnswers([]);
    setQuizStats({
      total: 0,
      correct: 0,
      time: 0
    });
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, []);

  // 영상 시청 뷰 렌더링
  const renderVideoView = () => {
    if (!currentVideo) {
      return (
        <div className="view page" id="view-video">
          <div className="video-card">
            <div className="question-title">
              영상을 불러올 수 없습니다.
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="view page" id="view-video">
        <div className="video-card">
          <video 
            id="quizVideo" 
            width="100%" 
            height="100%" 
            style={{ objectFit: 'cover' }} 
            controls
            autoPlay
          >
            <source 
              src={currentVideo.video_url} 
              type="video/mp4" 
            />
            브라우저가 비디오를 지원하지 않습니다.
          </video>
        </div>

        {currentVideo.description && (
          <div className="video-description">
            <h3>영상 설명</h3>
            <p>{currentVideo.description}</p>
          </div>
        )}

        <div className="video-actions">
          <button
            className="btn-primary"
            onClick={handleVideoComplete}
          >
            퀴즈 시작
          </button>
          <button
            className="btn-secondary half"
            onClick={() => setCurrentView('level')}
          >
            난이도 다시 선택
          </button>
        </div>
      </div>
    );
  };

  // 퀴즈 뷰 렌더링
  const renderQuizView = () => {
    if (!currentQuiz) {
      return (
        <div className="view page" id="view-quiz">
          <div className="question-card">
            <div className="question-title">
              더 이상 퀴즈가 없습니다.
            </div>
          </div>
          <div className="quiz-actions">
            <button 
              className="btn-primary" 
              onClick={() => setCurrentView('result')}
            >
              결과 보기
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="view page" id="view-quiz">
        <div className="quiz-header">
          <div className="quiz-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                id="progressBar" 
                style={{ width: `${((quizStats.total - wrongAnswers.length) / quizStats.total) * 100}%` }}
              ></div>
            </div>
            <div className="progress-text" id="progressText">
              {Math.round(((quizStats.total - wrongAnswers.length) / quizStats.total) * 100)}%
            </div>
          </div>
          <div className="quiz-timer" id="timer">{formatTime(elapsedTime)}</div>
        </div>

        <div className="question-card">
          <div className="question-title" id="questionText">
            {currentQuiz.question_text}
          </div>
          <div className="options" id="options">
            {currentQuiz.options && currentQuiz.options.map((option, index) => (
              <div 
                key={option.option_id} 
                className={`option ${
                  selectedAnswer === index ? 'selected' : ''
                }`}
                onClick={() => setSelectedAnswer(index)}
              >
                <div className="num">{option.label}</div>
                <div className="text">{option.option_text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="quiz-actions">
          <button 
            className="btn-back half"
            id="backToQuiz"
            onClick={() => setCurrentView('level')}
          >
            뒤로가기
          </button>
          <button 
            className="btn-next half" 
            id="btnNext"
            disabled={selectedAnswer === null}
            onClick={handleAnswerSubmit}
          >
            {wrongAnswers.length < quizStats.total - 1 ? '다음' : '결과 보기'}
          </button>
        </div>
      </div>
    );
  };

  // 결과 뷰 렌더링
  const renderResultView = () => {
    return (
      <div className="view page" id="view-result">
        <div className="result-card">
          <div className="result-header">
            <h2>결과</h2>
          </div>
          <div className="score-display" id="scoreNum">
            {Math.round((quizStats.correct / quizStats.total) * 100)}점
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="num" id="totalQ">{quizStats.total}</div>
              <div className="label">전체 문제</div>
            </div>
            <div className="stat-item">
              <div className="num" id="correctQ">{quizStats.correct}</div>
              <div className="label">정답</div>
            </div>
            <div className="stat-item">
              <div className="num" id="statTime">{formatTime(elapsedTime)}</div>
              <div className="label">소요 시간</div>
            </div>
          </div>

          <div className="wrong-answers">
            <h3>오답 노트</h3>
            <div id="wrongWrap">
              {wrongAnswers.map((quiz, index) => (
                <div key={index} className="wrong-card">
                  <div className="head">
                    <span className="tag">오답</span>
                    <span>문제 {index + 1}</span>
                  </div>
                  <div className="question-title">{quiz.question_text}</div>
                  <div className="explanation">
                    {quiz.explanation || '해설이 없습니다.'}
                  </div>
                  <div className="answer-info">
                    <div className="selected-answer">
                      <span>선택한 답: </span>
                      <strong>{quiz.options && quiz.options[quiz.selectedAnswer]}</strong>
                    </div>
                    <div className="correct-answer">
                      <span>정답: </span>
                      <strong>{quiz.options && quiz.options[quiz.correct_answer]}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="result-actions">
            <button
              className="btn-primary half"
              onClick={handleRetry}
            >
              다시 도전
            </button>
            <button 
              className="btn-secondary half"
              onClick={() => navigate('/wrong-notes')}
            >
              오답노트 보기
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 난이도 선택 뷰 렌더링
  const renderLevelView = () => (
    <div className="view page" id="view-level">
      <div className="panel">
        <h2>난이도를 선택하세요</h2>

        {levels.map((level, index) => (
          <div
            key={index}
            className={`pill ${level.theme}`}
            data-level={level.level}
            onClick={() => handleLevelSelect(level.level)}
          >
            <div className="left">
              <div className="name">{level.level === 'easy' ? '쉬움' : level.level === 'medium' ? '중간' : '고급'}</div>
              <div className="desc">{level.description}</div>
            </div>
            <div className="chev">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6l6 6-6 6"/>
              </svg>
            </div>
          </div>
        ))}

        <div className="note">난이도에 따라 문제 수와 시간이 달라집니다</div>
      </div>
    </div>
  );

  // 메인 렌더링
  return (
    <div className="app">
      {currentView === 'level' && renderLevelView()}
      {currentView === 'video' && renderVideoView()}
      {currentView === 'quiz' && renderQuizView()}
      {currentView === 'result' && renderResultView()}
    </div>
  );
};

export default QuizPage;
