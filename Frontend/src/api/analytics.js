import { api } from '../services/api';

// 모델 정의서 기준: 새로운 분석 API
// 학습 요약
export const getSummary = () => api.get("/analytics/summary");

// 주간 학습 현황
export const getWeekly = (days = 7) => 
  api.get("/analytics/weekly", { params: { days } });

// 카테고리별 통계
export const getCategories = (topK = 8) => 
  api.get("/analytics/categories", { params: { top_k: topK } });

// 기존 API (하드코딩용으로 유지)
export const getAIFeedback = () => api.get("/analytics/feedback");



