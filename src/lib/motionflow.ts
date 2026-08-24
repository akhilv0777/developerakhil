"use client";

import { useEffect } from "react";
import "@slicemypage/motionflow/dist/motionflow.min.css";

export function useMotionFlow(deps: readonly unknown[]) {
  useEffect(() => {
    let frame: number;
    import("@slicemypage/motionflow").then((mod) => {
      const MotionFlow = mod.default;
      frame = window.requestAnimationFrame(() => {
        MotionFlow.init();
      });
    });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
