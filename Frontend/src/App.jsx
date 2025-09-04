// src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserInfo } from './store/authSlice';

import Sidebar from './components/Sidebar';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import QuizPage from './pages/QuizPage';
import WrongNotesPage from './pages/WrongNotesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MyPagePage from './pages/MyPagePage';

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem('access_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const RequireGuest = ({ children }) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    // 토큰이 있으면 홈 페이지로 리다이렉트
    return <Navigate to="/" replace />;
  }
  return children;
};

const Shell = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fb' }}>
    <Sidebar />
    <main style={{ flex: 1, padding: '24px' }}>{children}</main>
  </div>
);

// 앱 초기화 컴포넌트
const AppInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    // 토큰이 있고 사용자 정보가 없는 경우 사용자 정보 가져오기
    if (token && !user && !isAuthenticated) {
      console.log('앱 시작 시 저장된 토큰으로 사용자 정보 가져오기 시도...');
      dispatch(fetchUserInfo()).catch(error => {
        console.error('앱 시작 시 사용자 정보 가져오기 실패:', error);
        // 실패 시 토큰 제거하여 로그인 페이지로 리다이렉트
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      });
    }
  }, [dispatch, user, isAuthenticated]);

  return children;
};

export default function App() {
  return (
    <AppInitializer>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
        <Route path="/signup" element={<RequireGuest><SignUpPage /></RequireGuest>} />

        {/* 보호 라우트 */}
        <Route path="/" element={<RequireAuth><Shell><HomePage /></Shell></RequireAuth>} />
        <Route path="/quiz" element={<RequireAuth><Shell><QuizPage /></Shell></RequireAuth>} />
        <Route path="/wrong-notes" element={<RequireAuth><Shell><WrongNotesPage /></Shell></RequireAuth>} />
        <Route path="/analytics" element={<RequireAuth><Shell><AnalyticsPage /></Shell></RequireAuth>} />
        <Route path="/me" element={<RequireAuth><Shell><MyPagePage /></Shell></RequireAuth>} />

        {/* 그 외 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppInitializer>
  );
}







