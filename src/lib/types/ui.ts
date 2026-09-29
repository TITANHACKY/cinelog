type BadgeIndicator = "success" | "info" | "error" | "accentAlt";

type ToastAction = {
  label: string;
  href: string;
};

type ToastProps = {
  message: string;
  onDismiss: () => void;
  duration?: number;
  variant?: "info" | "success" | "error";
  action?: ToastAction | null;
};

export type { BadgeIndicator, ToastAction, ToastProps };
