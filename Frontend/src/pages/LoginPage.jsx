import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../store/authSlice';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // 1) 로그인 액션 호출 (토큰 저장은 authSlice에서 처리)
      const result = await dispatch(login({ email, password })).unwrap();

      // 2) 이메일 기억
      localStorage.setItem('last_email', email);

      // 3) 홈으로
      navigate('/');
    } catch (err) {
      console.error('Login error details:', err);
      const errorMessage =
        err?.detail || err?.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';
      setError(errorMessage);
    }
  };

  const handleSignup = () => navigate('/signup');
  const handleCtaClick = () => navigate('/signup');
  const handlePasswordReset = () => console.warn('비밀번호 찾기 기능은 아직 구현되지 않았습니다.');

  return (
    <main className="app">
      <div className="content">
        <span className="ribbon">스마트 운전 교육 플랫폼</span>

        <div className="hello">
          <div className="mark">?</div>
          <div>
            <div style={{ color: '#2b73ff', fontWeight: 900, marginBottom: '6px' }}>아이-고</div>
            <h1>서비스 이용을 위해<br /><u>로그인</u> 해주세요.</h1>
          </div>
        </div>

        <form className="form" onSubmit={handleLogin}>
          <label className="input" aria-label="이메일">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
              <path d="M4 4h16v16H4z"></path>
              <path d="M4 8l8 5 8-5"></path>
            </svg>
            <input
              type="email"
              placeholder="이메일을 입력하세요."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="input" aria-label="비밀번호">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
              <rect x="3" y="11" width="18" height="10" rx="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호를 입력하세요."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              aria-label="비밀번호 보기"
              style={{ border: 'none', background: 'transparent', padding: 0, marginLeft: '6px', color: '#6b7280', cursor: 'pointer' }}
              onClick={togglePasswordVisibility}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </label>

          {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{error}</div>}

          <div className="field-foot">
            <label className="remember">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              <span>로그인 상태 유지</span>
            </label>
            <button type="button" className="link" onClick={handlePasswordReset}>비밀번호 찾기</button>
          </div>

          <button className="btn-primary" type="submit">로그인</button>
          <div className="signup">
            아직 회원이 아니신가요?
            <button type="button" className="signup-btn" onClick={handleSignup}>회원가입</button>
          </div>
        </form>

        {/* 이하 UI는 기존과 동일 */}
        <div className="illu-wrap">
          <div className="car-illu">
            <svg width="160" height="110" viewBox="0 0 200 140" fill="none">
              <rect x="20" y="60" width="160" height="40" rx="12" fill="#85b6ff" stroke="#1e66ff" strokeWidth="2" />
              <circle cx="60" cy="110" r="14" fill="#1f2a44" />
              <circle cx="140" cy="110" r="14" fill="#1f2a44" />
              <rect x="38" y="45" width="124" height="24" rx="6" fill="#d8ecff" stroke="#1e66ff" strokeWidth="2" />
              <circle cx="95" cy="78" r="8" fill="#1e66ff" />
              <circle cx="84" cy="58" r="10" fill="#ffd7b6" />
              <circle cx="116" cy="58" r="10" fill="#ffd7b6" />
            </svg>
          </div>
        </div>

        <h2 className="title2">왜 <span style={{ color: '#2b73ff', fontWeight: 900 }}>아이-고</span>를 선택해야 할까요?</h2>
        <p className="desc">실제 도로 영상과 AI 기술을 결합한 운전 교육 서비스로<br />효과적인 학습이 가능합니다.</p>
      </div>
    </main>
  );
};

export default LoginPage;
