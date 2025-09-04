import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { getStats } from '../api/health';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(state => state?.auth?.user);

  // 디버깅: 사용자 정보 확인
  console.log('HomePage - 사용자 정보:', user);
  console.log('HomePage - Redux 상태:', useSelector(state => state?.auth));
  
  // 백엔드 연결 상태 확인
  if (!user) {
    console.warn('⚠️ 사용자 정보가 없습니다. 백엔드 토큰 검증 로직을 확인해주세요.');
  }

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // ✅ API에서 받아올 학습 통계 상태 (초깃값은 0으로 설정)
  const [stats, setStats] = useState({
    quizzes: 0,
    accuracy: 0,
    streakDays: 0,
    studyHours: 0
  });

  // 기존 주간 진행도 더미
  const weeklyProgress = [
    { day: '월', status: 'done' },
    { day: '화', status: 'done' },
    { day: '수', status: 'done' },
    { day: '목', status: 'done' },
    { day: '금', status: 'today' },
    { day: '토', status: 'pending' },
    { day: '일', status: 'pending' }
  ];

  // ✅ 최초 마운트 시 API 호출해서 stats 갱신
  useEffect(() => {
    (async () => {
      try {
        const data = await getStats(); // {quizzes, accuracy, streakDays, studyHours}
        setStats(prev => ({
          ...prev,
          quizzes: data.quizzes ?? prev.quizzes,
          accuracy: data.accuracy ?? prev.accuracy,
          streakDays: data.streakDays ?? prev.streakDays,
          studyHours: data.studyHours ?? prev.studyHours,
        }));
      } catch (e) {
        console.error("Failed to fetch stats", e);
        // 실패 시 기본값 유지 (0)
      }
    })();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    // access_token 제거
    localStorage.removeItem('access_token');
    navigate('/');
  };

  const openLogoutModal = () => setIsLogoutModalOpen(true);
  const closeLogoutModal = () => setIsLogoutModalOpen(false);
  const confirmLogout = () => {
    handleLogout();
    closeLogoutModal();
  };

  const handleMyPageNavigation = () => {
    navigate('/me');
  };

  // 사용자 이름 변경 기능 제거 (백엔드에서 제대로 된 사용자 정보를 반환해야 함)

  return (
    <div className="app">
      {/* 로그아웃 모달 */}
      {isLogoutModalOpen && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <div className="logout-modal-icon">↪</div>
            <h3>로그아웃</h3>
            <p>정말로 로그아웃 하시겠습니까?</p>
            <div className="logout-modal-actions">
              <button className="btn-cancel" onClick={closeLogoutModal}>취소</button>
              <button className="btn-confirm" onClick={confirmLogout}>로그아웃</button>
            </div>
          </div>
        </div>
      )}

      <div className="content">
        <div className="header">
          <span className="ribbon">스마트 운전 교육 플랫폼</span>
          {user && (
            <div className="topbar-actions">
              <button className="btn-mypage" onClick={handleMyPageNavigation}>마이페이지</button>
              <button className="btn-logout-small" onClick={openLogoutModal}>로그아웃</button>
            </div>
          )}
        </div>

        {/* 인사 */}
        <div className="hello">
          <div className="mark">?</div>
          <div>
            <h1>
              {user ? (
                <>안녕하세요 <span className="name">{user.name || user.username || '사용자'}</span>님<br/></>
              ) : (
                <>안녕하세요<br/></>
              )}
              오늘도 안전 운전하세요
            </h1>
          </div>
        </div>

        <div className="section-title">학습 현황</div>

        {/* 상단 지표 카드 */}
        <div className="grid">
          {/* 완료한 퀴즈 */}
          <div className="card">
            <div className="head">
              <span>완료한 퀴즈</span>
              <span className="badge">+3개</span>
            </div>
            <div className="value">
              <div className="icon trophy">🏆</div>
              <span>{stats.quizzes}</span>
            </div>
          </div>

          {/* 정답률 */}
          <div className="card">
            <div className="head">
              <span>정답률</span>
              <span className="badge">+2%</span>
            </div>
            <div className="value">
              <div className="icon target">🎯</div>
              <span>{stats.accuracy}%</span>
            </div>
          </div>

          {/* 연속 학습 */}
          <div className="card">
            <div className="head">
              <span>연속 학습</span>
              <span className="badge">+1일</span>
            </div>
            <div className="value">
              <div className="icon streak">📈</div>
              <span>{stats.streakDays}일</span>
            </div>
          </div>

          {/* 총 학습시간 */}
          <div className="card">
            <div className="head">
              <span>총 학습시간</span>
              <span className="badge">+2시간</span>
            </div>
            <div className="value">
              <div className="icon clock">🕒</div>
              <span>{stats.studyHours}시간</span>
            </div>
          </div>
        </div>

        {/* 이번 주 학습 */}
        <div className="section-title">이번 주 학습</div>
        <div className="week-card">
          <div className="week-top">
            <span className="mini">주간 목표 달성률</span>
            <strong>75%</strong>
          </div>
          <div className="bar"><i></i></div>

          <div className="weekday">
            {weeklyProgress.map((day, index) => (
              <div
                key={index}
                className={`dot ${day.status === 'done' ? 'done' : ''} ${day.status === 'today' ? 'today' : ''}`}
              >
                {day.day}
                {day.status === 'pending' && <span className="check">✓</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;






