"use client";

import { useEffect, type RefObject } from "react";
import { registerGsap } from "@/lib/gsap-client";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function usePublicGsap(
  rootRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled || !rootRef.current) return;

    const root = rootRef.current;
    const {
      gsap,
      ScrollTrigger,
      ScrollToPlugin,
      SplitText,
      Observer,
      Draggable,
      DrawSVGPlugin,
      MotionPathPlugin,
    } = registerGsap();
    void ScrollToPlugin;
    void DrawSVGPlugin;
    void MotionPathPlugin;

    const reduced = prefersReducedMotion();
    const splits: InstanceType<typeof SplitText>[] = [];
    const mm = gsap.matchMedia();
    const observers: { kill: () => void }[] = [];

    const onAnchorClick = (event: Event) => {
      const link = (event.target as Element | null)?.closest(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;
      if (!link) return;
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      gsap.to(window, {
        duration: reduced ? 0.01 : 0.95,
        scrollTo: { y: target, offsetY: 88, autoKill: true },
        ease: "power3.inOut",
      });
    };
    root.addEventListener("click", onAnchorClick);

    const ctx = gsap.context(() => {
      const progressEl = root.querySelector<HTMLElement>("[data-gsap-progress]");
      const backTop = root.querySelector<HTMLElement>("[data-gsap-backtop]");

      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const pct = self.progress * 100;
          root.style.setProperty("--scroll-progress", `${pct}%`);
          if (progressEl) gsap.set(progressEl, { scaleX: self.progress });
          if (backTop) {
            const show = self.progress > 0.08;
            gsap.set(backTop, { autoAlpha: show ? 1 : 0, y: show ? 0 : 12 });
          }
        },
      });

      if (reduced) return;

      const hero = root.querySelector<HTMLElement>("[data-gsap-hero]");
      if (hero) {
        const intro = gsap.timeline({ defaults: { ease: "folio" } });
        const splitTargets = hero.querySelectorAll("[data-gsap-split]");
        splitTargets.forEach((el) => {
          gsap.set(el, { perspective: 900 });
          const split = SplitText.create(el, {
            type: "chars,words,lines",
            charsClass: "gsap-char",
            linesClass: "gsap-line",
          });
          splits.push(split);
          intro.from(
            split.chars,
            {
              yPercent: 110,
              opacity: 0,
              rotateX: -40,
              stagger: 0.028,
              duration: 0.9,
              ease: "folio",
            },
            0.15,
          );
        });

        intro.from(
          hero.querySelectorAll("[data-hero-reveal]"),
          {
            y: 28,
            opacity: 0,
            stagger: 0.08,
            duration: 0.75,
          },
          0,
        );

        const heroImage = hero.querySelector(".hero-background-image img");
        if (heroImage) {
          intro.from(
            heroImage,
            { scale: 1.12, duration: 1.6, ease: "power3.out" },
            0,
          );
          gsap.to(heroImage, {
            yPercent: 14,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        }

        const underline = hero.querySelector<SVGPathElement>("[data-gsap-draw]");
        const spark = hero.querySelector<SVGElement>("[data-motion-spark]");
        if (underline) {
          intro.from(
            underline,
            { drawSVG: "0%", duration: 1.15, ease: "power2.inOut" },
            0.45,
          );
          if (spark) {
            intro.to(
              spark,
              {
                duration: 1.4,
                ease: "power2.inOut",
                motionPath: {
                  path: underline,
                  align: underline,
                  alignOrigin: [0.5, 0.5],
                  autoRotate: true,
                },
              },
              0.45,
            );
          }
        }
      }

      root.querySelectorAll<HTMLElement>("[data-gsap-split-scroll]").forEach((el) => {
        const split = SplitText.create(el, {
          type: "lines,words",
          linesClass: "gsap-line",
        });
        splits.push(split);
        gsap.from(split.lines, {
          yPercent: 80,
          opacity: 0,
          stagger: 0.08,
          duration: 0.85,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
          },
        });
      });

      const revealFrom = {
        up: { y: 40, opacity: 0 },
        left: { x: 48, opacity: 0 },
        right: { x: -48, opacity: 0 },
        zoom: { scale: 0.88, opacity: 0 },
      } as const;

      root.querySelectorAll<HTMLElement>("[data-gsap-reveal]").forEach((el) => {
        const kind = (el.dataset.gsapReveal || "up") as keyof typeof revealFrom;
        gsap.from(el, {
          ...revealFrom[kind],
          duration: 0.9,
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once: true,
          },
        });
      });

      root.querySelectorAll<HTMLElement>("[data-gsap-stagger]").forEach((el) => {
        const kind = (el.dataset.gsapStagger || "up") as keyof typeof revealFrom;
        const items = el.querySelectorAll(":scope > *");
        gsap.from(items, {
          ...revealFrom[kind],
          stagger: Number(el.dataset.gsapGap || 90) / 1000,
          duration: 0.8,
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            once: true,
          },
        });
      });

      root.querySelectorAll<HTMLElement>("[data-gsap-count]").forEach((el) => {
        const target = Number(el.dataset.countTo || 0);
        const proxy = { value: 0 };
        ScrollTrigger.create({
          trigger: el,
          start: "top 95%",
          once: true,
          onEnter: () => {
            gsap.to(proxy, {
              value: target,
              duration: 1.6,
              ease: "power2.out",
              snap: { value: 1 },
              onUpdate: () => {
                el.textContent = Math.round(proxy.value).toLocaleString();
              },
            });
          },
        });
      });

      root.querySelectorAll<HTMLElement>("[data-gsap-marquee]").forEach((el) => {
        const speed = Number(el.dataset.marqueeSpeed || 32);
        const tween = gsap.to(el, {
          xPercent: -50,
          duration: speed,
          ease: "none",
          repeat: -1,
        });
        const pause = () => tween.pause();
        const play = () => tween.play();
        el.addEventListener("mouseenter", pause);
        el.addEventListener("mouseleave", play);
        el.addEventListener("focusin", pause);
        el.addEventListener("focusout", play);
      });

      root.querySelectorAll<SVGGeometryElement>("[data-gsap-draw-scroll]").forEach((el) => {
        gsap.from(el, {
          drawSVG: "0%",
          ease: "none",
          scrollTrigger: {
            trigger: el.closest("section") || el,
            start: "top 75%",
            end: "bottom 45%",
            scrub: 0.6,
          },
        });
      });

      const aboutImage = root.querySelector(".about-image-frame img");
      if (aboutImage) {
        gsap.fromTo(
          aboutImage,
          { scale: 1.18, clipPath: "inset(12% 12% 12% 12% round 2.2rem)" },
          {
            scale: 1,
            clipPath: "inset(0% 0% 0% 0% round 2.7rem 0.1rem 0.1rem 0.1rem)",
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: { trigger: aboutImage, start: "top 80%", once: true },
          },
        );
      }

      root.querySelectorAll<HTMLElement>("[data-scramble]").forEach((el) => {
        const original = el.textContent || "";
        el.addEventListener("mouseenter", () => {
          gsap.to(el, {
            duration: 0.7,
            scrambleText: {
              text: original,
              chars: "upperCase",
              speed: 0.55,
            },
          });
        });
      });

      root.querySelectorAll<HTMLElement>("[data-gsap-scramble-scroll]").forEach((el) => {
        const original = el.textContent || "";
        ScrollTrigger.create({
          trigger: el,
          start: "top 95%",
          once: true,
          onEnter: () => {
            gsap.to(el, {
              duration: 1.2,
              scrambleText: { text: original, chars: "upperCase", speed: 0.5 },
            });
          }
        });
      });

      root.querySelectorAll<HTMLElement>("[data-gsap-typewriter]").forEach((el) => {
        const original = el.textContent || "";
        el.textContent = "";
        ScrollTrigger.create({
          trigger: el,
          start: "top 90%",
          once: true,
          onEnter: () => {
            gsap.to(el, {
              duration: original.length * 0.03,
              text: { value: original },
              ease: "none",
            });
          }
        });
      });

      root.querySelectorAll<HTMLElement>("[data-gsap-float]").forEach((el, i) => {
        gsap.to(el, {
          y: -8,
          duration: 1.5 + (i % 3) * 0.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: i * 0.1,
        });
      });

      root.querySelectorAll<HTMLElement>("[data-gsap-parallax]").forEach((el) => {
        gsap.to(el, {
          yPercent: 15,
          ease: "none",
          scrollTrigger: {
            trigger: el.parentElement || el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      mm.add("(pointer: fine)", () => {
        root.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((btn) => {
          const xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" });
          const yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });
          const onMove = (event: MouseEvent) => {
            const rect = btn.getBoundingClientRect();
            xTo((event.clientX - rect.left - rect.width / 2) * 0.32);
            yTo((event.clientY - rect.top - rect.height / 2) * 0.32);
          };
          const onLeave = () => {
            xTo(0);
            yTo(0);
          };
          btn.addEventListener("mousemove", onMove);
          btn.addEventListener("mouseleave", onLeave);
        });
      });

      const heart = root.querySelector(".heartbeat");
      if (heart) {
        gsap.to(heart, {
          scale: 1.16,
          rotation: 6,
          duration: 1.15,
          ease: "heartWiggle",
          repeat: -1,
          yoyo: true,
        });
      }

      const thanks = root.querySelector("[data-gsap-thanks]");
      if (thanks) {
        gsap.from(thanks, {
          y: 48,
          opacity: 0,
          duration: 1,
          scrollTrigger: { trigger: thanks, start: "top 85%", once: true },
        });
      }

      const testimonial = root.querySelector<HTMLElement>("[data-gsap-testimonial]");
      if (testimonial) {
        Draggable.create(testimonial, {
          type: "x",
          inertia: true,
          bounds: { minX: -120, maxX: 120 },
          onDragEnd() {
            if (this.x < -50) {
              root
                .querySelector<HTMLButtonElement>("[data-testimonial-next]")
                ?.click();
            } else if (this.x > 50) {
              root
                .querySelector<HTMLButtonElement>("[data-testimonial-prev]")
                ?.click();
            }
            gsap.to(this.target, { x: 0, duration: 0.45, ease: "folioBounce" });
          },
        });
      }

      if (hero) {
        observers.push(
          Observer.create({
            target: hero,
            type: "pointer",
            onMove(self) {
              const copy = hero.querySelector(".hero-copy");
              if (!copy) return;
              gsap.to(copy, {
                x: ((self.x || 0) / window.innerWidth - 0.5) * 18,
                y: ((self.y || 0) / window.innerHeight - 0.5) * 10,
                duration: 0.9,
                overwrite: "auto",
              });
            },
          }),
        );
      }
    }, root);

    const refresh = () => ScrollTrigger.refresh();
    const ro = new ResizeObserver(refresh);
    ro.observe(root);
    window.addEventListener("load", refresh);

    return () => {
      root.removeEventListener("click", onAnchorClick);
      observers.forEach((observer) => observer.kill());
      splits.forEach((split) => split.revert());
      mm.revert();
      ro.disconnect();
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, [enabled, rootRef]);
}
