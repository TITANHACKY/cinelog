import type { LoginInput, SignupInput } from "@/lib/validations/auth";
import { purgeNavigationCacheOnLogout } from "@/lib/pwa/service-worker-client";
import { baseApi } from "@/store/api/base-api";
import type { User } from "@/store/slices/authSlice";

function redirectAfterAuth(user: User) {
  window.location.replace(user.hasCompletedOnboarding ? "/" : "/onboarding");
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    me: build.query<{ user: User }, void>({
      query: () => ({ url: "/api/auth/me" }),
      providesTags: ["Me"],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const pathname = window.location.pathname;
          if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
            redirectAfterAuth(data.user);
          }
        } catch {
          const pathname = window.location.pathname;
          if (
            pathname !== "/" &&
            !pathname.startsWith("/login") &&
            !pathname.startsWith("/signup")
          ) {
            window.location.replace("/login");
          }
        }
      },
    }),
    login: build.mutation<{ user: User }, LoginInput>({
      query: (body) => ({ url: "/api/auth/login", method: "POST", body }),
      invalidatesTags: ["Me"],
      async onQueryStarted(_arg, { queryFulfilled }) {
        const { data } = await queryFulfilled;
        redirectAfterAuth(data.user);
      },
    }),
    signup: build.mutation<{ user: User }, SignupInput>({
      query: (body) => ({ url: "/api/auth/signup", method: "POST", body }),
      invalidatesTags: ["Me"],
      async onQueryStarted(_arg, { queryFulfilled }) {
        const { data } = await queryFulfilled;
        redirectAfterAuth(data.user);
      },
    }),
    logout: build.mutation<{ success: boolean }, void>({
      query: () => ({ url: "/api/auth/logout", method: "POST" }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          // Leave the session on the client even if the request fails.
        }
        purgeNavigationCacheOnLogout();
        dispatch(baseApi.util.resetApiState());
        window.location.replace("/login");
      },
    }),
  }),
});

export const {
  useMeQuery,
  useLoginMutation,
  useSignupMutation,
  useLogoutMutation,
} = authApi;
