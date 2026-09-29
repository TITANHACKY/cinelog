"use client";

import { useCallback } from "react";
import { apiErrorMessage } from "@/store/api/base-api";
import { useUpdateProfileMutation } from "@/store/api/user-api";
import { useAppDispatch, useAppSelector } from "@/store";
import { showToast } from "@/store/slices/toastSlice";

export function useDiscoverRowsToggle() {
  const dispatch = useAppDispatch();
  const enabled = useAppSelector(
    (state) => state.auth.user?.discoverRowsEnabled !== false,
  );
  const [updateProfile, { isLoading: isToggling }] = useUpdateProfileMutation();

  const toggle = useCallback(async () => {
    const next = !enabled;
    try {
      // authSlice picks up the returned user via updateProfile.matchFulfilled.
      await updateProfile({ discoverRowsEnabled: next }).unwrap();
      dispatch(
        showToast({
          message: next
            ? "Recommended rows turned on."
            : "Recommended rows turned off.",
          variant: "success",
        }),
      );
    } catch (error) {
      dispatch(
        showToast({
          message: apiErrorMessage(
            error,
            "Failed to update recommended rows setting.",
          ),
          variant: "error",
        }),
      );
    }
  }, [dispatch, enabled, updateProfile]);

  return { enabled, isToggling, toggle };
}
