declare module "@slicemypage/motionflow" {
  interface MotionFlowLifecycle {
    init: (options?: unknown) => void;
    refresh: () => void;
    destroy: () => void;
  }
  interface MotionFlowTicker extends MotionFlowLifecycle {
    play: (selector?: string) => void;
    pause: (selector?: string) => void;
    toggle: (selector?: string) => void;
  }
  interface MotionFlowApi {
    init: (options?: Record<string, unknown>) => void;
    scroll: MotionFlowLifecycle;
    parallax: MotionFlowLifecycle;
    text: MotionFlowLifecycle;
    count: MotionFlowLifecycle;
    roller: MotionFlowLifecycle;
    ticker: MotionFlowTicker;
  }
  const MotionFlow: MotionFlowApi;
  export default MotionFlow;
}

declare module "@slicemypage/motionflow/dist/motionflow.min.css";
