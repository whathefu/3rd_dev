import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUserStats } from '../services/database';
import './AnalyticsPage.css';

const AnalyticsPage = () => {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);

  const [analytics, setAnalytics] = useState({
    totalQuizzes: 0,
    accuracy: 0,
    streakDays: 0,
    studyHours: 0,
    weakTopics: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // API 명세서에 맞춰 analytics/summary 엔드포인트 사용
        const stats = await getUserStats();
        setAnalytics({
          ...stats,
          weakTopics: [] // 취약 주제는 별도 구현 필요
        });
      } catch (error) {
        console.error('학습 분석 데이터 로드 중 오류:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user?.id]);

  const renderAccuracyCircle = (accuracy) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const progress = circumference - (accuracy / 100) * circumference;

    return (
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle 
          cx="60" 
          cy="60" 
          r={radius} 
          fill="none" 
          stroke="#e6e8ee" 
          strokeWidth="12"
        />
        <circle 
          cx="60" 
          cy="60" 
          r={radius} 
          fill="none" 
          stroke="#2b67ff" 
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          transform="rotate(-90 60 60)"
        />
        <text 
          x="50%" 
          y="50%" 
          textAnchor="middle" 
          dy=".3em" 
          fontSize="24" 
          fontWeight="900" 
          fill="#2b67ff"
        >
          {accuracy}%
        </text>
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="app">
        <section className="page">
          <div className="panel">
            <div className="loading">학습 통계를 불러오는 중...</div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <section className="page">
          <div className="panel">
            <div className="error">
              <div className="icon">⚠️</div>
              <h2>학습 통계를 불러올 수 없습니다</h2>
              <p>{error}</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="app">
      <section className="page">
        <div className="panel">
          <div className="panel-head">
            <div className="left">
              <span className="round">📊</span>
              <div>
                <div style={{fontWeight:900}}>학습 통계</div>
                <div style={{color:'#8b97ad'}}>당신의 학습 현황을 확인하세요</div>
              </div>
            </div>
          </div>

          <div className="summary">
            <div className="stat-item">
              <div className="label">총 퀴즈 수</div>
              <div className="value">{analytics.totalQuizzes}</div>
            </div>
            <div className="stat-item">
              <div className="label">연속 학습</div>
              <div className="value">{analytics.streakDays}</div>
            </div>
            <div className="stat-item">
              <div className="label">학습 시간</div>
              <div className="value">{analytics.studyHours}h</div>
            </div>
          </div>

          <div className="accuracy-section">
            <h3>정답률</h3>
            <div className="accuracy-circle">
              {renderAccuracyCircle(analytics.accuracy)}
            </div>
          </div>

          <div className="weak-topics">
            <h3>취약한 주제</h3>
            <div className="topics-list">
              {analytics.weakTopics.length > 0 ? (
                analytics.weakTopics.map((topic, index) => (
                  <div key={index} className="topic-item">
                    <div className="topic-info">
                      <div className="topic-name">{topic.name}</div>
                      <div className="topic-stats">
                        {topic.accuracy}% ({topic.totalQuestions}문제)
                      </div>
                    </div>
                    <div className="topic-progress">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${topic.accuracy}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data">아직 충분한 데이터가 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsPage;
