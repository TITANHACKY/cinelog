import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { LoginInput, SignupInput } from "@/lib/validations/auth";

export type User = {
  id: number;
  username: string;
  email?: string;
  displayName?: string | null;
  hasCompletedOnboarding?: boolean;
};

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  status: "idle",
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginRequest: (state, action: PayloadAction<LoginInput>) => {
      void action;
      state.status = "loading";
      state.error = null;
    },
    signupRequest: (state, action: PayloadAction<SignupInput>) => {
      void action;
      state.status = "loading";
      state.error = null;
    },
    authSuccess: (state, action: PayloadAction<{ user: User }>) => {
      state.status = "succeeded";
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.error = null;
    },
    userUpdated: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user;
    },
    authFailure: (state, action: PayloadAction<string>) => {
      state.status = "failed";
      state.error = action.payload;
    },
    logoutRequest: (state) => {
      state.status = "loading";
    },
    logoutSuccess: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.status = "idle";
      state.error = null;
    },
    initAuthRequest: (state) => {
      state.status = "loading";
    },
    initAuthFailure: (state) => {
      state.status = "idle"; // Usually failing init just means they are logged out
    },
  },
});

export const {
  loginRequest,
  signupRequest,
  authSuccess,
  userUpdated,
  authFailure,
  logoutRequest,
  logoutSuccess,
  initAuthRequest,
  initAuthFailure,
} = authSlice.actions;

export default authSlice.reducer;
