// src/store/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  login  as loginApi,
  me     as meApi,
  logout as logoutApi,
} from '../services/api';

// 로그인 비동기 액션
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      console.log('Login attempt:', { email });

      // 1) 로그인 요청
      console.log('로그인 API 호출 시작...');
      const res = await loginApi({ email, password });
      console.log('로그인 API 호출 완료');

      // 디버깅: 전체 응답 구조 확인
      console.log('로그인 응답 전체:', res);
      console.log('응답 타입:', typeof res);
      console.log('응답 키들:', Object.keys(res || {}));
      
      // 백엔드 수정 확인을 위한 상세 로그
      console.log('=== 백엔드 응답 분석 ===');
      console.log('1. 전체 응답:', JSON.stringify(res, null, 2));
      console.log('2. 사용자 정보 존재 여부:', {
        hasUser: !!res?.user,
        hasUserInfo: !!res?.userInfo,
        hasUser_info: !!res?.user_info,
        hasAccessToken: !!res?.accessToken,
        hasAccess_token: !!res?.access_token
      });
      console.log('========================');
      
      // 추가 디버깅: 응답이 null/undefined인지 확인
      if (!res) {
        console.error('로그인 응답이 null/undefined입니다.');
        throw new Error('로그인 응답이 없습니다.');
      }

      // 2) 토큰 저장 (모든 가능한 응답 구조 시도)
      let token = null;
      
      // 구조 1: res.accessToken
      if (res?.accessToken) {
        token = res.accessToken;
        console.log('토큰 발견: res.accessToken');
      }
      // 구조 2: res.access_token
      else if (res?.access_token) {
        token = res.access_token;
        console.log('토큰 발견: res.access_token');
      }
      // 구조 3: res.token
      else if (res?.token) {
        token = res.token;
        console.log('토큰 발견: res.token');
      }

      if (!token) {
        console.error('토큰을 받지 못했습니다. 응답:', res);
        console.error('응답 구조:', {
          res: res,
          resData: res?.data,
          resDataAccessToken: res?.data?.access_token,
          resDataAccessTokenAlt: res?.data?.accessToken,
          resDataToken: res?.data?.token,
          resAccessToken: res?.access_token,
          resAccessTokenAlt: res?.accessToken,
          resToken: res?.token
        });
        throw new Error('토큰을 받지 못했습니다.');
      }
      
      console.log('토큰 저장:', token.substring(0, 20) + '...');
      // access_token만 사용
      localStorage.setItem('access_token', token);
      
      // 토큰 디코딩 시도
      
      // 토큰 디코딩 시도
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('토큰 페이로드:', payload);
      } catch (e) {
        console.log('토큰 디코딩 실패:', e);
      }
      
      // 디버깅: 저장된 토큰 확인
      console.log('저장된 토큰 확인:', {
        access_token: localStorage.getItem('access_token'),
        tokenLength: token.length
      });

      // 3) 내 정보 조회 (백엔드 문제로 실패할 경우를 대비해 로그인 응답에서 사용자 정보 추출)
      try {
        const user = await dispatch(fetchUserInfo()).unwrap();
        return user; // fulfilled payload = user
      } catch (e) {
        console.error('사용자 정보 가져오기 실패:', e);
        
        // 백엔드 문제로 사용자 정보를 가져올 수 없는 경우, 로그인 응답에서 사용자 정보 추출 시도
        console.log('로그인 응답에서 사용자 정보 추출 시도...');
        console.log('res:', res);
        
        // 다양한 사용자 정보 위치 시도
        const userInfo = res?.user || 
                        res?.userInfo || 
                        res?.user_info;
        
        if (userInfo) {
          console.log('로그인 응답에서 사용자 정보 추출 성공:', userInfo);
          return userInfo;
        }
        
        // 사용자 정보가 없는 경우, 백엔드 문제임을 명시
        console.error('❌ 백엔드에서 사용자 정보를 반환하지 않습니다.');
        console.error('❌ 백엔드 개발자에게 토큰 검증 로직을 확인해주세요.');
        
        // 토큰에서 기본 사용자 정보 생성
        console.log('토큰에서 기본 사용자 정보 생성...');
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const tempUser = {
            id: payload.sub,
            email: email, // 로그인 시 사용한 이메일
            name: email.split('@')[0], // 이메일에서 이름 추출
            username: email.split('@')[0],
            isTempUser: true // 임시 사용자임을 표시
          };
          console.log('토큰에서 생성된 임시 사용자 정보:', tempUser);
          return tempUser;
        } catch (e) {
          console.log('토큰 디코딩 실패:', e);
          // 최후의 수단으로 기본 사용자 정보 생성
          const fallbackUser = {
            id: 'temp-user-id',
            email: email,
            name: email.split('@')[0],
            username: email.split('@')[0],
            isTempUser: true
          };
          console.log('최후 수단으로 생성된 사용자 정보:', fallbackUser);
          return fallbackUser;
        }
      }
    } catch (error) {
      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        '로그인에 실패했습니다.';
      console.error('로그인 에러:', detail);
      return rejectWithValue({ detail });
    }
  }
);

// 로그아웃 비동기 액션
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // 서버 로그아웃(있으면) 호출
      try {
        await logoutApi();
      } catch {
        // 서버에 로그아웃 엔드포인트가 없어도 클라이언트 상태만 정리해도 됨
      }
      localStorage.removeItem('access_token');
      
      // 명시적으로 로그인 페이지로 리다이렉트
      window.location.href = '/login';
      
      return null;
    } catch (error) {
      console.error('로그아웃 에러:', error);
      return rejectWithValue(error?.response?.data);
    }
  }
);

// 사용자 정보 가져오기 비동기 액션
export const fetchUserInfo = createAsyncThunk(
  'auth/fetchUserInfo',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching user info...');
      const user = await meApi();
      console.log('User info fetched:', user);
      return user;
    } catch (error) {
      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        '사용자 정보를 불러오는 중 오류가 발생했습니다.';
      console.error('사용자 정보 가져오기 에러:', detail);
      
      // 401 에러 시 임시 사용자 정보 반환
      if (error.response?.status === 401) {
        console.log('401 에러 발생 - 임시 사용자 정보 생성');
        const token = localStorage.getItem('access_token');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const tempUser = {
              id: payload.sub || 'temp-user-id',
              email: 'temp@example.com',
              name: '임시 사용자',
              username: 'temp_user',
              isTempUser: true
            };
            console.log('임시 사용자 정보 생성됨:', tempUser);
            return tempUser;
          } catch (e) {
            console.log('토큰 디코딩 실패:', e);
          }
        }
      }
      
      return rejectWithValue(detail);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // ---- 로그인 ----
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload?.detail || '로그인에 실패했습니다.';
    });

    // ---- 로그아웃 ----
    builder.addCase(logout.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(logout.fulfilled, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
    });
    builder.addCase(logout.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || '로그아웃에 실패했습니다.';
    });

    // ---- 사용자 정보 ----
    builder.addCase(fetchUserInfo.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchUserInfo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    });
    builder.addCase(fetchUserInfo.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload || '사용자 정보를 불러오는 중 오류가 발생했습니다.';
    });
  },
});

export default authSlice.reducer;




