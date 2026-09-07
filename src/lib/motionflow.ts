"use client";

import { useEffect } from "react";
import "@slicemypage/motionflow/dist/motionflow.min.css";

export function useMotionFlow(deps: readonly unknown[]) {
  useEffect(() => {
    let frame: number | undefined;
    let cancelled = false;

    import("@slicemypage/motionflow").then((mod) => {
      if (cancelled) return;
      const MotionFlow = mod.default;
      frame = window.requestAnimationFrame(() => {
        if (!cancelled) MotionFlow.init();
      });
    });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
