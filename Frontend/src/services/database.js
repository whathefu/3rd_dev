import { api } from '../services/api';

/**
 * Video API - 영상 목록 조회 (모델 정의서 기준)
 */
export const getVideosByDifficulty = async (difficulty) => {
  try {
    const response = await api.get(`/videos`, { 
      params: { 
        difficulty: difficulty
      } 
    });
    return response.data;
  } catch (error) {
    console.error('영상 조회 오류:', error);
    throw error;
  }
};

/**
 * Video API - 영상 상세 조회 (모델 정의서 기준)
 */
export const getVideoById = async (videoId) => {
  try {
    const response = await api.get(`/videos/${videoId}`);
    return response.data;
  } catch (error) {
    console.error('영상 상세 조회 오류:', error);
    throw error;
  }
};

/**
 * Quiz API - 비디오별 퀴즈 조회 (모델 정의서 기준)
 */
export const getQuizzesByVideoId = async (videoId, limit = 20) => {
  try {
    const response = await api.get(`/quizzes/by-video/${videoId}`, { 
      params: { limit } 
    });
    return response.data;
  } catch (error) {
    console.error('퀴즈 조회 오류:', error);
    throw error;
  }
};

/**
 * Quiz API - 퀴즈 단건 조회 (모델 정의서 기준)
 */
export const getQuizById = async (quizId) => {
  try {
    const response = await api.get(`/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    console.error('퀴즈 단건 조회 오류:', error);
    throw error;
  }
};

/**
 * Quiz API - 정답 제출 (모델 정의서 기준)
 */
export const submitAnswer = async (payload) => {
  try {
    // 모델 정의서 구조: { quiz_id, selected_label, quiz_set_no, time_spent_sec }
    const response = await api.post('/quizzes/submit', payload);
    return response.data;
  } catch (error) {
    console.error('정답 제출 오류:', error);
    throw error;
  }
};

/**
 * Wrong Notes API - 오답 저장 (모델 정의서 기준)
 */
export const saveWrongNote = async (quizId) => {
  try {
    const response = await api.post('/wrong-notes', null, { 
      params: { quiz_id: quizId } 
    });
    return response.data;
  } catch (error) {
    console.error('오답 저장 오류:', error);
    throw error;
  }
};

/**
 * Wrong Notes API - 오답노트 조회 (모델 정의서 기준)
 */
export const getWrongNotes = async () => {
  try {
    // API 명세서: 파라미터 없음
    const response = await api.get('/wrong-notes');
    return response.data;
  } catch (error) {
    console.error('오답노트 조회 오류:', error);
    throw error;
  }
};

/**
 * Wrong Notes API - 오답 상세 조회 (모델 정의서 기준)
 */
export const getWrongNoteById = async (wrongNoteId) => {
  try {
    const response = await api.get(`/wrong-notes/${wrongNoteId}`);
    return response.data;
  } catch (error) {
    console.error('오답 상세 조회 오류:', error);
    throw error;
  }
};

/**
 * Analytics API - 학습 요약 (모델 정의서 기준)
 */
export const getAnalyticsSummary = async () => {
  try {
    const response = await api.get('/analytics/summary');
    return response.data;
  } catch (error) {
    console.error('학습 요약 조회 오류:', error);
    throw error;
  }
};

/**
 * Analytics API - 주간 학습 현황 (모델 정의서 기준)
 */
export const getAnalyticsWeekly = async (days = 7) => {
  try {
    const response = await api.get('/analytics/weekly', { 
      params: { days } 
    });
    return response.data;
  } catch (error) {
    console.error('주간 학습 현황 조회 오류:', error);
    throw error;
  }
};

/**
 * Analytics API - 카테고리별 통계 (모델 정의서 기준)
 */
export const getAnalyticsCategories = async (topK = 8) => {
  try {
    const response = await api.get('/analytics/categories', { 
      params: { top_k: topK } 
    });
    return response.data;
  } catch (error) {
    console.error('카테고리별 통계 조회 오류:', error);
    throw error;
  }
};

// 기존 세션 기반 API들 (하드코딩용으로 유지)
/**
 * Quiz API - 퀴즈 세션 생성 (기존 구조 유지)
 */
export const createQuizSession = async (level, maxItems = 10) => {
  try {
    const response = await api.post('/quiz-sessions', {
      level: level === 3 ? 'easy' : level === 2 ? 'medium' : 'hard',
      maxItems
    });
    return response.data;
  } catch (error) {
    console.error('퀴즈 세션 생성 오류:', error);
    throw error;
  }
};

/**
 * Quiz API - 현재 문제 조회 (기존 구조 유지)
 */
export const getCurrentQuestion = async (sessionId) => {
  try {
    const response = await api.get(`/quiz-sessions/${sessionId}/current`);
    return response.data;
  } catch (error) {
    console.error('현재 문제 조회 오류:', error);
    throw error;
  }
};

/**
 * Quiz API - 다음 문제로 이동 (기존 구조 유지)
 */
export const nextQuestion = async (sessionId) => {
  try {
    const response = await api.post(`/quiz-sessions/${sessionId}/next`);
    return response.data;
  } catch (error) {
    console.error('다음 문제 이동 오류:', error);
    throw error;
  }
};

/**
 * Quiz API - 세션 종료 (기존 구조 유지)
 */
export const finishSession = async (sessionId) => {
  try {
    const response = await api.post(`/quiz-sessions/${sessionId}/finish`);
    return response.data;
  } catch (error) {
    console.error('세션 종료 오류:', error);
    throw error;
  }
};

// 기존 API들 (하드코딩용으로 유지)
export const saveWrongNotes = async (body) => {
  try {
    const response = await api.post('/wrong-notes', body);
    return response.data;
  } catch (error) {
    console.error('오답노트 저장 오류:', error);
    throw error;
  }
};

export const fetchWrongNotes = async (params) => {
  try {
    const response = await api.get('/wrong-notes', { params });
    return response.data;
  } catch (error) {
    console.error('오답노트 조회 오류:', error);
    throw error;
  }
};

export const fetchWrongNoteDetail = async (itemId) => {
  try {
    const response = await api.get(`/wrong-notes/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('오답노트 상세 조회 오류:', error);
    throw error;
  }
};

export const deleteWrongNote = async (itemId) => {
  try {
    const response = await api.delete(`/wrong-notes/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('오답노트 삭제 오류:', error);
    throw error;
  }
};

export const getAnalyticsFeedback = async () => {
  try {
    const response = await api.get('/analytics/feedback');
    return response.data;
  } catch (error) {
    console.error('학습 피드백 조회 오류:', error);
    throw error;
  }
};

// 기존 함수들 (하드코딩용으로 유지)
export const getUserStats = getAnalyticsSummary;




