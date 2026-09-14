"use client";

import { useEffect, useRef } from "react";

const NEAR_END_PX = 200;

export function useHorizontalScroll(
  amount = 400,
  onNearEnd?: () => void,
  contentKey?: number,
) {
  const ref = useRef<HTMLDivElement>(null);
  const onNearEndRef = useRef(onNearEnd);
  onNearEndRef.current = onNearEnd;

  function isNearEnd() {
    const el = ref.current;
    if (!el) return false;
    return el.scrollWidth - el.scrollLeft - el.clientWidth <= NEAR_END_PX;
  }

  function notifyNearEnd() {
    if (isNearEnd()) {
      onNearEndRef.current?.();
    }
  }

  function scroll(direction: "left" | "right") {
    ref.current?.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
    if (direction === "right") {
      window.setTimeout(notifyNearEnd, 320);
    }
  }

  useEffect(() => {
    const scroller = ref.current;
    if (!scroller) return;

    const handleScroll = () => {
      notifyNearEnd();
    };

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", handleScroll);
    };
  }, [contentKey]);

  useEffect(() => {
    notifyNearEnd();
  }, [contentKey]);

  return { ref, scroll };
}
