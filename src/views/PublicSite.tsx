"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import {
  ArrowUp,
  ArrowUpRight,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  Download,
  ExternalLink,
  GraduationCap,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Share2,
  Send,
  Sparkles,
  Star,
  Phone,
  X,
} from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { toast } from "react-toastify";
import Link from "next/link";
import { useMotionFlow } from "@/lib/motionflow";
import {
  DEFAULT_ABOUT_IMAGE,
  DEFAULT_PROFILE_IMAGE,
  DEFAULT_PROJECT_IMAGES,
} from "@/lib/portfolio-types";
import type {
  PortfolioData,
  Profile,
  Project,
  Stat,
} from "@/lib/portfolio-types";
import { usePortfolioQuery } from "@/lib/portfolio-api";
import { useTurnstile } from "@/components/Turnstile";
import { CookieConsent } from "@/components/CookieConsent";
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

function navigateToSection(
  event: MouseEvent<HTMLAnchorElement>,
  sectionId: string,
) {
  event.preventDefault();
  document
    .getElementById(sectionId)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
}

function SectionLabel({
  number,
  children,
}: {
  number: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-baseline gap-3">
      <span className="font-mono text-xs font-medium text-muted-foreground">
        {number}
      </span>
      <span
        data-mf-animation="fade-up"
        data-mf-animation-once="true"
        className="font-sans text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
      >
        {children}
      </span>
    </div>
  );
}

