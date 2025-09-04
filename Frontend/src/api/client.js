// src/api/client.js (기존 파일 - 참고용으로 유지)
// 새로운 공용 api 인스턴스 사용을 권장합니다.
import axios from "axios";

const strip = (s) => (s || "").replace(/\/+$/, "");

function normalizeBase(url) {
  const raw = (url || "").trim();
  let base = raw && raw.startsWith("http") ? raw : "http://127.0.0.1:8000";
  return strip(base);
}

export const apiBaseURL = normalizeBase(import.meta.env.VITE_API_BASE_URL);

// 로드되면 1회 로그 + 전역 노출
if (typeof window !== "undefined") {
  console.log("[API] client.js loaded:", import.meta.url);
  console.log("[API] baseURL =", apiBaseURL);
  window.__API_BASE_URL__ = apiBaseURL;
}

const client = axios.create({
  baseURL: "/api/v1",  // baseURL 복원
  timeout: 5000,
  withCredentials: false,
});

// 기존 인터셉터 로직 (참고용)
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token"); // 통일된 키 사용
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;



