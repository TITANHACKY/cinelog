"use client";

import { useEffect, useRef } from "react";

const NEAR_END_PX = 200;

function isNearEnd(el: HTMLDivElement) {
  return el.scrollWidth - el.scrollLeft - el.clientWidth <= NEAR_END_PX;
}

export function useHorizontalScroll(
  amount = 400,
  onNearEnd?: () => void,
  contentKey?: number,
) {
  const ref = useRef<HTMLDivElement>(null);
  const onNearEndRef = useRef(onNearEnd);

  useEffect(() => {
    onNearEndRef.current = onNearEnd;
  });

  function notifyNearEnd() {
    const el = ref.current;
    if (el && isNearEnd(el)) {
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
      if (isNearEnd(scroller)) {
        onNearEndRef.current?.();
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        return;
      }

      if (event.deltaY === 0) {
        return;
      }

      event.preventDefault();
      window.scrollBy({ top: event.deltaY });
    };

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    scroller.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      scroller.removeEventListener("scroll", handleScroll);
      scroller.removeEventListener("wheel", handleWheel);
    };
  }, [contentKey]);

  useEffect(() => {
    const el = ref.current;
    if (el && isNearEnd(el)) {
      onNearEndRef.current?.();
    }
  }, [contentKey]);

  return { ref, scroll };
}