function Hero({
  profile,
  stats,
  showStats,
  navItems,
}: {
  profile: Profile;
  stats: Stat[];
  showStats: boolean;
  navItems: Array<{ id: string; label: string }>;
}) {
  const [activeSection, setActiveSection] = useState(navItems[0]?.id ?? "");
  const navItemIds = navItems.map(({ id }) => id).join(",");
  const roles = (
    profile.roles?.length ? profile.roles : [profile.tagline]
  ).filter(Boolean);
  const heroBadge =
    profile.tagline === "Editor • Developer • YouTuber" ||
    profile.tagline === "Editor • Developer • Youtuber"
      ? "Available for freelance work"
      : profile.tagline || "Available for freelance work";
  const resumeHref = profile.resume || "#contact";
  const heroImage = profile.image || DEFAULT_PROFILE_IMAGE;

  const handleResumeDownload = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    try {
      const response = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: resumeHref,
          filename: profile.resumeName || "resume.pdf",
        }),
      });
      if (!response.ok) throw new Error("Resume download failed");

      const blobUrl = URL.createObjectURL(await response.blob());
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = profile.resumeName || "resume.pdf";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Unable to download the resume right now.");
    }
  };

  useEffect(() => {
    const sectionIds = navItemIds.split(",").filter(Boolean);
    if (!sectionIds.length) return;

    let frameId = 0;
    const updateActiveSection = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const anchor = window.innerHeight * 0.32;
        const sections = sectionIds
          .map((id) => document.getElementById(id))
          .filter((section): section is HTMLElement => section !== null);
        const currentSection = sections.find((section) => {
          const bounds = section.getBoundingClientRect();
          return bounds.top <= anchor && bounds.bottom > anchor;
        });
        const nextSection =
          currentSection ||
          sections.find((section) => section.getBoundingClientRect().top > anchor) ||
          sections[sections.length - 1];

        if (nextSection) setActiveSection(nextSection.id);
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [navItemIds]);

  return (
    <section
      id="hero"
      data-mf-animation="fade-up"
      data-mf-animation-once="true"
      className="portfolio-profile-panel relative bg-background px-5 py-10 sm:px-8 sm:py-12 lg:px-7"
    >
      <div className="portfolio-profile-content mx-auto w-full max-w-[28rem] text-center lg:text-left">
        <div className="portfolio-profile-header flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:text-left lg:justify-start">
          <div
            className="portfolio-profile-avatar relative h-20 w-20 shrink-0 rounded-full bg-gradient-to-br from-primary via-emerald-400 to-sky-400 p-[3px] shadow-lg shadow-primary/10 sm:h-24 sm:w-24"
          >
            <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-background bg-secondary">
              <Image
                src={heroImage}
                alt={profile.name}
                fill
                priority
                sizes="112px"
                className="object-cover"
              />
            </div>
          </div>
          <div>
            <p className="portfolio-profile-status inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-mono text-[10px] font-semibold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {heroBadge}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {profile.roles?.filter(Boolean).join(" · ") || profile.tagline}
            </p>
          </div>
        </div>

        <h1
          data-mf-animation="fade-up"
          data-mf-animation-once="true"
          className="portfolio-profile-name display-title mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl"
        >
          {profile.name}
        </h1>
        <p className="mt-1 font-mono text-[11px] font-semibold tracking-wide text-muted-foreground">
          Developer Akhil
        </p>

        {roles.length > 0 && (
          <div className="portfolio-profile-roles mt-3 flex flex-wrap justify-center gap-2 lg:justify-start">
            {roles.map((role, index) => (
              <span
                key={`${role}-${index}`}
                className="rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-foreground"
              >
                {role}
              </span>
            ))}
          </div>
        )}

        {showStats && stats.length > 0 && (
          <div
            id="stats"
            className="portfolio-profile-stats mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.id}
                data-testid={`stat-${stat.id}`}
                className="portfolio-profile-stat flex min-w-0 flex-col items-center justify-center rounded-xl border border-border/70 bg-card/55 px-2 py-3 text-center"
              >
                <span className="text-xl font-bold leading-none text-foreground">
                  <StatValue value={stat.value} />
                </span>
                <span className="mt-1.5 text-[10px] leading-4 text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <p
          data-hero-reveal
          className="portfolio-profile-bio mx-auto mt-4 max-w-[680px] text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7 lg:mx-0"
        >
          {profile.bio1}
        </p>

        <div className="portfolio-profile-socials mt-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
          {profile.github && (
            <a
              href={
                profile.github.startsWith("http")
                  ? profile.github
                  : `https://${profile.github}`
              }
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              aria-label="GitHub"
            >
              <FaGithub size={16} />
            </a>
          )}
          {profile.linkedin && (
            <a
              href={
                profile.linkedin.startsWith("http")
                  ? profile.linkedin
                  : `https://${profile.linkedin}`
              }
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              aria-label="LinkedIn"
            >
              <FaLinkedin size={16} />
            </a>
          )}
          {profile.socialLinks
            ?.filter((link) => !link.locations || link.locations.includes("nav"))
            .map((link) => (
              <a
                key={link.id}
                href={
                  /^https?:\/\//i.test(link.url)
                    ? link.url
                    : `https://${link.url}`
                }
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                aria-label={link.label}
              >
                <SocialIcon
                  label={link.label}
                  icon={link.icon}
                  iconImage={link.iconImage}
                  size={16}
                />
              </a>
            ))}
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className="rounded-full border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              aria-label="Email"
            >
              <Mail size={16} />
            </a>
          )}
        </div>

        <div className="portfolio-profile-actions mt-4 flex flex-wrap justify-center gap-3 lg:justify-start">
          <a
            href="#contact"
            onClick={(event) => navigateToSection(event, "contact")}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-mono text-xs font-semibold text-background shadow-[0_6px_18px_hsl(var(--foreground)/0.15)] transition-transform hover:-translate-y-0.5"
            data-testid="link-hero-work"
          >
            Let&apos;s build together <ArrowUpRight size={15} />
          </a>
          {profile.resume && (
            <button
              type="button"
              onClick={handleResumeDownload}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 font-mono text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              data-testid="link-hero-resume"
            >
              <Download size={15} />
              Download resume
            </button>
          )}
        </div>
        {navItems.length > 0 && (
          <nav
            aria-label="Portfolio sections"
            className="portfolio-section-links mt-5 hidden border-t border-border pt-4 lg:grid"
          >
            {navItems.map((item, index) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(event) => {
                  setActiveSection(item.id);
                  navigateToSection(event, item.id);
                }}
                className={`portfolio-section-link${activeSection === item.id ? " is-active" : ""}`}
                aria-current={activeSection === item.id ? "location" : undefined}
              >
                <span className="portfolio-section-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{item.label}</span>
                {activeSection === item.id && (
                  <ArrowUpRight
                    size={13}
                    aria-hidden="true"
                    className="portfolio-section-arrow"
                  />
                )}
              </a>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}

function About({
  profile,
  showSkills,
}: {
  profile: Profile;
  showSkills: boolean;
}) {
  return (
    <section
      id="about"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-5 sm:py-20 md:px-8 md:py-24 lg:px-10 lg:py-32"
    >
      <SectionLabel number="01">
        ABOUT
      </SectionLabel>
      <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-[1.05fr_1.35fr] lg:items-center lg:gap-10">
      <div className="w-full lg:w-auto">
        <div className="w-full overflow-hidden rounded-[1.5rem] border border-border/70 bg-card p-1.5 shadow-[0_22px_60px_rgba(15,23,42,0.12)] lg:max-w-[520px] lg:mx-0">
          <div className="about-image-card relative overflow-hidden rounded-[1.1rem] bg-secondary">
            <Image
              src={profile.aboutImage || DEFAULT_ABOUT_IMAGE}
              alt={profile.name}
              className="h-[300px] w-full object-cover object-center transition-transform duration-700 ease-out hover:scale-[1.02] sm:h-[420px] lg:h-[560px]"
              data-mf-parallax
              data-mf-parallax-speed="0.35"
              data-mf-parallax-speed-tablet="0"
              data-mf-parallax-speed-mobile="0"
              width={1400}
              height={900}
              sizes="(max-width: 767px) 100vw, 520px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020817]/80 via-[#020817]/15 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-7">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[.18em] text-primary sm:text-[10px]">
                Behind the work
              </p>
              <p className="mt-2 max-w-[24rem] text-xs font-medium text-white sm:text-sm lg:text-base">
                Developer · Creator · Problem solver
              </p>
            </div>
          </div>
        </div>
      </div>
        <div className="w-full max-w-[820px] mx-auto lg:mx-0 lg:max-w-none">
          <div
            data-mf-stagger-animation="fade-up"
            data-mf-stagger-once="true"
            className="grid gap-3 text-[clamp(.9rem,1.08vw,1rem)] leading-[1.7] text-muted-foreground sm:gap-5"
          >
            <p className="text-[clamp(1.8rem,3vw,2.6rem)] font-bold leading-[1.1] text-foreground">
              {profile.bio1}
            </p>
            <p>{profile.bio2}</p>
            <p>{profile.bio3}</p>
          </div>
          {showSkills &&
            (profile.skills?.length > 0 || profile.languages?.length > 0) && (
            <div
              id="skills"
              data-mf-animation="fade-up"
              data-mf-animation-once="true"
              className="mt-2 flex flex-wrap gap-2.5 pt-2"
            >
              {profile.skills?.map((skill) => (
                <span
                  key={skill}
                  data-scramble
                  className="inline-flex rounded-full border border-border bg-secondary px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-foreground"
                >
                  {skill}
                </span>
              ))}
              {profile.languages?.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-primary"
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
      <span data-mf-count-to={target} data-mf-count-once="true">
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
      className="border-b border-border px-4 py-8 sm:px-5 md:px-8 lg:px-10"
    >
      <div className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            data-testid={`stat-${stat.id}`}
            className="flex flex-col items-center px-2 py-3 text-center"
          >
            <span className="text-2xl font-bold leading-none text-foreground">
              <StatValue value={stat.value} />
            </span>
            <span className="mt-2 text-xs text-muted-foreground">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Timeline({ data }: { data: PortfolioData }) {
  return (
    <section
      id="education"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-5 sm:py-20 md:px-8 md:py-24 lg:px-10 lg:py-32"
    >
      <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr]">
        <div data-mf-animation="fade-up" data-mf-animation-once="true">
          <SectionLabel number="02">
            EDUCATION
          </SectionLabel>
          <h2 className="display-title text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-7xl">
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
              x1="20"
              y1="0"
              x2="20"
              y2="100%"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <div
            data-mf-stagger-animation="fade-left"
            data-mf-stagger-once="true"
            className="grid gap-6"
          >
            {data.education.map((item) => (
              <div
                className="timeline-entry bento-card group relative overflow-hidden p-5 sm:p-6"
                key={item.id}
              >
                <div className="timeline-entry-layout flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                  <div className="timeline-entry-period flex min-w-0 flex-wrap items-center gap-3 sm:w-40 sm:shrink-0">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/8 text-primary">
                      <GraduationCap size={16} />
                    </span>
                    <span className="timeline-entry-date min-w-0 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
                      {item.period}
                    </span>
                  </div>

                  <div className="timeline-entry-content min-w-0 flex-1">
                    <div className="timeline-entry-heading flex min-w-0 items-start justify-between gap-3">
                      <h3 className="min-w-0 flex-1 text-xl font-bold text-foreground">
                        {item.degree}
                      </h3>
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary/80 shadow-[0_0_18px_rgba(249,115,22,0.45)]" />
                    </div>
                    <p className="timeline-entry-subtitle mt-2 font-mono text-[11px] uppercase tracking-[.14em] text-muted-foreground">
                      {item.institution}
                    </p>
                    <p className="timeline-entry-detail mt-4 text-sm leading-[1.7] text-muted-foreground">
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
        <div data-mf-animation="fade-up" data-mf-animation-once="true">
          <SectionLabel number="03">
            EXPERIENCE
          </SectionLabel>
          <h2 className="display-title text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-7xl">
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
              x1="20"
              y1="0"
              x2="20"
              y2="100%"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <div
            data-mf-stagger-animation="fade-left"
            data-mf-stagger-once="true"
            className="grid gap-6"
          >
            {data.experience.map((item) => (
              <div
                className="timeline-entry bento-card group relative overflow-hidden p-5 sm:p-6"
                key={item.id}
              >
                <div className="timeline-entry-layout flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                  <div className="timeline-entry-period flex min-w-0 flex-wrap items-center gap-3 sm:w-40 sm:shrink-0">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/8 text-primary">
                      <BriefcaseBusiness size={16} />
                    </span>
                    <span className="timeline-entry-date min-w-0 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
                      {item.period}
                    </span>
                  </div>

                  <div className="timeline-entry-content min-w-0 flex-1">
                    <div className="timeline-entry-heading flex min-w-0 items-start justify-between gap-3">
                      <h3 className="min-w-0 flex-1 text-xl font-bold text-foreground">
                        {item.role}
                      </h3>
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary/80 shadow-[0_0_18px_rgba(249,115,22,0.45)]" />
                    </div>
                    <p className="timeline-entry-subtitle mt-2 font-mono text-[11px] uppercase tracking-[.14em] text-muted-foreground">
                      {item.company}
                    </p>
                    <p className="timeline-entry-detail mt-4 text-sm leading-[1.7] text-muted-foreground">
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
      <SectionLabel number="04">
        SERVICES
      </SectionLabel>

      <div
        data-mf-stagger-animation="zoom-in"
        data-mf-stagger-once="true"
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
  const isProjectModalOpen = selectedProject !== null;
  const selectedProjectIndex = selectedProject
    ? data.projects.findIndex((project) => project.id === selectedProject.id)
    : -1;
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isProjectModalOpen) return;

    const body = document.body;
    const root = document.documentElement;
    const scrollY = window.scrollY;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.getPropertyValue("top");
    const previousBodyTopPriority = body.style.getPropertyPriority("top");
    const previousBodyLeft = body.style.left;
    const previousBodyRight = body.style.right;
    const previousBodyWidth = body.style.width;
    const previousBodyOverflow = body.style.overflow;
    const previousRootOverflow = root.style.overflow;
    const previousRootScrollBehavior = root.style.scrollBehavior;

    body.style.position = "fixed";
    body.style.setProperty("top", `-${scrollY}px`, "important");
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    root.style.overflow = "hidden";

    return () => {
      body.style.position = previousBodyPosition;
      if (previousBodyTop) {
        body.style.setProperty(
          "top",
          previousBodyTop,
          previousBodyTopPriority,
        );
      } else {
        body.style.removeProperty("top");
      }
      body.style.left = previousBodyLeft;
      body.style.right = previousBodyRight;
      body.style.width = previousBodyWidth;
      body.style.overflow = previousBodyOverflow;
      root.style.overflow = previousRootOverflow;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, scrollY);
      root.style.scrollBehavior = previousRootScrollBehavior;
    };
  }, [isProjectModalOpen]);

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
    setActiveCategory(category);
  };

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
      className="mx-auto max-w-[58rem] border-b border-border px-4 py-12 sm:px-6 sm:py-16"
    >
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <SectionLabel number="05">
            Selected projects
          </SectionLabel>
          <p className="text-sm text-muted-foreground">
            A few things I have built and shipped.
          </p>
        </div>
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
              className={`rounded-full border px-3 py-1.5 font-mono text-[10px] font-medium transition-colors ${
                activeCategory === category
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={gridRef}
        data-project-grid
        className="divide-y divide-border border-y border-border"
      >
        {data.projects.map((project, index) => {
          const category = project.category.trim() || "Uncategorized";
          const isHidden =
            activeCategory !== "All projects" && category !== activeCategory;
          const projectImage =
            project.image ||
            DEFAULT_PROJECT_IMAGES[index % DEFAULT_PROJECT_IMAGES.length];
          return (
            <article
              key={project.id}
              data-project-card
              className={`group flex flex-col gap-4 py-5 transition-opacity sm:flex-row sm:items-start sm:gap-5 ${isHidden ? "hidden" : ""}`}
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
                <Image
                  src={projectImage}
                  alt={project.title}
                  loading="lazy"
                  fill
                  sizes="(max-width: 40rem) calc(100vw - 4rem), (max-width: 63.99rem) calc((100vw - 5rem) / 2), 27.5rem"
                  quality={75}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-medium text-muted-foreground">
                      {category}
                    </p>
                    <h3 className="mt-1 text-lg font-bold leading-snug text-foreground sm:text-xl">
                    {project.title}
                    </h3>
                  </div>
                  <span className="shrink-0 pt-1 font-mono text-xs text-muted-foreground">
                    {project.year}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {project.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProject(project)}
                    className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-foreground transition-colors hover:text-primary"
                  >
                    Details <ArrowUpRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void shareProject(project)}
                    aria-label={`Share ${project.title}`}
                    className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Share2 size={12} /> Share
                  </button>
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary"
                    >
                      Live project <ExternalLink size={12} />
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
          <div
            data-modal-card
            className="bento-card relative max-h-[85vh] w-full max-w-2xl overflow-y-auto p-5 pb-8 sm:p-6 sm:pb-9 lg:p-8 lg:pb-10"
          >
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
    quoteRef.current.classList.remove("testimonial-enter");
    void quoteRef.current.offsetWidth;
    quoteRef.current.classList.add("testimonial-enter");
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
      <SectionLabel number="06">
        TESTIMONIALS
      </SectionLabel>
      <div className="relative overflow-hidden px-2 py-12 sm:px-8 sm:py-16 lg:px-16 lg:py-20">
        <div className="relative z-10 flex min-h-[250px] flex-col items-center justify-center text-center">
          <div className="flex w-full max-w-5xl cursor-grab flex-col items-center active:cursor-grabbing">
            <div
              ref={quoteRef}
              className="testimonial-enter flex w-full flex-col items-center"
            >
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
          aria-busy={status === "sending"}
          className="inline-flex w-full sm:w-auto justify-center items-center gap-3 rounded-full bg-primary px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-[.1em] text-background transition-all glow-border disabled:cursor-not-allowed disabled:opacity-60"
          data-magnetic
          data-testid="button-send-message"
        >
          {status === "sending" ? (
            <>
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
              Sending…
            </>
          ) : (
            <>
              Send message
              <ArrowUpRight className="h-4 w-4" />
            </>
          )}
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
      <SectionLabel number="07">
        CONTACT
      </SectionLabel>
      <div className="grid items-start gap-16 lg:grid-cols-[1fr_1.15fr]">
        <div data-mf-animation="fade-up" data-mf-animation-once="true">
          <h2 className="display-title text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
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
        <div data-mf-animation="fade-left" data-mf-animation-once="true">
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
        data-mf-animation="fade-up"
        data-mf-animation-once="true"
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
        <p className="mt-7 w-full max-w-2xl text-center text-base leading-7 text-muted-foreground sm:text-lg">
          Thanks for taking the time to look through {profile.name}&apos;s work.
        </p>
      </div>
    </section>
  );
}

export function PortfolioLoading({ error = false }: { error?: boolean } = {}) {
  return (
    <div className="loader-scene flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-0 text-center">
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
        <div
          className="loader-minimal flex min-h-[100dvh] w-full items-center justify-center bg-background px-5"
          aria-label="Loading portfolio"
        >
          <div className="flex flex-col items-center text-center">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.24em] text-foreground">
              Akhilesh Vishwakarma
            </p>
            <div className="loader-minimal-dots mt-5" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type AssistantMessage = { role: "user" | "assistant"; content: string };

function cleanAssistantText(value: string): string {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*[*-]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function PortfolioAssistant({
  data,
  onUnavailable,
}: {
  data: PortfolioData;
  onUnavailable: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content:
        "Hi. Ask me about the work, skills, or services on this portfolio.",
    },
  ]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const askAssistant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuestion = question.trim();
    if (!nextQuestion || isSending) return;

    const nextMessages = [
      ...messages,
      { role: "user" as const, content: nextQuestion },
    ];
    setMessages(nextMessages);
    setQuestion("");
    setIsSending(true);

    const portfolio = {
      profile: {
        name: data.profile.name,
        tagline: data.profile.tagline,
        roles: data.profile.roles,
        bio1: data.profile.bio1,
        bio2: data.profile.bio2,
        bio3: data.profile.bio3,
        location: data.profile.location,
        skills: data.profile.skills,
        languages: data.profile.languages,
        email: data.profile.email,
        phone: data.profile.phone,
        github: data.profile.github,
        linkedin: data.profile.linkedin,
        services: data.services.map((service) => service.title),
      },
      experience: data.experience,
      education: data.education,
      projects: data.projects.map(
        ({ title, category, year, description, tags }) => ({
          title,
          category,
          year,
          description,
          tags,
        }),
      ),
      testimonials: data.testimonials,
    };

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: nextQuestion,
          portfolio,
          history: nextMessages.slice(-6),
        }),
      });
      const result = (await response.json()) as {
        answer?: string;
        error?: string;
      };
      if (!response.ok) {
        onUnavailable();
        return;
      }
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: cleanAssistantText(
            result.answer ||
              result.error ||
              "Please use the contact section for help.",
          ),
        },
      ]);
    } catch {
      onUnavailable();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="portfolio-assistant fixed bottom-4 left-4 z-50 sm:bottom-6 sm:left-6">
      {open && (
        <div
          role="dialog"
          aria-label="Portfolio assistant"
          className="assistant-panel mb-3 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between bg-foreground px-4 py-3 text-background">
            <div className="flex items-center gap-3">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles size={16} />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-foreground" />
              </span>
              <div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[.2em] text-primary">
                  AI / PORTFOLIO GUIDE
                </p>
                <p className="mt-1 text-xs text-background/65">
                  Ask anything about the work
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-background/65 transition-colors hover:bg-background/10 hover:text-background"
              aria-label="Close assistant"
            >
              <X size={16} />
            </button>
          </div>
          <div
            className="assistant-messages flex max-h-[min(22rem,55vh)] flex-col gap-3 overflow-y-auto bg-background/60 p-4"
            aria-live="polite"
          >
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm ${message.role === "user" ? "self-end rounded-br-md bg-primary text-primary-foreground" : "self-start rounded-bl-md border border-border/70 bg-card text-foreground"}`}
              >
                {message.content}
              </div>
            ))}
            {isSending && (
              <div className="assistant-thinking self-start rounded-2xl rounded-bl-md border border-border/70 bg-card px-3.5 py-2.5 text-sm text-muted-foreground">
                <span>Thinking</span>
                <i />
                <i />
                <i />
              </div>
            )}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>
          {messages.length === 1 && (
            <div className="assistant-prompts flex gap-2 overflow-x-auto border-t border-border/60 px-3 py-3">
              {["Services", "Projects", "Experience"].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() =>
                    setQuestion(
                      prompt === "Services"
                        ? "What services are available?"
                        : prompt === "Projects"
                          ? "Tell me about the projects"
                          : "Tell me about the work experience",
                    )
                  }
                  className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-left text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={askAssistant}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={600}
              placeholder="Ask a question..."
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground placeholder:opacity-100 outline-none focus:border-primary"
              aria-label="Ask the portfolio assistant"
            />
            <button
              type="submit"
              disabled={isSending || !question.trim()}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send question"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="assistant-trigger inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-background shadow-xl transition-transform hover:-translate-y-1"
        aria-expanded={open}
        aria-label="Open portfolio assistant"
      >
        <MessageCircle size={16} />
        <span>{open ? "Close" : "Ask AI"}</span>
      </button>
    </div>
  );
}

export function PublicPortfolio({
  initialData,
}: {
  initialData: PortfolioData;
}) {
  const { data, isLoading, isError } = usePortfolioQuery(initialData);
  const shellRef = useRef<HTMLDivElement>(null);
  useMotionFlow([Boolean(data), isLoading, isError]);
  const [themeOverride, setThemeOverride] = useState<"dark" | "light">("light");
  const [aiAvailable, setAiAvailable] = useState(false);

  useEffect(() => {
    let frame = 0;
    const updateScrollProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const documentHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress =
          documentHeight > 0 ? (window.scrollY / documentHeight) * 100 : 0;
        shellRef.current?.style.setProperty(
          "--scroll-progress",
          `${progress}%`,
        );
      });
    };
    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateScrollProgress);
      window.removeEventListener("resize", updateScrollProgress);
    };
  }, []);

  useEffect(() => {
    fetch("/api/ai/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((status: { available?: boolean }) =>
        setAiAvailable(Boolean(status.available)),
      )
      .catch(() => setAiAvailable(false));
  }, []);

  useEffect(() => {
    const loadSiteSettings = () => {
      fetch("/api/site-settings", { cache: "no-store" })
        .then((response) => response.json())
        .then(
          (settings: {
            faviconUrl?: string;
          }) => {
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
          },
        )
        .catch(() => undefined);
    };
    const idleId =
      window.requestIdleCallback?.(loadSiteSettings) ??
      window.setTimeout(loadSiteSettings, 1500);
    return () => {
      if (typeof idleId === "number") window.clearTimeout(idleId);
    };
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

    const idleId =
      window.requestIdleCallback?.(() => void recordVisit()) ??
      window.setTimeout(() => void recordVisit(), 2000);
    return () => {
      if (typeof idleId === "number") window.clearTimeout(idleId);
    };
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
          "--background": "38 38% 96%",
          "--foreground": "222 24% 12%",
          "--border": "32 16% 85%",
          "--input": "32 16% 85%",
          "--card": "40 33% 99%",
          "--card-foreground": "222 24% 12%",
          "--card-border": "32 16% 87%",
          "--primary-foreground": "0 0% 100%",
          "--secondary": "34 24% 92%",
          "--secondary-foreground": "222 24% 12%",
          "--muted": "34 24% 92%",
          "--muted-foreground": "222 9% 42%",
          "--accent": "154 52% 31%",
          "--accent-foreground": "0 0% 100%",
          "--destructive": "0 84% 60%",
          "--destructive-foreground": "0 0% 100%",
        }
      : {}),
  } as React.CSSProperties;
  const portfolioNavItems = [
    { id: "about", label: "About", visible: data.sectionVisibility?.about },
    {
      id: "skills",
      label: "Skills",
      visible:
        data.sectionVisibility?.about &&
        (data.sectionVisibility?.skills ?? true) &&
        (data.profile.skills?.length > 0 || data.profile.languages?.length > 0),
    },
    { id: "education", label: "Education", visible: data.sectionVisibility?.education },
    { id: "experience", label: "Experience", visible: data.sectionVisibility?.experience },
    { id: "services", label: "Services", visible: data.sectionVisibility?.services },
    { id: "work", label: "Projects", visible: data.sectionVisibility?.projects },
    { id: "testimonials", label: "Testimonials", visible: data.sectionVisibility?.testimonials },
    { id: "contact", label: "Contact", visible: data.sectionVisibility?.contact },
  ].filter((item) => item.visible);

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
      <div
        className="fixed left-0 right-0 top-0 z-[60] h-1 bg-border/40"
        aria-hidden="true"
      >
        <div
          className="h-full bg-primary transition-[width] duration-100 motion-reduce:transition-none"
          style={{ width: "var(--scroll-progress, 0%)" }}
        />
      </div>
      <PublicNav
        data={data}
        isLight={activeMode === "light"}
        onToggleTheme={() =>
          setThemeOverride(activeMode === "light" ? "dark" : "light")
        }
      />
      <main
        className={`portfolio-layout${data.sectionVisibility?.hero ? "" : " portfolio-layout-no-profile"}`}
      >
        {data.sectionVisibility?.hero && (
          <Hero
            profile={data.profile}
            stats={data.stats}
            showStats={Boolean(data.sectionVisibility?.stats)}
            navItems={portfolioNavItems}
          />
        )}
        <div className="portfolio-content">
          {!data.sectionVisibility?.hero &&
            data.sectionVisibility?.stats &&
            data.stats.length > 0 && <Stats stats={data.stats} />}
          {data.sectionVisibility?.about && (
            <About
              profile={data.profile}
              showSkills={data.sectionVisibility?.skills ?? true}
            />
          )}
          {data.sectionVisibility?.education && <Timeline data={data} />}
          {data.sectionVisibility?.experience && (
            <ExperienceSection data={data} />
          )}
          {data.sectionVisibility?.services && <Services data={data} />}
          {data.sectionVisibility?.projects && <Work data={data} />}
          {data.sectionVisibility?.testimonials && (
            <Testimonials data={data} />
          )}
          {data.sectionVisibility?.contact && (
            <Contact profile={data.profile} />
          )}
          <ThankYouSection profile={data.profile} />
          <Footer profile={data.profile} />
        </div>
      </main>
      <a
        href="#top"
        onClick={(event) => navigateToSection(event, "top")}
        className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full p-[2px] text-primary shadow-lg sm:bottom-6 sm:right-6"
        style={{
          background:
            "conic-gradient(hsl(var(--primary)) var(--scroll-progress), hsl(var(--border)) var(--scroll-progress) 100%)",
        }}
        aria-label="Back to top"
        title="Back to top"
      >
        <span className="flex h-full w-full items-center justify-center rounded-full bg-secondary hover:bg-primary hover:text-background">
          <ArrowUp size={17} aria-hidden="true" />
        </span>
      </a>
      {aiAvailable && (
        <PortfolioAssistant
          data={data}
          onUnavailable={() => setAiAvailable(false)}
        />
      )}
      <CookieConsent />
    </div>
  );
}
