import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getUserStats } from '../services/database';
import './MyPagePage.css';

const MyPagePage = () => {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);

  const [userStats, setUserStats] = useState({
    totalQuizzes: 0,
    accuracy: 0,
    streakDays: 0,
    studyHours: 0,
    learningHistory: [] // 기본값을 빈 배열로 설정
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        // API 명세서에 맞춰 analytics/summary 엔드포인트 사용
        const stats = await getUserStats();
        setUserStats({
          ...stats,
          learningHistory: stats.learningHistory || [] // 안전장치 추가
        });
      } catch (error) {
        console.error('사용자 통계 로드 중 오류:', error);
        setError(error.message);
        // 에러 시 기본값 설정
        setUserStats({
          totalQuizzes: 0,
          accuracy: 0,
          streakDays: 0,
          studyHours: 0,
          learningHistory: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user?.id]);

  const handleLogout = () => {
    // 로그아웃 로직
    dispatch({ type: 'auth/logout' });
    localStorage.removeItem('access_token');
    navigate('/');
  };

  const handleProfileEdit = async () => {
    if (isEditing) {
      try {
        // 프로필 업데이트 API 호출
        // await api.updateProfile({ name: editedName, email: editedEmail });
        
        // Redux 스토어 업데이트
        dispatch({
          type: 'app/setUser',
          payload: { 
            ...user, 
            name: editedName, 
            email: editedEmail 
          }
        });
        
        setIsEditing(false);
      } catch (error) {
        console.error('프로필 업데이트 중 오류:', error);
      }
    } else {
      setIsEditing(true);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <section className="page">
          <div className="panel">
            <div className="loading">프로필 정보를 불러오는 중...</div>
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
              <h2>프로필 정보를 불러올 수 없습니다</h2>
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
              <span className="round">👤</span>
              <div>
                <div style={{fontWeight:900}}>내 프로필</div>
                <div style={{color:'#8b97ad'}}>개인 정보를 관리하세요</div>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-avatar">
              <span className="avatar-icon">{user?.name?.[0] || '김'}</span>
            </div>
            
            {isEditing ? (
              <div className="profile-edit">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="이름"
                  className="edit-input"
                />
                <input
                  type="email"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  placeholder="이메일"
                  className="edit-input"
                />
                <div className="edit-actions">
                  <button 
                    className="btn-primary" 
                    onClick={handleProfileEdit}
                  >
                    저장
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={() => {
                      setIsEditing(false);
                      setEditedName(user?.name || '');
                      setEditedEmail(user?.email || '');
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-info">
                <div className="profile-name">{user?.name || '사용자'}</div>
                <div className="profile-email">{user?.email || 'user@example.com'}</div>
                <button 
                  className="btn-secondary" 
                  onClick={handleProfileEdit}
                >
                  프로필 수정
                </button>
              </div>
            )}
          </div>

          <div className="stats-section">
            <h3>학습 통계</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">총 퀴즈 수</div>
                <div className="stat-value">{userStats.totalQuizzes}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">정답률</div>
                <div className="stat-value">{userStats.accuracy}%</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">연속 학습</div>
                <div className="stat-value">{userStats.streakDays}일</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">학습 시간</div>
                <div className="stat-value">{userStats.studyHours}h</div>
              </div>
            </div>
          </div>

          <div className="history-section">
            <h3>학습 기록</h3>
            <div className="history-list">
              {userStats.learningHistory && userStats.learningHistory.length > 0 ? (
                userStats.learningHistory.map((history, index) => (
                  <div key={index} className="history-item">
                    <div className="history-date">{history.date}</div>
                    <div className="history-stats">
                      <span>퀴즈 {history.quizzesSolved}개</span>
                      <span>정답률 {history.accuracy}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data">아직 학습 기록이 없습니다.</div>
              )}
            </div>
          </div>

          <div className="actions-section">
            <button 
              className="btn-primary" 
              onClick={() => navigate('/quiz')}
            >
              퀴즈 풀기
            </button>
            <button 
              className="btn-secondary" 
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MyPagePage;
