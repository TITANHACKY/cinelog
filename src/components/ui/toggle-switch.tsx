import { cn } from "@/lib/utils";

type ToggleSwitchProps = {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  title?: string;
};

export function ToggleSwitch({
  checked,
  disabled = false,
  onChange,
  title,
}: ToggleSwitchProps) {
  return (
    <button
      aria-checked={checked}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer",
        checked ? "bg-brand-primary" : "bg-surface-container-high",
      )}
      disabled={disabled}
      onClick={onChange}
      role="switch"
      title={title}
      type="button"
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}
