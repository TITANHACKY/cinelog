import { createSlice } from "@reduxjs/toolkit";
import { authApi } from "@/store/api/auth-api";
import { userApi } from "@/store/api/user-api";

export type User = {
  id: number;
  username: string;
  email?: string;
  displayName?: string | null;
  hasCompletedOnboarding?: boolean;
  smartCollectionsEnabled?: boolean;
};

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  status: "idle",
};

function setSession(
  state: AuthState,
  user: User,
) {
  state.status = "succeeded";
  state.user = user;
  state.isAuthenticated = true;
}

function clearSession(state: AuthState) {
  state.user = null;
  state.isAuthenticated = false;
  state.status = "idle";
}

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addMatcher(authApi.endpoints.me.matchPending, (state) => {
        state.status = "loading";
      })
      .addMatcher(authApi.endpoints.me.matchFulfilled, (state, action) => {
        setSession(state, action.payload.user);
      })
      .addMatcher(authApi.endpoints.me.matchRejected, (state) => {
        clearSession(state);
      })
      .addMatcher(authApi.endpoints.login.matchFulfilled, (state, action) => {
        setSession(state, action.payload.user);
      })
      .addMatcher(authApi.endpoints.signup.matchFulfilled, (state, action) => {
        setSession(state, action.payload.user);
      })
      .addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
        clearSession(state);
      })
      .addMatcher(authApi.endpoints.logout.matchRejected, (state) => {
        clearSession(state);
      })
      .addMatcher(userApi.endpoints.updateProfile.matchFulfilled, (state, action) => {
        state.user = action.payload.user;
      });
  },
});

export default authSlice.reducer;
