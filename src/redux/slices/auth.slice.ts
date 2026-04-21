import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';

interface AuthUser {
  id?: string;
  email?: string;
  username?: string;
  role?: string;
  [key: string]: any;
}

interface AuthState {
  accessToken: string;
  refreshToken: string;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  accessToken: '',
  refreshToken: '',
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        user?: AuthUser | null;
      }>,
    ) => {
      const { accessToken, refreshToken, user } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = Boolean(accessToken);
      // Refresh token thường chỉ trả access/refresh; nếu gán `user || null` sẽ xóa role trong Redux → mất menu streamer.
      if (user !== undefined) {
        state.user = user ?? null;
      }
    },
    setAuthUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.accessToken = '';
      state.refreshToken = '';
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setAuth, setAuthUser, logout } = authSlice.actions;

export const authSelector = (state: any) => state.auth;
export const useAuthSelector = () =>
  useSelector((state: any) => {
    return state.auth;
  });

export const authReducer = authSlice.reducer;
