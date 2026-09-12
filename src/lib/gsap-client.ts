"use client";

import { gsap } from "gsap";
import { CustomBounce } from "gsap/CustomBounce";
import { CustomEase } from "gsap/CustomEase";
import { CustomWiggle } from "gsap/CustomWiggle";
import { Draggable } from "gsap/Draggable";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { Observer } from "gsap/Observer";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { TextPlugin } from "gsap/TextPlugin";

let registered = false;

export function registerGsap() {
  if (registered || typeof window === "undefined") {
    return {
      gsap,
      CustomBounce,
      CustomEase,
      CustomWiggle,
      Draggable,
      DrawSVGPlugin,
      Flip,
      InertiaPlugin,
      MotionPathPlugin,
      Observer,
      ScrambleTextPlugin,
      ScrollToPlugin,
      ScrollTrigger,
      SplitText,
      TextPlugin,
    };
  }

  gsap.registerPlugin(
    CustomEase,
    CustomWiggle,
    CustomBounce,
    ScrollTrigger,
    ScrollToPlugin,
    SplitText,
    Flip,
    Observer,
    Draggable,
    InertiaPlugin,
    ScrambleTextPlugin,
    DrawSVGPlugin,
    MotionPathPlugin,
    TextPlugin,
  );

  CustomEase.create("folio", "0.22, 1, 0.36, 1");
  CustomWiggle.create("heartWiggle", { wiggles: 7, type: "easeOut" });
  CustomBounce.create("folioBounce", { strength: 0.35 });

  gsap.defaults({ ease: "folio", duration: 0.8 });
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;

  return {
    gsap,
    CustomBounce,
    CustomEase,
    CustomWiggle,
    Draggable,
    DrawSVGPlugin,
    Flip,
    InertiaPlugin,
    MotionPathPlugin,
    Observer,
    ScrambleTextPlugin,
    ScrollToPlugin,
    ScrollTrigger,
    SplitText,
    TextPlugin,
  };
}
