import api from "./client";

// 모델 정의서 기준: 새로운 오답노트 API
// 오답 목록 조회 (API 명세서: 파라미터 없음)
export const getWrongNotes = () => api.get("/wrong-notes");

// 오답 저장
export const saveWrongNote = (quizId) => 
  api.post("/wrong-notes", null, { params: { quiz_id: quizId } });

// 오답 상세 조회
export const getWrongNoteById = (wrongNoteId) => 
  api.get(`/wrong-notes/${wrongNoteId}`);

// 기존 API들 (하드코딩용으로 유지)
export const saveWrongNotes = (payload) =>
  api.post("/wrong-notes", payload);

export const listWrongNotes = ({ page = 1, size = 10, level } = {}) =>
  api.get("/wrong-notes", { params: { page, size, level } });

export const getWrongNote = (itemId) =>
  api.get(`/wrong-notes/${itemId}`);

export const deleteWrongNote = (itemId) =>
  api.delete(`/wrong-notes/${itemId}`);


