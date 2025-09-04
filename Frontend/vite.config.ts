// vite.config.ts (권장)
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useMock = env.VITE_USE_MOCK === "true";
  const PROXY_TARGET = env.VITE_PROXY_TARGET || "http://192.168.101.210:8000";

  return {
    plugins: [react()],
    server: {
      port: 3005,
      strictPort: true,
      proxy: useMock
        ? undefined
        : {
            "/api/v1": {
              target: PROXY_TARGET,
              changeOrigin: true,
              // ❌ rewrite 금지: '/api/v1' 그대로 유지해야 백엔드의 prefix와 매칭됩니다.
            },
          },
    },
  };
});




// // vite.config.ts
// import { defineConfig, loadEnv } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig(({ mode }) => {
//   const env = loadEnv(mode, process.cwd(), "");
//   const useMock = env.VITE_USE_MOCK === "true";

//   // 🔹 프록시 타겟은 별도 변수로 분리 (중요)
//   const PROXY_TARGET = env.VITE_PROXY_TARGET || "http://127.0.0.1:8000";

//   return {
//     plugins: [react()],
//     server: {
//       port: 3005,
//       strictPort: true,
//       proxy: useMock
//         ? undefined
//         : {
//             "/api/v1": {
//               target: PROXY_TARGET,
//               changeOrigin: true,
//               rewrite: (path) => path.replace(/^\/api\/v1/, '')  // rewrite 복원
//             },
//           },
//     },
//   };
// });




