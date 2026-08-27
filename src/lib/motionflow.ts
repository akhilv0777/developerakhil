"use client";

import { useEffect } from "react";
import "@slicemypage/motionflow/dist/motionflow.min.css";

export function useMotionFlow(deps: readonly unknown[]) {
  useEffect(() => {
    let frame: number;
    let idle: number | undefined;
    let idleKind: "callback" | "timeout" = "timeout";
    const setBrowserTimeout = window.setTimeout.bind(window);
    const start = () => {
      import("@slicemypage/motionflow").then((mod) => {
        const MotionFlow = mod.default;
        frame = window.requestAnimationFrame(() => {
          MotionFlow.init();
        });
      });
    };
    if ("requestIdleCallback" in window) {
      idleKind = "callback";
      idle = window.requestIdleCallback(start, { timeout: 1500 });
    } else {
      idle = setBrowserTimeout(start, 300);
    }
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (idle) {
        if (idleKind === "callback") window.cancelIdleCallback(idle);
        else clearTimeout(idle);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
