"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  ArrowDownRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FolderKanban,
  GraduationCap,
  Heart,
  Mail,
  MapPin,
  Menu,
  Minus,
  Moon,
  Plus,
  Quote,
  Rocket,
  Share2,
  Sparkles,
  Sun,
  Star,
  Phone,
  X,
} from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import Link from "next/link";
import { registerGsap } from "@/lib/gsap-client";
import { usePublicGsap } from "@/hooks/usePublicGsap";
import { Flip } from "gsap/Flip";
import type {
  HeroImageSettings,
  PortfolioData,
  Profile,
  Project,
  Service,
  Stat,
} from "@/lib/portfolio-types";
import { usePortfolioQuery } from "@/lib/portfolio-api";
import { useTurnstile } from "@/components/Turnstile";
import { PublicNav } from "@/components/public/PublicNav";
import { SocialIcon } from "@/components/public/SocialIcon";
import Image from "next/image";

function hexToHsl(hex: string): string {
  let cleanHex = hex.replace(/^#/, "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function LegacyNav({
  data,
  isLight,
  onToggleTheme,
}: {
  data: PortfolioData;
  isLight: boolean;
  onToggleTheme: () => void;
}) {
  const profile = data.profile;
  const [open, setOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const profileLinks: Array<[string, string]> = [];
  if (data.sectionVisibility?.about) profileLinks.push(["about", "About"]);
  if (data.sectionVisibility?.skills ?? true)
    profileLinks.push(["skills", "Skills"]);
  if (data.sectionVisibility?.education)
    profileLinks.push(["education", "Education"]);
  if (data.sectionVisibility?.experience)
    profileLinks.push(["experience", "Experience"]);
  const workLinks: Array<[string, string]> = [];
  if (data.sectionVisibility?.services)
    workLinks.push(["services", "Services"]);
  if (data.sectionVisibility?.projects) workLinks.push(["work", "Projects"]);
  if (data.sectionVisibility?.testimonials)
    workLinks.push(["testimonials", "Testimonials"]);
  const groups: Array<{ label: string; items: Array<[string, string]> }> = [
    {
      label: "Profile",
      items: profileLinks,
    },
    {
      label: "Work",
      items: workLinks,
    },
    ...(data.sectionVisibility?.contact
      ? [
          {
            label: "Hire me",
            items: [["contact", "Hire me"] as [string, string]],
          },
        ]
      : []),
  ];
  const links = groups.flatMap((group) => group.items);
  const initials =
    profile.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AV";

  useEffect(() => {
    const updateActiveHash = () => {
      const nextHash = window.location.hash.replace("#", "");
      setActiveHash(nextHash || "about");
    };

    updateActiveHash();
    window.addEventListener("hashchange", updateActiveHash);

    const sections = links
      .map(([href]) => document.getElementById(href))
      .filter(Boolean) as HTMLElement[];

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          setActiveHash(visible.target.id);
          if (typeof window.history?.replaceState === "function") {
            const nextHash = `#${visible.target.id}`;
            if (window.location.hash !== nextHash) {
              window.history.replaceState(null, "", nextHash);
            }
          }
        }
      },
      { threshold: [0.2, 0.5, 0.8], rootMargin: "-15% 0px -35% 0px" },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener("hashchange", updateActiveHash);
      observer.disconnect();
    };
  }, [links]);

  return (
    <header className="glass-nav fixed top-4 left-1/2 z-50 w-[95%] max-w-[1000px] -translate-x-1/2 rounded-full border px-6 py-4 backdrop-blur-md transition-all">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 group"
          data-testid="link-home"
        >
          {profile.heroImage || profile.image ? (
            <Image
              src={profile.heroImage || profile.image}
              alt={profile.name}
              className="h-9 w-9 rounded-full object-cover transition-transform group-hover:scale-110"
              width={36}
              height={36}
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-mono text-sm font-bold text-background transition-transform group-hover:scale-110">
              {initials}
            </span>
          )}
          <span className="font-mono text-[12px] font-semibold uppercase tracking-wider text-foreground">
            {profile.name}
          </span>
        </Link>

        <nav
          className={`${
            open
              ? "absolute left-0 top-[70px] flex w-full flex-col items-center gap-4 rounded-3xl border border-border bg-background p-6 shadow-xl"
              : "hidden"
          } lg:static lg:flex lg:max-w-[62vw] lg:flex-row lg:items-center lg:gap-6 lg:overflow-visible lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
        >
          {groups.map((group) => {
            const isSingle =
              group.items.length === 1 && group.label === "Hire me";
            const groupActive = group.items.some(
              ([href]) => activeHash === href,
            );
            if (isSingle) {
              const [href, label] = group.items[0];
              return (
                <a
                  key={href}
                  href={`#${href}`}
                  onClick={() => setOpen(false)}
                  className={`shrink-0 font-mono text-[11px] font-medium uppercase tracking-[.15em] transition-colors ${groupActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                  data-testid={`link-nav-${href}`}
                  aria-current={groupActive ? "page" : undefined}
                >
                  {label}
                </a>
              );
            }
            return (
              <div
                key={group.label}
                className="group relative w-full shrink-0 lg:w-auto"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroup((current) =>
                      current === group.label ? null : group.label,
                    )
                  }
                  className={`flex w-full cursor-pointer items-center justify-between gap-1 border-b border-border py-3 font-mono text-[11px] font-medium uppercase tracking-[.15em] transition-colors lg:w-auto lg:border-0 lg:py-0 ${groupActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                  aria-expanded={openGroup === group.label}
                >
                  {group.label}
                  <span className="lg:hidden" aria-hidden="true">
                    {openGroup === group.label ? (
                      <Minus size={15} />
                    ) : (
                      <Plus size={15} />
                    )}
                  </span>
                  <ChevronDown
                    size={13}
                    className={`hidden transition-transform lg:block ${openGroup === group.label ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`${openGroup === group.label ? "flex" : "hidden"} relative mt-3 min-w-44 flex-col gap-3 rounded-xl border border-border bg-background p-3 shadow-xl lg:absolute lg:left-1/2 lg:top-full lg:mt-2 lg:hidden lg:-translate-x-1/2 lg:border lg:bg-background lg:p-3 lg:pl-3 lg:shadow-xl lg:before:absolute lg:before:-top-2 lg:before:left-0 lg:before:right-0 lg:before:h-2 lg:before:content-[''] lg:group-hover:flex`}
                >
                  <span
                    className="absolute -top-3 left-1/2 hidden -translate-x-1/2 text-muted-foreground lg:flex"
                    aria-hidden="true"
                  >
                    <ChevronUp size={12} strokeWidth={2.5} />
                  </span>
                  {group.items.map(([href, label]) => {
                    const isActive =
                      activeHash === href || (!activeHash && href === "about");
                    return (
                      <a
                        key={href}
                        href={`#${href}`}
                        onClick={() => {
                          setOpen(false);
                          setOpenGroup(null);
                        }}
                        className={`font-mono text-[10px] font-medium uppercase tracking-[.15em] transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                        data-testid={`link-nav-${href}`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {label}
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-full border border-border bg-secondary p-2 text-foreground transition-colors hover:border-primary hover:text-primary"
            aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
            data-testid="button-toggle-theme"
          >
            {isLight ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-full bg-secondary p-2 text-foreground lg:hidden hover:text-primary"
            aria-label="Toggle navigation"
            data-testid="button-toggle-nav"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function SectionLabel({
  number,
  children,
  icon,
}: {
  number: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-12 flex items-center gap-3">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/8 text-primary shadow-[0_0_18px_rgba(249,115,22,0.12)]">
        {icon ? icon : (
          <span className="font-mono text-[11px] font-bold">{number}</span>
        )}
      </span>
      <span data-gsap-scramble-scroll className="font-mono text-[11px] uppercase tracking-[.22em] text-foreground font-semibold">
        {children}
      </span>
    </div>
  );
}

function TypingRoles({ roles }: { roles: string[] }) {
  const safeRoles = roles.filter(Boolean);
  const rolesKey = safeRoles.join("|");
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const effectRoles = rolesKey ? rolesKey.split("|") : [];
    if (!effectRoles.length || !textRef.current) return;
    const { gsap } = registerGsap();
    const el = textRef.current;
    let index = 0;
    let active = true;
    const cycle = () => {
      if (!active) return;
      const text = effectRoles[index % effectRoles.length];
      gsap.to(el, {
        duration: 1.05,
        scrambleText: {
          text,
          chars: "upperCase",
          speed: 0.45,
        },
        onComplete: () => {
          gsap.delayedCall(1.35, () => {
            index += 1;
            cycle();
          });
        },
      });
    };
    el.textContent = effectRoles[0];
    gsap.delayedCall(0.4, cycle);
    return () => {
      active = false;
      gsap.killTweensOf(el);
    };
  }, [rolesKey]);

  if (!safeRoles.length) {
    return (
      <span className="font-mono text-[11px] uppercase tracking-[.15em] text-primary font-semibold">
        Developer.
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[.18em] text-foreground font-semibold">
      <span>a</span>
      <span
        ref={textRef}
        className="terminal-caret inline-flex min-w-[10ch] items-center text-primary"
        aria-live="polite"
      >
        {safeRoles[0]}
      </span>
      <span>.</span>
    </span>
  );
}

function Hero({ profile }: { profile: Profile }) {
  const roles = (
    profile.roles?.length ? profile.roles : [profile.tagline]
  ).filter(Boolean);
  const heroBadge =
    profile.tagline === "Editor • Developer • YouTuber" ||
    profile.tagline === "Editor • Developer • Youtuber"
      ? "Available for freelance work"
      : profile.tagline || "Available for freelance work";
  const resumeHref = profile.resume || "#contact";
  const desktopImageSettings = profile.heroDesktopSettings;
  const mobileImageSettings = profile.heroMobileSettings;

  const imageFilter = (settings?: HeroImageSettings) => {
    if (!settings) return undefined;
    const presets: Record<string, string> = {
      grayscale: "grayscale(1)",
      sepia: "sepia(.75)",
      vintage: "sepia(.35) saturate(.8) contrast(.95)",
      warm: "sepia(.18) saturate(1.25) hue-rotate(-8deg)",
      cool: "saturate(.85) hue-rotate(12deg)",
      blur: "blur(3px)",
      invert: "invert(1)",
      bright: "brightness(1.18) contrast(1.05)",
      pop: "saturate(1.45) contrast(1.12)",
    };
    return `${presets[settings.preset] || ""} brightness(${settings.brightness / 100}) contrast(${settings.contrast / 100}) saturate(${settings.saturation / 100}) hue-rotate(${settings.hue}deg) blur(${settings.blur}px)`.trim();
  };

  const imagePosition = (settings?: HeroImageSettings) => {
    if (!settings) return "50% 50%";
    const useRight = settings.left === 50 && settings.right !== 50;
    const useBottom = settings.top === 50 && settings.bottom !== 50;
    const horizontal = useRight
      ? `right ${settings.right}%`
      : `left ${settings.left}%`;
    const vertical = useBottom
      ? `bottom ${settings.bottom}%`
      : `top ${settings.top}%`;

    return `${horizontal} ${vertical}`;
  };

  return (
    <section
      data-gsap-hero
      className="relative flex min-h-dvh items-center overflow-hidden bg-background px-4 pb-12 pt-24 sm:px-5 sm:pb-16 sm:pt-32 md:px-8 md:pb-20 lg:px-10 lg:pb-24"
    >
      {(profile.heroImage || profile.image) && (
        <div
          className="hero-background-image absolute inset-0 z-0"
          aria-hidden="true"
          style={
            {
              "--hero-desktop-filter":
                imageFilter(desktopImageSettings) || "none",
              "--hero-mobile-filter":
                imageFilter(mobileImageSettings) || "none",
              "--hero-desktop-object-position":
                imagePosition(desktopImageSettings),
              "--hero-mobile-object-position":
                imagePosition(mobileImageSettings),
              "--hero-desktop-opacity": desktopImageSettings?.opacity
                ? desktopImageSettings.opacity / 100
                : 1,
              "--hero-mobile-opacity": mobileImageSettings?.opacity
                ? mobileImageSettings.opacity / 100
                : 1,
              "--hero-desktop-overlay-color":
                desktopImageSettings?.overlayColor || "#ffffff",
              "--hero-mobile-overlay-color":
                mobileImageSettings?.overlayColor || "#ffffff",
              "--hero-desktop-overlay-opacity":
                desktopImageSettings?.overlayOpacity
                  ? desktopImageSettings.overlayOpacity / 100
                  : 0,
              "--hero-mobile-overlay-opacity":
                mobileImageSettings?.overlayOpacity
                  ? mobileImageSettings.overlayOpacity / 100
                  : 0,
            } as React.CSSProperties
          }
        >
          <picture className="absolute inset-0 block">
            {profile.heroMobileImage && (
              <source
                media="(max-width: 767px)"
                srcSet={profile.heroMobileImage}
              />
            )}
            <Image
              src={profile.heroImage || profile.image}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </picture>
          <div className="hero-custom-overlay" />
        </div>
      )}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl min-w-0 items-center">
        <div className="hero-copy flex max-w-3xl flex-col items-start">
          <div data-hero-reveal className="glass-pill mb-8">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="font-mono text-[11px] uppercase tracking-[.15em] text-foreground font-semibold">
              {heroBadge}
            </p>
          </div>

          <p
            data-hero-reveal
            className="mb-3 font-mono text-sm font-semibold uppercase tracking-[.16em] text-primary"
          >
            Hello 👋, I am
          </p>

          <h1
            data-gsap-split
            className="display-title max-w-4xl text-5xl font-bold leading-[1.02] text-foreground tracking-tight sm:text-6xl lg:text-8xl"
          >
            {profile.name}
          </h1>
          <svg
            className="mt-3 h-6 w-full max-w-md text-primary"
            viewBox="0 0 400 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              data-gsap-draw
              d="M4 16 C 70 6, 140 22, 210 12 S 330 4, 396 14"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <circle
              data-motion-spark
              r="3.5"
              cx="4"
              cy="16"
              fill="currentColor"
            />
          </svg>

          <div
            data-hero-reveal
            className="mt-6 flex items-center gap-2 text-[11px] uppercase tracking-[.18em] text-foreground"
          >
            <TypingRoles roles={roles} />
          </div>

          <p
            data-hero-reveal
            className="mt-8 max-w-xl text-base leading-[1.8] text-foreground sm:text-lg"
          >
            {profile.bio1}
          </p>

          <div
            data-hero-reveal
            className="mt-10 flex flex-wrap items-center gap-3 sm:mt-12 sm:gap-4"
          >
            <a
              href="#work"
              data-magnetic
              className="hero-work-button glass-button group w-fit items-center gap-3 border-foreground/80 bg-foreground px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-[.1em] text-background shadow-[0_16px_35px_hsl(var(--foreground)/0.2)]"
              data-testid="link-hero-work"
            >
              See my work{" "}
              <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
            </a>

            <a
              href={resumeHref}
              download={
                profile.resume ? profile.resumeName || "resume.pdf" : undefined
              }
              data-magnetic
              className="glass-button group w-fit items-center gap-3 border-primary/40 bg-primary/10 px-8 py-4 font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-foreground hover:border-primary hover:text-primary"
              data-testid="link-hero-resume"
            >
              <Download className="h-4 w-4" />
              Download resume
            </a>
          </div>
        </div>
      </div>
      <a
        href="#about"
        data-hero-reveal
        className="scroll-cue absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground transition-colors hover:text-primary sm:flex"
      >
        <span className="h-px w-8 bg-border" />
        <span className="scroll-cue-mouse" aria-hidden="true">
          <span />
        </span>
        <span className="h-px w-8 bg-border" />
      </a>
    </section>
  );
}

function About({ profile }: { profile: Profile }) {
  return (
    <section
      id="about"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-5 sm:py-20 md:px-8 md:py-24 lg:px-10 lg:py-32"
    >
      <SectionLabel number="01" icon={<Sparkles size={14} />}>
        ABOUT
      </SectionLabel>
      <div className="grid min-w-0 items-start gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div>
          {profile.aboutImage ? (
            <div className="about-image-stage mx-auto aspect-square w-full max-w-none lg:mx-0 lg:max-w-[560px]">
              <div className="about-image-frame h-full w-full">
                <div className="relative h-full w-full overflow-hidden rounded-[2.7rem_.1rem_.1rem_.1rem]">
                  <Image
                    src={profile.aboutImage}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                    data-gsap-parallax
                    width={560}
                    height={560}
                  />
                  <div className="absolute bottom-5 left-5 z-10 sm:bottom-7 sm:left-7">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
                      Behind the work
                    </p>
                    <p className="mt-1 text-[clamp(.72rem,1.1vw,.875rem)] font-semibold text-white">
                      Developer · Creator · Problem solver
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <div className="space-y-8">
            <div
              data-gsap-stagger="up"
              data-gsap-gap="120"
              className="grid gap-6 text-[clamp(.9rem,1.1vw,1rem)] leading-[1.75] text-muted-foreground sm:gap-8"
            >
            <p className="text-[clamp(1.5rem,2.7vw,2.5rem)] font-bold leading-[1.2] text-foreground">
              {profile.bio1}
            </p>
            <p>{profile.bio2}</p>
            <p>{profile.bio3}</p>
          </div>
          {(profile.skills?.length > 0 || profile.languages?.length > 0) && (
            <div
              id="skills"
              data-gsap-reveal="up"
              className="flex flex-wrap gap-2"
            >
              {profile.skills?.map((skill) => (
                <span
                  key={skill}
                  data-scramble
                  data-gsap-float
                  className="inline-flex rounded-full border border-border bg-secondary px-3 py-1 font-mono text-[10px] font-bold uppercase text-foreground"
                >
                  {skill}
                </span>
              ))}
              {profile.languages?.map((lang) => (
                <span
                  key={lang}
                  data-gsap-float
                  className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[10px] font-bold uppercase text-primary"
                >
                  {lang}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StatValue({ value }: { value: string }) {
  const match = value.match(/^(\d[\d,]*)(.*)$/);
  if (!match) {
    return (
      <span className="font-mono text-4xl lg:text-5xl font-bold text-foreground">
        {value}
      </span>
    );
  }
  const [, digits, suffix] = match;
  const target = Number(digits.replace(/,/g, ""));
  return (
    <span className="font-mono text-4xl lg:text-5xl font-bold text-foreground">
      <span
        data-gsap-count
        data-count-to={target}
      >
        0
      </span>
      <span className="text-primary">{suffix}</span>
    </span>
  );
}

function Stats({ stats }: { stats: Stat[] }) {
  return (
    <section
      id="stats"
      className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-10 md:px-8 lg:px-10"
    >
      <div
        data-gsap-stagger="up"
        data-gsap-gap="100"
        className="grid grid-cols-2 gap-6 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="bento-card group flex flex-col items-center justify-center overflow-hidden p-6 text-center"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/8 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary transition-transform group-hover:scale-110">
              {stat.label.slice(0, 2)}
            </div>
            <p data-testid={`stat-${stat.id}`}>
              <StatValue value={stat.value} />
            </p>
            <p className="mt-4 font-mono text-[11px] font-semibold uppercase tracking-[.15em] text-muted-foreground">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Marquee({ services }: { services: Service[] }) {
  const words =
    services.length > 0
      ? services.map((service) => service.title)
      : ["Research", "Design", "Code", "Ship", "Learn"];
  const sequence = [...words, ...words];

  return (
    <div
      id="services-strip"
      className="mx-auto my-10 max-w-7xl overflow-hidden rounded-xl border border-border/60 bg-secondary/55 py-6 backdrop-blur-sm [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
    >
      <div
        data-gsap-marquee
        data-marquee-speed="32"
        className="flex w-max font-mono text-[13px] font-bold uppercase tracking-[.2em] text-foreground"
      >
        {sequence.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className="flex items-center gap-6 px-6"
            aria-hidden={index >= words.length}
          >
            {word}
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </span>
        ))}
      </div>
    </div>
  );
}

function Timeline({ data }: { data: PortfolioData }) {
  return (
    <section
      id="education"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-5 sm:py-20 md:px-8 md:py-24 lg:px-10 lg:py-32"
    >
      <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr]">
        <div data-gsap-reveal="up">
          <SectionLabel number="02" icon={<GraduationCap size={14} />}>
            EDUCATION
          </SectionLabel>
          <h2
            data-gsap-split-scroll
            className="display-title text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-7xl"
          >
            Academic <br />
            <span>Timeline.</span>
          </h2>
        </div>

        <div className="relative">
          <svg
            className="pointer-events-none absolute left-[19px] top-4 hidden h-[calc(100%-2rem)] w-10 text-primary/70 sm:block"
            aria-hidden="true"
          >
            <line
              data-gsap-draw-scroll
              x1="20"
              y1="0"
              x2="20"
              y2="100%"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <div
            data-gsap-stagger="left"
            data-gsap-gap="100"
            className="grid gap-6"
          >
          {data.education.map((item) => (
            <div
              className="bento-card group relative overflow-hidden p-5 sm:p-6"
              key={item.id}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                <div className="flex items-center gap-3 sm:w-40 sm:shrink-0">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 bg-primary/8 text-primary">
                    <GraduationCap size={16} />
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
                    {item.period}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-foreground">
                      {item.degree}
                    </h3>
                    <span className="h-2.5 w-2.5 rounded-full bg-primary/80 shadow-[0_0_18px_rgba(249,115,22,0.45)]" />
                  </div>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[.14em] text-muted-foreground">
                    {item.institution}
                  </p>
                  <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ExperienceSection({ data }: { data: PortfolioData }) {
  return (
    <section
      id="experience"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-5 sm:py-20 md:px-8 md:py-24 lg:px-10 lg:py-32"
    >
      <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr]">
        <div data-gsap-reveal="up">
          <SectionLabel number="03" icon={<BriefcaseBusiness size={14} />}>
            EXPERIENCE
          </SectionLabel>
          <h2
            data-gsap-split-scroll
            className="display-title text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-7xl"
          >
            Professional <br />
            <span>Timeline.</span>
          </h2>
        </div>

        <div className="relative">
          <svg
            className="pointer-events-none absolute left-[19px] top-4 hidden h-[calc(100%-2rem)] w-10 text-primary/70 sm:block"
            aria-hidden="true"
          >
            <line
              data-gsap-draw-scroll
              x1="20"
              y1="0"
              x2="20"
              y2="100%"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <div
            data-gsap-stagger="left"
            data-gsap-gap="100"
            className="grid gap-6"
          >
          {data.experience.map((item) => (
            <div
              className="bento-card group relative overflow-hidden p-5 sm:p-6"
              key={item.id}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                <div className="flex items-center gap-3 sm:w-40 sm:shrink-0">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 bg-primary/8 text-primary">
                    <BriefcaseBusiness size={16} />
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
                    {item.period}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-foreground">
                      {item.role}
                    </h3>
                    <span className="h-2.5 w-2.5 rounded-full bg-primary/80 shadow-[0_0_18px_rgba(249,115,22,0.45)]" />
                  </div>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[.14em] text-muted-foreground">
                    {item.company}
                  </p>
                  <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Services({ data }: { data: PortfolioData }) {
  return (
    <section
      id="services"
      className="mx-auto max-w-7xl border-y border-border/60 bg-secondary/10 px-4 py-16 sm:px-5 sm:py-20 md:px-8 md:py-24 lg:px-10 lg:py-32"
    >
      <SectionLabel number="04" icon={<Code2 size={14} />}>
        SERVICES
      </SectionLabel>

      <div
        data-gsap-stagger="zoom"
        data-gsap-gap="110"
        className="grid gap-6 lg:grid-cols-3 mt-12"
      >
        {data.services.map((service) => (
          <article
            key={service.id}
            className="bento-card group flex h-full flex-col p-7 transition-all duration-300"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="font-mono text-[2rem] font-bold text-primary">
                {service.number}
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/8 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
                {service.title.slice(0, 2)}
              </span>
            </div>

            <h3 className="mb-4 text-2xl font-bold leading-tight text-foreground">
              {service.title}
            </h3>

            <p className="flex-grow text-sm leading-[1.8] text-muted-foreground">
              {service.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Work({ data }: { data: PortfolioData }) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const selectedProjectIndex = selectedProject
    ? data.projects.findIndex((project) => project.id === selectedProject.id)
    : -1;
  const gridRef = useRef<HTMLDivElement>(null);
  const flipState = useRef<ReturnType<typeof Flip.getState> | null>(null);

  const showAdjacentProject = (direction: -1 | 1) => {
    const nextIndex = selectedProjectIndex + direction;
    if (nextIndex >= 0 && nextIndex < data.projects.length) {
      setSelectedProject(data.projects[nextIndex]);
    }
  };
  const [activeCategory, setActiveCategory] = useState("All projects");
  const categories = Array.from(
    new Set(
      data.projects
        .map((project) => project.category.trim() || "Uncategorized")
        .filter(Boolean),
    ),
  );
  const visibleCount =
    activeCategory === "All projects"
      ? data.projects.length
      : data.projects.filter(
          (project) =>
            (project.category.trim() || "Uncategorized") === activeCategory,
        ).length;

  const setCategory = (category: string) => {
    const { Flip } = registerGsap();
    const cards = gridRef.current?.querySelectorAll("[data-project-card]");
    if (cards?.length) flipState.current = Flip.getState(cards);
    setActiveCategory(category);
  };

  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state || !gridRef.current) return;
    const { gsap, Flip } = registerGsap();
    const cards = gridRef.current.querySelectorAll("[data-project-card]");
    Flip.from(state, {
      duration: 0.7,
      ease: "power2.inOut",
      absolute: true,
      nested: true,
      stagger: 0.04,
      onEnter: (elements) =>
        gsap.fromTo(
          elements,
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 0.45, ease: "folio" },
        ),
      onLeave: (elements) =>
        gsap.to(elements, { opacity: 0, scale: 0.94, duration: 0.3 }),
    });
    void cards;
    flipState.current = null;
  }, [activeCategory]);

  useEffect(() => {
    if (!selectedProject) return;
    const { gsap } = registerGsap();
    const overlay = document.querySelector("[data-project-modal]");
    const card = overlay?.querySelector("[data-modal-card]");
    if (!overlay || !card) return;
    gsap.fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 });
    gsap.fromTo(
      card,
      { y: 28, scale: 0.96, autoAlpha: 0 },
      { y: 0, scale: 1, autoAlpha: 1, duration: 0.45, ease: "folio" },
    );
  }, [selectedProject]);

  const shareProject = async (project: Project) => {
    const shareUrl = `${window.location.origin}/projects/${encodeURIComponent(project.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: project.title,
          text: project.description,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Project link copied");
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") {
        toast.error("Could not share this project");
      }
    }
  };

  return (
    <section
      id="work"
      className="mx-auto max-w-[1400px] border-b border-border/60 px-4 py-16 sm:px-5 sm:py-20 md:px-8 md:py-24 lg:px-10 lg:py-32"
    >
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end mb-12">
        <SectionLabel number="05" icon={<FolderKanban size={14} />}>
          PROJECTS
        </SectionLabel>
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Filter projects by category"
        >
          {["All projects", ...categories].map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              onClick={() => setCategory(category)}
              className={`rounded-full border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                activeCategory === category
                  ? "border-primary bg-primary text-background"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={gridRef}
        className="grid gap-8 lg:grid-cols-2"
      >
        {data.projects.map((project) => {
          const category = project.category.trim() || "Uncategorized";
          const isHidden =
            activeCategory !== "All projects" && category !== activeCategory;
          return (
          <article
            key={project.id}
            data-project-card
            className={`bento-card group flex flex-col overflow-hidden ${isHidden ? "hidden" : ""}`}
          >
            <div className="relative h-64 w-full overflow-hidden border-b border-border bg-secondary/50">
              {project.image ? (
                <>
                  <Image
                    src={project.image}
                    alt={project.title}
                    loading="lazy"
                    decoding="async"
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    quality={70}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-background/20 transition-colors duration-700 group-hover:bg-background/5" />
                </>
              ) : (
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105 flex items-center justify-center bg-secondary">
                  <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                </div>
              )}
              <div className="absolute top-4 right-4 inline-flex rounded-full border border-border bg-background/80 backdrop-blur-md px-3 py-1 font-mono text-[10px] font-bold uppercase text-primary">
                {project.category}
              </div>
              <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-4 py-2 font-mono text-[10px] font-bold uppercase text-foreground backdrop-blur-md z-10">
                <CalendarDays size={12} className="text-primary" />
                {project.year}
              </div>
            </div>

            <div className="flex flex-col flex-grow p-6">
              <div className="mb-4">
                <h3 className="text-2xl font-bold leading-[1.1] tracking-tight text-foreground">
                  {project.title}
                </h3>
              </div>

              <p className="mb-8 line-clamp-6 text-sm leading-[1.8] text-muted-foreground">
                {project.description}
              </p>
              <div className="flex w-full flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProject(project)}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary sm:w-auto"
                >
                  View project details <ArrowUpRight size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => void shareProject(project)}
                  aria-label={`Share ${project.title}`}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary sm:w-auto"
                >
                  <Share2 size={13} /> Share
                </button>
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-background transition-colors hover:bg-primary/85 sm:w-auto"
                  >
                    View live project <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          </article>
          );
        })}
      </div>
      {visibleCount === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          No projects in this category yet.
        </p>
      )}
      {selectedProject && (
        <div
          data-project-modal
          className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 p-5 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedProject.title} details`}
        >
          <div data-modal-card className="bento-card relative max-h-[85vh] w-full max-w-2xl overflow-y-auto p-5 pb-8 sm:p-6 sm:pb-9 lg:p-8 lg:pb-10">
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="absolute right-5 top-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary"
              aria-label="Close project details"
            >
              ×
            </button>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
              {selectedProject.category} · {selectedProject.year}
            </p>
            <h3 className="display-title mt-4 pr-10 text-3xl font-bold text-foreground">
              {selectedProject.title}
            </h3>
            <p className="mt-6 whitespace-pre-line text-base leading-[1.8] text-muted-foreground">
              {selectedProject.description}
            </p>
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
              <button
                type="button"
                onClick={() => showAdjacentProject(-1)}
                disabled={selectedProjectIndex <= 0}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {selectedProjectIndex + 1} / {data.projects.length}
              </span>
              <button
                type="button"
                onClick={() => showAdjacentProject(1)}
                disabled={
                  selectedProjectIndex < 0 ||
                  selectedProjectIndex >= data.projects.length - 1
                }
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-30"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6">
              <Link
                href={`/projects/${encodeURIComponent(selectedProject.id)}`}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary/50 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10"
              >
                <ArrowUpRight size={14} /> Open full case study
              </Link>
              {selectedProject.liveUrl && (
                <a
                  href={selectedProject.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-background"
                >
                  <ExternalLink size={14} /> Open live project
                </a>
              )}
              <button
                type="button"
                onClick={() => void shareProject(selectedProject)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground hover:border-primary hover:text-primary"
              >
                <Share2 size={14} /> Share project
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Testimonials({ data }: { data: PortfolioData }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const quoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data.testimonials || data.testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % data.testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [data.testimonials]);

  useEffect(() => {
    if (!quoteRef.current) return;
    const { gsap } = registerGsap();
    gsap.fromTo(
      quoteRef.current,
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "folio" },
    );
  }, [currentIndex]);

  if (!data.testimonials || data.testimonials.length === 0) return null;
  const item = data.testimonials[currentIndex];
  const changeTestimonial = (direction: number) => {
    setCurrentIndex(
      (index) =>
        (index + direction + data.testimonials.length) %
        data.testimonials.length,
    );
  };

  return (
    <section
      id="testimonials"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-5 sm:py-20 md:px-8 md:py-24 lg:px-10 lg:py-32"
    >
      <SectionLabel number="06" icon={<Quote size={14} />}>
        TESTIMONIALS
      </SectionLabel>
      <div className="relative overflow-hidden px-2 py-12 sm:px-8 sm:py-16 lg:px-16 lg:py-20">
        <div className="relative z-10 flex min-h-[250px] flex-col items-center justify-center text-center">
          <div
            data-gsap-testimonial
            className="flex w-full max-w-5xl cursor-grab flex-col items-center active:cursor-grabbing"
          >
            <div ref={quoteRef} className="flex w-full flex-col items-center">
              <div
                className="mb-6 flex items-center gap-1 text-primary"
                aria-label="5 out of 5 stars"
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    size={18}
                    fill="currentColor"
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <p className="max-w-5xl text-center text-2xl font-bold leading-[1.4] tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                {item?.quote ||
                  "The best work makes the difficult feel possible."}
              </p>
              <div className="mt-8 text-center">
                <p className="font-mono text-[12px] font-bold uppercase tracking-[.1em] text-foreground">
                  {item?.name}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {item?.role}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-center gap-3">
            {data.testimonials.length > 1 && (
              <button
                data-testimonial-prev
                type="button"
                onClick={() => changeTestimonial(-1)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-secondary text-foreground transition-colors hover:border-primary hover:text-primary"
                aria-label="Previous testimonial"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            {data.testimonials.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 cursor-pointer rounded-full transition-all duration-500 ease-in-out ${
                  currentIndex === idx
                    ? "w-8 bg-primary"
                    : "w-2 bg-border hover:bg-muted-foreground"
                }`}
                aria-label={`View testimonial ${idx + 1}`}
              />
            ))}
            {data.testimonials.length > 1 && (
              <button
                data-testimonial-next
                type="button"
                onClick={() => changeTestimonial(1)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-secondary text-foreground transition-colors hover:border-primary hover:text-primary"
                aria-label="Next testimonial"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const { containerRef: turnstileRef, execute: executeTurnstile } =
    useTurnstile("contact");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("sending");
    try {
      const turnstileToken = await executeTurnstile();
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          "cf-turnstile-response": turnstileToken,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.message);
      }
      setForm({ name: "", email: "", message: "" });
      setStatus("idle");
      toast.success("Message sent successfully!");
    } catch (error) {
      setStatus("idle");
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bento-card mt-12 grid gap-6 p-8 sm:grid-cols-2 sm:p-10"
      data-testid="form-contact"
    >
      <label className="sm:col-span-1">
        <span className="mb-3 block font-mono text-[11px] font-semibold uppercase tracking-[.15em] text-muted-foreground">
          Your name
        </span>
        <input
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="w-full rounded-xl border border-border bg-secondary px-5 py-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-background"
          placeholder="Jane Doe"
          data-testid="input-contact-name"
        />
      </label>
      <label className="sm:col-span-1">
        <span className="mb-3 block font-mono text-[11px] font-semibold uppercase tracking-[.15em] text-muted-foreground">
          Your email
        </span>
        <input
          required
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          className="w-full rounded-xl border border-border bg-secondary px-5 py-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-background"
          placeholder="jane@example.com"
          data-testid="input-contact-email"
        />
      </label>
      <label className="sm:col-span-2">
        <span className="mb-3 block font-mono text-[11px] font-semibold uppercase tracking-[.15em] text-muted-foreground">
          Message
        </span>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(event) =>
            setForm({ ...form, message: event.target.value })
          }
          className="w-full resize-y rounded-xl border border-border bg-secondary px-5 py-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-background"
          placeholder="Tell me about your project..."
          data-testid="input-contact-message"
        />
      </label>
      <div className="flex flex-col items-start gap-4 sm:col-span-2 sm:flex-row sm:items-center mt-2">
        <div>
          <div ref={turnstileRef} aria-hidden="true" />
        </div>
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex w-full sm:w-auto justify-center items-center gap-3 rounded-full bg-primary px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-[.1em] text-background transition-all glow-border disabled:cursor-not-allowed disabled:opacity-60"
          data-magnetic
          data-testid="button-send-message"
        >
          {status === "sending" ? "Sending…" : "Send message"}
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

function Contact({ profile }: { profile: Profile }) {
  const titleLines = profile.contactTitle.split("\n");
  return (
    <section
      id="contact"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-5 sm:py-20 md:px-8 md:py-24 lg:px-10 lg:py-32"
    >
      <SectionLabel number="07" icon={<Mail size={14} />}>
        CONTACT
      </SectionLabel>
      <div className="grid items-start gap-16 lg:grid-cols-[1fr_1.15fr]">
        <div data-gsap-reveal="up">
          <h2
            data-gsap-split-scroll
            className="display-title text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            {titleLines.map((line, index) => (
              <span key={index}>
                {line}
                {index < titleLines.length - 1 && <br />}
              </span>
            ))}
          </h2>
          {profile.contactNote && (
            <p className="mt-8 max-w-md text-base leading-[1.8] text-muted-foreground">
              {profile.contactNote}
            </p>
          )}
          <ContactLinks profile={profile} variant="contact" />
        </div>
        <div data-gsap-reveal="left">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}

function ContactLinks({
  profile,
  variant,
}: {
  profile: Profile;
  variant: "contact" | "footer";
}) {
  const isContact = variant === "contact";
  const [copiedEmail, setCopiedEmail] = useState(false);
  const linkClass = isContact
    ? "group flex min-h-14 items-center gap-3 border-b border-border py-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground transition-colors hover:text-primary"
    : "group inline-flex items-center gap-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground transition-colors hover:text-primary";
  const iconClass = isContact
    ? "h-4 w-4 shrink-0 text-primary"
    : "h-4 w-4 shrink-0 text-primary";
  return (
    <div
      className={
        isContact
          ? "mt-10 grid max-w-xl gap-x-6 gap-y-2 sm:grid-cols-2"
          : "mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-b border-border pb-8"
      }
    >
      <a
        href={`https://${profile.github.replace(/^https?:\/\//, "")}`}
        className={linkClass}
      >
        <FaGithub className={iconClass} />
        {profile.github}
      </a>

      {profile.linkedin && (
        <a
          href={`https://${profile.linkedin.replace(/^https?:\/\//, "")}`}
          className={linkClass}
        >
          <FaLinkedin className={iconClass} />
          {profile.linkedin}
        </a>
      )}

      {profile.socialLinks
        ?.filter((link) => !link.locations || link.locations.includes(variant))
        .map((link) => (
          <a
            key={link.id}
            href={
              /^https?:\/\//i.test(link.url) ? link.url : `https://${link.url}`
            }
            target="_blank"
            rel="noreferrer"
            data-magnetic
            className={linkClass}
            aria-label={`Open ${link.label}`}
          >
            <SocialIcon
              label={link.label}
              icon={link.icon}
              iconImage={link.iconImage}
              size={16}
              className="shrink-0 text-primary pointer-events-none"
            />
            {link.label}
          </a>
        ))}

      <div
        className={
          isContact
            ? "flex min-h-14 items-center border-b border-border"
            : "contents"
        }
      >
        <a
          href={`mailto:${profile.email}`}
          className={`${linkClass} min-w-0 flex-1 border-0`}
        >
          <Mail className={iconClass} size={16} />
          <span className="truncate">say hello</span>
        </a>
        {isContact && (
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(profile.email);
                setCopiedEmail(true);
                toast.success("Email copied");
                window.setTimeout(() => setCopiedEmail(false), 1800);
              } catch {
                toast.error("Could not copy email");
              }
            }}
            aria-label={copiedEmail ? "Email copied" : "Copy email address"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {copiedEmail ? <Check size={14} /> : <Copy size={14} />}
          </button>
        )}
      </div>

      {profile.phone && (
        <a href={`tel:${profile.phone}`} className={linkClass}>
          <Phone className={iconClass} size={16} />
          {profile.phone}
        </a>
      )}

      <div className={linkClass}>
        <MapPin className={iconClass} size={16} />
        {profile.location}
      </div>
    </div>
  );
}

function Footer({ profile }: { profile: Profile }) {
  return (
    <footer className="glass-footer px-4 py-8 sm:px-5 sm:py-12 md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center text-center">
        <ContactLinks profile={profile} variant="footer" />
        <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            © {new Date().getFullYear()} {profile.name}
          </span>
          <span className="flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Built with code & coffee
          </span>
        </div>
      </div>
    </footer>
  );
}

function ThankYouSection({ profile }: { profile: Profile }) {
  return (
    <section className="border-y border-border/70 px-4 py-20 sm:px-5 sm:py-28 md:px-8 lg:px-10">
      <div
        data-gsap-thanks
        className="mx-auto flex w-full max-w-7xl flex-col items-center text-center"
      >
        <div>
          <p className="w-full text-center font-mono text-[11px] font-semibold uppercase tracking-[.2em] text-primary">
            End note
          </p>
          <h2 className="display-title mt-4 flex flex-wrap items-center justify-center gap-3 text-5xl font-bold leading-none text-foreground sm:text-7xl lg:text-8xl">
            Thank you<span className="text-primary">.</span>
            <Heart
              className="heartbeat h-8 w-8 text-primary sm:h-12 sm:w-12"
              fill="currentColor"
              aria-hidden="true"
            />
          </h2>
        </div>
        <p data-gsap-typewriter className="mt-7 w-full max-w-2xl text-center text-base leading-7 text-muted-foreground sm:text-lg">
          Thanks for taking the time to look through {profile.name}&apos;s work.
        </p>
      </div>
    </section>
  );
}

export function PortfolioLoading({ error = false }: { error?: boolean } = {}) {
  return (
    <div className="loader-scene flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 text-center overflow-hidden">
      {error ? (
        <div className="loader-panel glass-surface max-w-sm p-8">
          <div className="loader-mark loader-mark-error mx-auto mb-6">!</div>
          <p className="font-mono text-[12px] font-bold uppercase tracking-wider text-red-400 mb-3">
            Unable to load portfolio
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            The content is taking a little longer than expected. Refresh the
            page and try again.
          </p>
        </div>
      ) : (
        <div className="loader-panel glass-surface w-full max-w-sm p-8">
          <div className="loader-mark mx-auto">AV</div>
          <div className="loader-terminal mt-7 text-left" aria-hidden="true">
            <p>
              <span className="text-primary">$</span> ./initialize-portfolio
              <span className="loader-cursor" />
            </p>
            <p className="loader-line">
              <span className="text-accent">[ok]</span> loading projects...
            </p>
            <p className="loader-line loader-line-delay">
              <span className="text-accent">[ok]</span> loading experience...
            </p>
          </div>
          <div className="mt-6 text-center">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[.2em] text-foreground">
              Opening portfolio
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Building a sharper view of the work.
            </p>
          </div>
          <div className="loader-track mt-7">
            <span />
          </div>
        </div>
      )}
    </div>
  );
}

export function PublicPortfolio() {
  const { data, isLoading, isError } = usePortfolioQuery();
  const shellRef = useRef<HTMLDivElement>(null);
  usePublicGsap(shellRef, Boolean(data) && !isLoading && !isError);
  const [themeOverride, setThemeOverride] = useState<"dark" | "light">("light");

  useEffect(() => {
    fetch("/api/site-settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((settings: { siteName?: string; faviconUrl?: string }) => {
        if (settings.siteName) document.title = settings.siteName;
        if (settings.faviconUrl) {
          document
            .querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')
            .forEach((link) => link.remove());
          const icon = document.createElement("link");
          icon.id = "site-favicon";
          icon.rel = "icon";
          icon.href = settings.faviconUrl.startsWith("data:")
            ? settings.faviconUrl
            : `${settings.faviconUrl}${settings.faviconUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;
          document.head.appendChild(icon);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const recordVisit = async () => {
      try {
        const storageKey = "portfolio-visitor-session";
        let sessionId = sessionStorage.getItem(storageKey);
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem(storageKey, sessionId);
        }
        const payload = {
          sessionId,
          ipAddress: "",
          country: "",
          region: "",
          city: "",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
          language: navigator.language || "",
          referrer: document.referrer || "",
          pathname: window.location.pathname,
          hostname: window.location.hostname,
          screenResolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
          pageTitle: document.title,
          userAgent: navigator.userAgent,
          isBot: /bot|crawl|spider|slurp|preview/i.test(navigator.userAgent),
        };

        await fetch("/api/visitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          cache: "no-store",
        });
      } catch (error) {
        console.warn("Visitor tracking failed:", error);
      }
    };

    void recordVisit();
  }, []);

  if (isLoading) return <PortfolioLoading />;
  if (isError || !data) return <PortfolioLoading error />;

  const themeMode = data.themeSettings?.mode ?? "light";
  const prefersLightMode =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: light)").matches;
  const resolvedMode =
    themeMode === "auto" ? (prefersLightMode ? "light" : "dark") : themeMode;
  const activeMode = themeOverride ?? resolvedMode;

  const customStyle = {
    "--primary": hexToHsl(data.themeSettings?.accentColor || "#10b981"),
    ...(activeMode === "light"
      ? {
          "--background": "40 100% 97%",
          "--foreground": "222 47% 13%",
          "--border": "35 26% 80%",
          "--input": "35 30% 84%",
          "--card": "40 100% 99%",
          "--card-foreground": "222 47% 13%",
          "--card-border": "35 30% 84%",
          "--primary-foreground": "40 100% 97%",
          "--secondary": "37 50% 92%",
          "--secondary-foreground": "222 47% 13%",
          "--muted": "37 45% 93%",
          "--muted-foreground": "220 18% 38%",
          "--accent": "174 55% 36%",
          "--accent-foreground": "40 100% 99%",
          "--destructive": "0 84% 60%",
          "--destructive-foreground": "0 0% 100%",
        }
      : {}),
  } as React.CSSProperties;

  return (
    <div
      id="top"
      ref={shellRef}
      className={`${activeMode === "light" ? "light" : "dark"} public-shell min-h-[100dvh] bg-background selection:bg-primary/20 selection:text-primary`}
      style={{
        ...customStyle,
        ["--scroll-progress" as string]: "0%",
      }}
    >
      <ToastContainer
        position="top-left"
        autoClose={5000}
        theme={activeMode}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div
        className="fixed left-0 right-0 top-0 z-[60] h-1 bg-border/40"
        aria-hidden="true"
      >
        <div
          data-gsap-progress
          className="h-full origin-left scale-x-0 bg-primary"
        />
      </div>
      <PublicNav
        data={data}
        isLight={activeMode === "light"}
        onToggleTheme={() =>
          setThemeOverride(activeMode === "light" ? "dark" : "light")
        }
      />
      <main>
        {data.sectionVisibility?.hero && <Hero profile={data.profile} />}
        {data.sectionVisibility?.services && (
          <Marquee services={data.services} />
        )}
        {data.sectionVisibility?.about && <About profile={data.profile} />}
        {data.sectionVisibility?.stats && <Stats stats={data.stats} />}
        {data.sectionVisibility?.education && <Timeline data={data} />}
        {data.sectionVisibility?.experience && (
          <ExperienceSection data={data} />
        )}
        {data.sectionVisibility?.services && <Services data={data} />}
        {data.sectionVisibility?.projects && <Work data={data} />}
        {data.sectionVisibility?.testimonials && <Testimonials data={data} />}
        {data.sectionVisibility?.contact && <Contact profile={data.profile} />}
      </main>
      <ThankYouSection profile={data.profile} />
      <a
        href="#top"
        data-gsap-backtop
        className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full p-[2px] text-primary shadow-lg sm:bottom-6 sm:right-6"
        style={{
          background:
            "conic-gradient(hsl(var(--primary)) var(--scroll-progress), hsl(var(--border)) var(--scroll-progress) 100%)",
        }}
        aria-label="Back to top"
      >
        <span className="flex h-full w-full items-center justify-center rounded-full bg-secondary hover:bg-primary hover:text-background">
          ↑
        </span>
      </a>
      <Footer profile={data.profile} />
    </div>
  );
}
