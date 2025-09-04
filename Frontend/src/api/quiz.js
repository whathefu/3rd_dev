import client from "./client";

// 모델 정의서 기준: 비디오 기반 퀴즈 API
// 비디오별 문제 목록 조회
export const getQuizzesByVideo = (videoId, limit = 20) => 
  client.get(`/quizzes/by-video/${videoId}`, { params: { limit } });

// 문제 단건 조회
export const getQuizById = (quizId) => 
  client.get(`/quizzes/${quizId}`);

// 정답 제출 (모델 정의서 구조)
export const submitAnswer = (payload) => 
  client.post("/quizzes/submit", payload);

// 기존 세션 기반 API들 (하드코딩용으로 유지)
export const createSession = ({ level, maxItems }) => 
  client.post("/quiz-sessions", { level, maxItems });

export const getDifficultySummary = () => 
  client.get("/quiz-sessions/difficulty/summary");

export const getProblemsByDifficulty = (difficulty) => 
  client.get("/quiz-sessions/difficulty", { params: { difficulty } });

export const getCurrentItem = (sessionId) => 
  client.get(`/quiz-sessions/${sessionId}/current`);

export const nextItem = (sessionId) => 
  client.post(`/quiz-sessions/${sessionId}/next`);

export const submitSessionAnswer = (sessionId, payload) => 
  client.post(`/quiz-sessions/${sessionId}/answers`, payload);

export const finishSession = (sessionId, force = false) => 
  client.post(`/quiz-sessions/${sessionId}/finish`, { force });