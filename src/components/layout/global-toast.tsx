"use client";

import { useAppDispatch, useAppSelector } from "@/store";
import { hideToast } from "@/store/slices/toastSlice";
import { Toast } from "@/components/ui/toast";

export function GlobalToast() {
  const dispatch = useAppDispatch();
  const { message, variant, action, duration, key } = useAppSelector(
    (state) => state.toast,
  );

  if (!message) return null;

  return (
    <Toast
      action={action}
      duration={duration}
      key={key}
      message={message}
      onDismiss={() => dispatch(hideToast())}
      variant={variant}
    />
  );
}
