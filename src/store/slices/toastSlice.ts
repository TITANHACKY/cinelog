import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ToastVariant = "info" | "success" | "error";

export type ToastAction = {
  label: string;
  href: string;
};

export type ToastState = {
  message: string | null;
  variant: ToastVariant;
  action?: ToastAction | null;
  duration?: number;
  key: number;
};

const initialState: ToastState = {
  message: null,
  variant: "success",
  action: null,
  duration: 3000,
  key: 0,
};

export const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    showToast: (
      state,
      action: PayloadAction<{
        message: string;
        variant?: ToastVariant;
        action?: ToastAction | null;
        duration?: number;
      }>,
    ) => {
      state.message = action.payload.message;
      state.variant = action.payload.variant ?? "success";
      state.action = action.payload.action ?? null;
      state.duration = action.payload.duration ?? 3000;
      state.key = Date.now();
    },
    hideToast: (state) => {
      state.message = null;
      state.action = null;
    },
  },
});

export const { showToast, hideToast } = toastSlice.actions;
export default toastSlice.reducer;
