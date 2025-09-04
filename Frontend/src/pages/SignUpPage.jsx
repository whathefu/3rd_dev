import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, login as loginApi } from '../services/api';
import './SignUpPage.css';

function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(phone)) {
      alert('전화번호 형식이 올바르지 않습니다. 예: 010-1234-5678');
      return;
    }

    setLoading(true);
    try {
      // 1) 회원가입 - 모델 정의서 기준 필드명 사용
      const res = await apiService.signup({
        name,
        email,
        password, // 백엔드에서 password_hash로 변환
        phone,
        birth_date: new Date(birthDate).toISOString().split('T')[0], // birthDate → birth_date
      });

      // 2) 토큰 확보(응답에 있으면 저장)
      let token =
        res?.access_token || res?.token || res?.data?.access_token || res?.data?.token;

      // 3) 없으면 즉시 로그인해서 토큰 받기
      if (!token) {
        const loginRes = await loginApi({ email, password });
        token =
          loginRes?.access_token || loginRes?.token || loginRes?.data?.access_token || loginRes?.data?.token;
      }

      if (token) {
        localStorage.setItem('access_token', token);
      }
      localStorage.setItem('last_email', email);

      alert('회원가입 완료!');
      navigate('/'); // 보호 라우트 통과 → 홈
    } catch (error) {
      console.error('회원가입 실패:', error);
      alert(error?.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const handleLoginRedirect = () => navigate('/login');

  return (
    <div className="signup-container">
      <div className="signup-header">
        <h1>AI Go</h1>
        <p>서비스 이용을 위해 회원가입 해주세요.</p>
      </div>
      <div className="signup-form-wrapper">
        <form className="signup-form" onSubmit={handleSignUp}>
          <div className="input-group">
            <input type="text" placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <input
              type="tel"
              placeholder="전화번호 (예: 010-1234-5678)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              pattern="010-[0-9]{4}-[0-9]{4}"
              required
            />
          </div>
          <div className="input-group">
            <input type="date" placeholder="생년월일" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
          </div>
          <div className="input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className="password-toggle" onClick={togglePasswordVisibility}>
              {showPassword ? '숨기기' : '보기'}
            </button>
          </div>
          <div className="input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '처리 중…' : '회원가입'}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        이미 계정이 있으신가요?{' '}
        <button type="button" className="signup-btn" onClick={handleLoginRedirect}>
          로그인
        </button>
      </div>
    </div>
  );
}

export default SignUpPage;



// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { api } from '../services/api';
// import './SignUpPage.css';

// function SignUpPage() {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [phone, setPhone] = useState('');
//   const [birthDate, setBirthDate] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const navigate = useNavigate();

//   const handleSignUp = async (e) => {
//     e.preventDefault();
    
//     if (password !== confirmPassword) {
//       alert('비밀번호가 일치하지 않습니다.');
//       return;
//     }

//     // 전화번호 형식 검증
//     const phoneRegex = /^010-\d{4}-\d{4}$/;
//     if (!phoneRegex.test(phone)) {
//       alert('전화번호 형식이 올바르지 않습니다. 예: 010-1234-5678');
//       return;
//     }

//     try {
//       await api.signup({
//         name,
//         email,
//         password,
//         phone,
//         birthDate: new Date(birthDate).toISOString().split('T')[0] // ISO 날짜 형식으로 변환
//       });
//       alert('회원가입 성공!');
//       navigate('/login');
//     } catch (error) {
//       console.error('회원가입 실패:', error);
//       alert(error.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
//     }
//   };

//   const togglePasswordVisibility = () => {
//     setShowPassword(!showPassword);
//   };

//   const handleLoginRedirect = () => {
//     navigate('/login');
//   };

//   return (
//     <div className="signup-container">
//       <div className="signup-header">
//         <h1>AI Go</h1>
//         <p>서비스 이용을 위해 로그인 해주세요.</p>
//       </div>
//       <div className="signup-form-wrapper">
//         <form className="signup-form" onSubmit={handleSignUp}>
//           <div className="input-group">
//             <input 
//               type="text" 
//               placeholder="이름" 
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               required 
//             />
//           </div>
//           <div className="input-group">
//             <input 
//               type="email" 
//               placeholder="이메일" 
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required 
//             />
//           </div>
//           <div className="input-group">
//             <input 
//               type="tel" 
//               placeholder="전화번호 (예: 010-1234-5678)" 
//               value={phone}
//               onChange={(e) => setPhone(e.target.value)}
//               pattern="010-[0-9]{4}-[0-9]{4}"
//               required 
//             />
//           </div>
//           <div className="input-group">
//             <input 
//               type="date" 
//               placeholder="생년월일" 
//               value={birthDate}
//               onChange={(e) => setBirthDate(e.target.value)}
//               required 
//             />
//           </div>
//           <div className="input-group">
//             <input 
//               type={showPassword ? "text" : "password"} 
//               placeholder="비밀번호" 
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required 
//             />
//             <button 
//               type="button" 
//               className="password-toggle"
//               onClick={togglePasswordVisibility}
//             >
//               {showPassword ? '숨기기' : '보기'}
//             </button>
//           </div>
//           <div className="input-group">
//             <input 
//               type={showPassword ? "text" : "password"} 
//               placeholder="비밀번호 확인" 
//               value={confirmPassword}
//               onChange={(e) => setConfirmPassword(e.target.value)}
//               required 
//             />
//           </div>
//           <button type="submit" className="submit-btn">회원가입</button>
//         </form>
//       </div>
//       <div className="signup-link">
//         이미 계정이 있으신가요? <a href="/login" onClick={(e) => {
//           e.preventDefault();
//           handleLoginRedirect();
//         }}>로그인</a>
//       </div>
//     </div>
//   );
// }

// export default SignUpPage;


