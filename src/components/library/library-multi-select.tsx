"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { OPTION_HEIGHT_PX, VISIBLE_OPTIONS } from "@/lib/constants";
import type { SearchFilterOption } from "@/components/search-popup/search-filter-select";

type LibraryMultiSelectProps = {
  "aria-label"?: string;
  heading: string;
  menuMinWidth?: number;
  onChange: (values: string[]) => void;
  options: SearchFilterOption[];
  placeholder: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  triggerClassName?: string;
  values: string[];
};

export function LibraryMultiSelect({
  "aria-label": ariaLabel,
  heading,
  menuMinWidth = 224,
  onChange,
  options,
  placeholder,
  searchable = false,
  searchPlaceholder = "Filter",
  triggerClassName,
  values,
}: LibraryMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.filter((option) => values.includes(option.value));
  const triggerLabel =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0].label
        : `${selected[0].label} +${selected.length - 1}`;

  const filteredOptions = useMemo(() => {
    const normalized = filter.trim().toLowerCase();
    if (!normalized) {
      return options;
    }

    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(normalized) ||
        option.value.toLowerCase().includes(normalized),
    );
  }, [filter, options]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setFilter("");
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, menuMinWidth),
      zIndex: 80,
    });
  }, [isOpen, menuMinWidth]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [closeMenu, isOpen]);

  return (
    <>
      <span className="inline-flex" ref={triggerRef}>
        <Button
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={ariaLabel ?? placeholder}
          className={cn(
            "min-w-36 px-2.5 py-1 text-xs sm:px-3.5 sm:py-1.5 sm:text-sm",
            triggerClassName,
          )}
          onClick={() => {
            if (isOpen) {
              closeMenu();
              return;
            }
            setIsOpen(true);
          }}
          type="button"
          variant={isOpen || values.length > 0 ? "primaryFilled" : "darkFilled"}
        >
          <span>{heading}</span>
          <span className="max-w-40 truncate">{triggerLabel}</span>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </Button>
      </span>
      {isOpen
        ? createPortal(
            <div
              className="z-80 overflow-hidden rounded-xl border border-outline-alt bg-surface-container shadow-[0_8px_24px_rgb(0_0_0/25%)]"
              ref={menuRef}
              style={menuStyle}
            >
              {searchable ? (
                <div className="border-b border-outline-alt px-2 py-1.5">
                  <Input
                    aria-label={searchPlaceholder}
                    autoFocus
                    className="h-8 border-outline-alt bg-surface-container-high px-2.5 text-sm text-on-surface placeholder:text-outline-muted"
                    onChange={(event) => setFilter(event.target.value)}
                    placeholder={searchPlaceholder}
                    value={filter}
                  />
                </div>
              ) : null}
              <div
                className="movie-lists-scrollbar flex flex-col overflow-y-auto py-1.5"
                role="listbox"
                style={{ maxHeight: OPTION_HEIGHT_PX * VISIBLE_OPTIONS }}
              >
                {filteredOptions.length === 0 ? (
                  <p className="px-3.5 py-2.5 text-sm text-outline-muted">
                    No matches
                  </p>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = values.includes(option.value);
                    return (
                      <button
                        aria-selected={isSelected}
                        className={cn(
                          "inline-flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-on-surface transition-colors hover:bg-surface-container-high",
                          isSelected && "bg-surface-container-high",
                        )}
                        key={option.value}
                        onClick={() => {
                          onChange(
                            isSelected
                              ? values.filter((value) => value !== option.value)
                              : [...values, option.value],
                          );
                        }}
                        role="option"
                        type="button"
                      >
                        <span className="min-w-0 truncate font-medium">
                          {option.label}
                        </span>
                        {isSelected ? (
                          <Check className="h-4 w-4 shrink-0 text-brand-primary" />
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
