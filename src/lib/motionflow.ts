"use client";

import { useEffect } from "react";
import "@slicemypage/motionflow/dist/motionflow.min.css";

export function useMotionFlow(deps: readonly unknown[]) {
  useEffect(() => {
    let frame: number;
    const setBrowserTimeout = window.setTimeout.bind(window);
    const start = () => {
      import("@slicemypage/motionflow").then((mod) => {
        const MotionFlow = mod.default;
        frame = window.requestAnimationFrame(() => {
          MotionFlow.init();
        });
      });
    };
    const idle = setBrowserTimeout(start, 8000);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (idle) window.clearTimeout(idle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
