// src/services/api.js
import axios from 'axios';

// 공용 axios 인스턴스 생성
export const api = axios.create({
  baseURL: 'http://192.168.101.210:8000/api/v1',
});

// 여러 저장소를 차례대로 확인해서 토큰을 찾아옵니다.
function getToken() {
  // 백엔드와 협의된 access_token만 사용
  return localStorage.getItem('access_token') || null;
}

// 요청마다 Authorization 자동 주입
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    // 토큰 만료 확인
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && currentTime >= payload.exp) {
        console.log('[API] 토큰이 만료되었습니다. 토큰 제거 중...');
        localStorage.removeItem('access_token');
        // 토큰 만료 시 로그인 페이지로 리다이렉트
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(new Error('토큰이 만료되었습니다.'));
      }
    } catch (e) {
      console.log('[API] 토큰 디코딩 실패:', e);
    }
    
    // Bearer 형식 사용 (표준 JWT 인증)
    config.headers.Authorization = `Bearer ${token}`;
    
    console.log('[API] Token attached to request:', config.url, 'Token:', token.substring(0, 20) + '...');
    console.log('[API] Authorization header:', config.headers.Authorization);
    
    // 토큰 전송 확인을 위한 상세 로그
    console.log('[API] 토큰 전송 상세 정보:', {
      url: config.url,
      method: config.method,
      tokenLength: token.length,
      tokenStart: token.substring(0, 20) + '...',
      tokenEnd: '...' + token.substring(token.length - 10),
      fullHeader: config.headers.Authorization
    });
  } else {
    delete config.headers.Authorization;
    console.log('[API] No token found for request:', config.url);
  }
  
  // 디버깅: 전체 요청 정보 로그
  console.log('[API] Full request config:', {
    url: config.url,
    method: config.method,
    headers: config.headers,
    hasToken: !!token,
    fullUrl: config.baseURL + config.url
  });
  
  return config;
});

// 응답 인터셉터 추가 - 403 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      console.log('[API] 403 Forbidden 에러 발생. 토큰을 제거하고 로그인 페이지로 리다이렉트합니다.');
      localStorage.removeItem('access_token');
      
      // 현재 페이지가 로그인 페이지가 아닌 경우에만 리다이렉트
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/* -------------------- User -------------------- */
export const signup = (body) => {
  console.log('[API] 회원가입 요청 데이터:', body);
  return api.post('/users/register', body).then(r => r.data);
};

export const login = (body) => {
  console.log('[API] 로그인 요청 데이터:', body);
  console.log('[API] 로그인 요청 URL:', '/users/login');
  console.log('[API] 로그인 요청 전체 URL:', 'http://192.168.101.210:8000/api/v1/users/login');
  return api.post('/users/login', body).then(r => {
    console.log('[API] 로그인 응답 전체:', r);
    console.log('[API] 로그인 응답 데이터:', r.data);
    return r.data;
  }).catch(error => {
    console.error('[API] 로그인 에러 상세 정보:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      config: error.config,
      message: error.message
    });
    throw error;
  });
};

export const me = () => {
  console.log('[API] 사용자 정보 조회 요청');
  return api.get('/users/me').then(r => r.data);
};

export const logout = () => api.post('/users/logout').then(r => r.data);

/* -------------------- Video -------------------- */
export const createVideo = (body) => api.post('/videos', body).then(r => r.data);
export const getVideos = (params) => api.get('/videos', { params }).then(r => r.data);
export const getVideoById = (videoId) => api.get(`/videos/${videoId}`).then(r => r.data);

/* -------------------- Quiz -------------------- */
export const getQuizzesByVideo = (videoId, limit) => api.get(`/quizzes/by-video/${videoId}`, { params: { limit } }).then(r => r.data);
export const getQuizById = (quizId) => api.get(`/quizzes/${quizId}`).then(r => r.data);
export const submitAnswer = (body) => api.post('/quizzes/submit', body).then(r => r.data);

/* -------------------- Wrong Notes -------------------- */
export const getWrongNotes = () => api.get('/wrong-notes').then(r => r.data);
export const saveWrongNote = (quizId) => api.post('/wrong-notes', null, { params: { quiz_id: quizId } }).then(r => r.data);
export const getWrongNoteById = (wrongNoteId) => api.get(`/wrong-notes/${wrongNoteId}`).then(r => r.data);

/* -------------------- Analytics -------------------- */
export const getAnalyticsSummary = () => api.get('/analytics/summary').then(r => r.data);
export const getAnalyticsWeekly = (days) => api.get('/analytics/weekly', { params: { days } }).then(r => r.data);
export const getAnalyticsCategories = (topK) => api.get('/analytics/categories', { params: { top_k: topK } }).then(r => r.data);

/* default export */
const apiService = {
  signup, login, me, logout,
  createVideo, getVideos, getVideoById,
  getQuizzesByVideo, getQuizById, submitAnswer,
  getWrongNotes, saveWrongNote, getWrongNoteById,
  getAnalyticsSummary, getAnalyticsWeekly, getAnalyticsCategories,
};

export default apiService;
export { apiService };
