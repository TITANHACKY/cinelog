"use client";

import { IconPopover } from "@/components/ui/icon-popover";
import {
  WATCH_STATUS,
  WATCH_STATUS_ICONS,
  WATCH_STATUS_INDICATOR,
  WATCH_STATUS_INDICATOR_TEXT,
} from "@/lib/constants";

type CardStatusToggleProps = {
  watchStatus: number;
  disabled?: boolean;
  loading?: boolean;
  onSelect: (watchStatus: number) => void;
  expanded?: boolean;
  showMenuLabels?: boolean;
};

export function CardStatusToggle({
  watchStatus,
  disabled = false,
  loading = false,
  onSelect,
  expanded = false,
  showMenuLabels,
}: CardStatusToggleProps) {
  const currentIndicator =
    WATCH_STATUS_INDICATOR[watchStatus] ?? WATCH_STATUS_INDICATOR[0];

  const currentOption = (
    Object.values(WATCH_STATUS) as ReadonlyArray<{
      value: number;
      display_value: string;
    }>
  ).find((option) => option.value === watchStatus) ?? WATCH_STATUS[0];

  const expandedClass =
    watchStatus === 1
      ? "bg-brand-primary-container text-white hover:bg-brand-primary-container/85"
      : watchStatus === 2
        ? "border border-status-success/40 bg-status-success/20 text-status-success hover:bg-status-success/30"
        : "border border-outline-variant bg-surface-container-high text-on-surface hover:bg-surface-container-highest";

  return (
    <IconPopover
      disabled={disabled}
      expanded={expanded}
      loading={loading}
      onSelect={onSelect}
      showMenuLabels={showMenuLabels}
      options={Object.values(WATCH_STATUS).map((option) => ({
        value: option.value,
        label: option.display_value,
        icon: WATCH_STATUS_ICONS[option.value],
        className: WATCH_STATUS_INDICATOR_TEXT[WATCH_STATUS_INDICATOR[option.value]],
      }))}
      triggerAriaLabel="Set watch status"
      triggerClassName={
        expanded
          ? expandedClass
          : WATCH_STATUS_INDICATOR_TEXT[currentIndicator]
      }
      triggerLabel={currentOption.display_value}
      value={watchStatus}
    />
  );
}
