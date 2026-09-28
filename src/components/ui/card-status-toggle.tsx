"use client";

import { IconPopover } from "@/components/ui/icon-popover";
import {
  WATCH_STATUS,
  WATCH_STATUS_ICONS,
  WATCH_STATUS_INDICATOR,
  WATCH_STATUS_INDICATOR_TEXT,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

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

  const currentOption =
    (
      Object.values(WATCH_STATUS) as ReadonlyArray<{
        value: number;
        display_value: string;
      }>
    ).find((option) => option.value === watchStatus) ?? WATCH_STATUS[0];

  const expandedClass = cn(
    "border border-current/30 bg-current/10 hover:bg-current/20",
    WATCH_STATUS_INDICATOR_TEXT[currentIndicator],
  );

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
        className:
          WATCH_STATUS_INDICATOR_TEXT[WATCH_STATUS_INDICATOR[option.value]],
      }))}
      triggerAriaLabel="Set watch status"
      triggerClassName={
        expanded ? expandedClass : WATCH_STATUS_INDICATOR_TEXT[currentIndicator]
      }
      triggerLabel={currentOption.display_value}
      value={watchStatus}
    />
  );
}
