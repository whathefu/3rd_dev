import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(state => state.auth.user);

  // 디버깅: 사용자 정보 확인
  console.log('Sidebar - 사용자 정보:', user);
  console.log('Sidebar - Redux 상태:', useSelector(state => state?.auth));

  const [isOpen, setIsOpen] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const routes = [
    { path: '/', route: 'home', icon: 'home', text: '홈', theme: 'blue' },
    { path: '/quiz', route: 'quiz', icon: 'quiz', text: '퀴즈 풀기', theme: 'green' },
    { path: '/wrong-notes', route: 'wrong-notes', icon: 'wrong', text: '오답노트', theme: 'red' },
    { path: '/analytics', route: 'analytics', icon: 'analytics', text: '학습 분석', theme: 'purple' }
  ];

  const openDrawer = () => {
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  const handleNavItemClick = (route) => {
    const pathMap = {
      'home': '/',
      'quiz': '/quiz',
      'wrong-notes': '/wrong-notes',
      'analytics': '/analytics'
    };

    const path = pathMap[route] || route;

    // 현재 경로와 클릭한 경로가 같으면 아무 동작 안 함
    if (location.pathname === path) {
      closeDrawer();
      return;
    }

    navigate(path);
    closeDrawer();
  };

  const handleLoginPopupClose = () => {
    setShowLoginPopup(false);
    navigate('/');
  };

  const renderIcon = (iconType) => {
    switch (iconType) {
      case 'home':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 11l9-7 9 7"></path>
            <path d="M9 22V12h6v10"></path>
          </svg>
        );
      case 'quiz':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="3" width="16" height="18" rx="2"></rect>
            <path d="M8 7h8M8 11h8M8 15h6"></path>
          </svg>
        );
      case 'wrong':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="2"></rect>
            <path d="M8 8h8M8 12h8M8 16h5"></path>
          </svg>
        );
      case 'analytics':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
            <path d="M7 13h2v5H7zM11 9h2v9h-2zM15 6h2v12h-2z"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <button 
        className="btn-icon" 
        aria-label="메뉴" 
        id="openDrawer"
        onClick={openDrawer}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>

      {isOpen && <div className="overlay" onClick={closeDrawer}></div>}

      <aside 
        className={`drawer ${isOpen ? 'open' : ''}`}
        aria-hidden={!isOpen}
      >
        <div className="header">
          <div className="header-top">
            <div className="brand">
              <img src="/img/ai-go-logo.png" alt="아이-고" className="logo-img" />
              <span className="brand-text">아이-고</span>
            </div>
            <button 
              className="btn-x" 
              aria-label="닫기"
              onClick={closeDrawer}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M6 6l12 12M18 6l-12 12"/>
              </svg>
            </button>
          </div>

          {user ? (
            <div className="profile">
              <div className="avatar">
                {(user.name || user.username || '유').trim().charAt(0) || '👤'}
              </div>
              <div className="who">
                <div className="name">{user.name || user.username || '사용자'}</div>
                <div className="mail">{user.email}</div>
                {user.isTempUser && (
                  <div className="temp-user-notice">임시 사용자 정보</div>
                )}
              </div>
            </div>
          ) : (
            <div className="login-required">
              <div className="login-prompt">
                <div className="login-icon">👤</div>
                <div className="login-text">
                  <div className="login-title">사용자 정보 로딩 중</div>
                  <div className="login-subtitle">백엔드 연결 확인 필요</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <nav>
          <ul>
            {routes.map(route => (
              <li key={route.route}>
                <a 
                  href={route.path} 
                  className={`nav-item theme-${route.theme}`}
                  data-route={route.route}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavItemClick(route.route);
                  }}
                >
                  <span className="ic">{renderIcon(route.icon)}</span>
                  <span className="txt">{route.text}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="foot">
          <div className="ver">
            <img src="/img/ai-go-logo.png" alt="아이-고" className="logo-img-small" />
            <span>아이-고 v1.0</span>
          </div>
          <div>안전한 운전을 위한 스마트 학습</div>
        </div>
      </aside>

      {showLoginPopup && (
        <div className="login-required-modal">
          <div className="login-required-content">
            <h3>로그인이 필요합니다</h3>
            <p>이 기능을 사용하려면 로그인이 필요합니다.</p>
            <button onClick={handleLoginPopupClose}>확인</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
