import client from "./client";

// 비디오 생성
export const createVideo = (payload) => 
  client.post("/videos", payload);

// 비디오 목록 조회
export const getVideos = (params = {}) => 
  client.get("/videos", { params });

// 비디오 상세 조회
export const getVideoById = (videoId) => 
  client.get(`/videos/${videoId}`);

// 기존 API들 (하드코딩용으로 유지)
export const getVideoQuestions = (videoId) => 
  client.get(`/videos/${videoId}/question`);

export const updateVideoUrl = (videoId, youtubeUrl) => 
  client.put(`/videos/${videoId}/url`, { url: youtubeUrl });

export const bulkUpdateVideoUrls = (urlUpdates) => 
  client.post("/videos/bulk-url-update", { updates: urlUpdates });
