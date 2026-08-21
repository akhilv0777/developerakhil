import { useEffect } from "react";
import MotionFlow from "@slicemypage/motionflow";
import "@slicemypage/motionflow/dist/motionflow.min.css";

/**
 * MotionFlow auto-scans the DOM once on `DOMContentLoaded`. In this SPA
 * almost everything with a `data-mf-*` attribute (profile text, stats,
 * projects, etc.) is rendered by React *after* that point, once the
 * portfolio query resolves — so the very first auto-scan finds nothing.
 *
 * This hook re-runs `MotionFlow.init()` right after each render pass
 * driven by `deps` (typically `[data]`), so newly-mounted elements with
 * scroll/parallax/counter/ticker attributes get picked up. It's cheap
 * and safe to call repeatedly — MotionFlow just re-scans and re-binds.
 */
export function useMotionFlow(deps: readonly unknown[]) {
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      MotionFlow.init();
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default MotionFlow;
