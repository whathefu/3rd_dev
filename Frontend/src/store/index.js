import { configureStore, createSlice } from '@reduxjs/toolkit';
import authReducer from './authSlice';

const initialState = {
  user: null, // 로그인하지 않은 상태로 초기화
  stats: { 
    quizzes: 47, 
    accuracy: 89, 
    streakDays: 12, 
    studyHours: 24 
  }
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('app_state_v1', JSON.stringify(state));
    },
    updateStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
      localStorage.setItem('app_state_v1', JSON.stringify(state));
    },
    logout: (state) => {
      state.user = null;
      localStorage.removeItem('app_state_v1');
    }
  }
});

export const { setUser, updateStats, logout } = appSlice.actions;

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
    auth: authReducer  // authSlice 추가
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false
    })
});

// 로컬 스토리지에서 상태 복원
const savedState = localStorage.getItem('app_state_v1');
if (savedState) {
  try {
    const parsedState = JSON.parse(savedState);
    store.dispatch(setUser(parsedState.user));
    store.dispatch(updateStats(parsedState.stats));
  } catch (error) {
    console.error('상태 복원 중 오류:', error);
  }
}

export default store;
