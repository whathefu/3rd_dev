import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { getStats } from '../api/health';
import { getVideos, getMyAnalytics } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
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

  // 비디오 목록 상태
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);

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
        // 통계 정보 가져오기
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

      try {
        // 사용자 분석 정보로 통계 업데이트
        if (user) {
          const analytics = await getMyAnalytics();
          setStats(prev => ({
            ...prev,
            quizzes: analytics.total || prev.quizzes,
            accuracy: analytics.accuracy || prev.accuracy,
          }));
        }
      } catch (e) {
        console.error("Failed to fetch user analytics", e);
      }

      try {
        // 비디오 목록 가져오기
        setVideoLoading(true);
        const videoList = await getVideos({ limit: 6 }); // 최신 6개
        setVideos(videoList || []);
        if (videoList && videoList.length > 0) {
          setSelectedVideo(videoList[0]); // 첫 번째 비디오를 기본 선택
        }
      } catch (e) {
        console.error("Failed to fetch videos", e);
      } finally {
        setVideoLoading(false);
      }
    })();
  }, [user]);

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

        {/* 퀴즈 바로 시작하기 섹션 */}
        <div className="section-title">
          퀴즈 바로 시작하기
          <button 
            className="btn-start-quiz"
            onClick={() => navigate('/quiz')}
            style={{
              marginLeft: 'auto',
              padding: '8px 16px',
              backgroundColor: '#2b73ff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            퀴즈 시작 →
          </button>
        </div>

        {/* 비디오 섹션 */}
        {videoLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            비디오를 불러오는 중...
          </div>
        ) : videos.length > 0 ? (
          <div className="video-section">
            {/* 선택된 비디오 재생 */}
            {selectedVideo && (
              <div className="main-video" style={{ marginBottom: '20px' }}>
                <VideoPlayer video={selectedVideo} />
              </div>
            )}

            {/* 비디오 목록 */}
            <div className="video-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '15px',
              marginTop: '20px'
            }}>
              {videos.map((video) => (
                <div 
                  key={video.video_id}
                  className={`video-card ${selectedVideo?.video_id === video.video_id ? 'selected' : ''}`}
                  onClick={() => setSelectedVideo(video)}
                  style={{
                    border: selectedVideo?.video_id === video.video_id ? '2px solid #2b73ff' : '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '10px',
                    cursor: 'pointer',
                    backgroundColor: selectedVideo?.video_id === video.video_id ? '#f0f7ff' : 'white',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {video.thumbnail_url && (
                    <img 
                      src={video.thumbnail_url} 
                      alt={video.title}
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        marginBottom: '8px'
                      }}
                    />
                  )}
                  <h4 style={{ 
                    margin: '0 0 5px 0', 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {video.title || "제목 없음"}
                  </h4>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>
                      난이도: {video.difficulty === 1 ? '상' : video.difficulty === 2 ? '중' : '하'}
                    </span>
                    {video.duration_sec && (
                      <span>
                        {Math.floor(video.duration_sec / 60)}:{String(video.duration_sec % 60).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666',
            border: '2px dashed #ddd',
            borderRadius: '8px',
            marginTop: '20px'
          }}>
            <p>아직 등록된 비디오가 없습니다.</p>
            {user && (
              <button
                onClick={() => navigate('/videos/create')}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                첫 번째 비디오 등록하기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;






