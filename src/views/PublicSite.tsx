"use client";

import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Mail,
  MapPin,
  Menu,
  Minus,
  Moon,
  Plus,
  Sun,
  Phone,
  X,
} from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import Link from "next/link";
import { useMotionFlow } from "@/lib/motionflow";
import type {
  PortfolioData,
  Profile,
  Project,
  Service,
  Stat,
} from "@/lib/portfolio-types";
import { usePortfolioQuery } from "@/lib/portfolio-api";
import { useTurnstile } from "@/components/Turnstile";
import { PublicNav } from "@/components/public/PublicNav";
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
}: {
  number: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-12 flex items-center gap-4">
      <span className="font-mono text-primary font-bold">{number}</span>
      <span className="font-mono text-[12px] uppercase tracking-[.2em] text-foreground font-semibold">
        {/* // */} {children}
      </span>
      <span className="h-px w-16 bg-border" />
    </div>
  );
}

function TypingRoles({ roles }: { roles: string[] }) {
  const safeRoles = roles.filter(Boolean);

  if (!safeRoles.length) {
    return (
      <span className="font-mono text-[11px] uppercase tracking-[.15em] text-foreground font-semibold">
        Developer
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.15em] text-foreground font-semibold">
      <span>I am a</span>
      <span
        data-mf-text-type="typing"
        data-mf-text-typing-speed="85"
        data-mf-text-typing-delete-speed="45"
        data-mf-text-typing-interval="1200"
        data-mf-text-typing-loop="true"
        data-mf-text-typing-cursor="true"
        className="inline-flex min-w-[120px] items-center text-primary"
        dangerouslySetInnerHTML={{
          __html: safeRoles.map((role) => `<span>${role}</span>`).join(""),
        }}
      />
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

  return (
    <section className="relative flex min-h-[min(900px,100dvh)] items-center overflow-hidden bg-background px-4 pb-12 pt-24 sm:px-5 sm:pb-16 sm:pt-32 md:px-8 md:pb-20 lg:px-10 lg:pb-24">
      <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-10 z-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col items-start">
          <div className="reveal inline-flex items-center gap-3 rounded-full border border-border bg-background/50 px-5 py-2.5 mb-8 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="font-mono text-[11px] uppercase tracking-[.15em] text-foreground font-semibold">
              {heroBadge}
            </p>
          </div>

          <h1 className="display-title reveal reveal-delay-1 max-w-5xl text-[clamp(3rem,7vw,6rem)] font-bold leading-[1.05] text-foreground tracking-tight">
            {profile.name}
          </h1>

          <div className="reveal reveal-delay-2 mt-6 flex items-center gap-2 text-[11px] uppercase tracking-[.18em] text-muted-foreground">
            <TypingRoles roles={roles} />
          </div>

          <p className="reveal reveal-delay-3 mt-8 max-w-2xl text-lg leading-[1.8] text-muted-foreground">
            {profile.bio1}
          </p>

          <div className="reveal reveal-delay-4 mt-12 flex flex-wrap items-center gap-4">
            <a
              href="#work"
              className="group inline-flex w-fit items-center gap-3 rounded-full bg-primary px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-[.1em] text-background transition-all duration-300 hover:scale-105 glow-border"
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
              className="group inline-flex w-fit items-center gap-3 rounded-full border border-primary/60 bg-primary/10 px-8 py-4 font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-foreground transition-all duration-300 hover:border-primary hover:text-primary"
              data-testid="link-hero-resume"
            >
              <Download className="h-4 w-4" />
              Download resume
            </a>
          </div>
        </div>

        {(profile.heroImage || profile.image) && (
          <div className="reveal reveal-delay-2 relative mx-auto w-full max-w-[420px]">
            <div className="absolute -inset-8 -z-10 rounded-full bg-primary/10 blur-3xl" />
            <div className="portrait-frame aspect-[4/5] p-3">
              <Image
                src={profile.heroImage || profile.image}
                alt={profile.name}
                className="h-full w-full rounded-[1.1rem] object-cover"
                width={420}
                height={300}
              />
              <div className="portrait-wash absolute inset-3 rounded-[1.1rem]" />
              <div className="absolute inset-x-7 bottom-7 z-10 flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
                    Currently building
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    Digital products with purpose.
                  </p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/20 text-primary backdrop-blur-md">
                  <ArrowUpRight size={15} />
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-[10px] uppercase tracking-wider">
              <div className="glass-surface rounded-lg px-3 py-3 text-muted-foreground">
                <span className="mb-1 block text-primary">Based in</span>
                {profile.location}
              </div>
              <a
                href={`mailto:${profile.email}`}
                className="glass-surface rounded-lg px-3 py-3 text-muted-foreground transition-colors hover:text-primary"
              >
                <span className="mb-1 block text-primary">Open to</span>
                Collaborations
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function About({ profile }: { profile: Profile }) {
  return (
    <section
      id="about"
      className="mx-auto max-w-[1400px] px-4 py-16 sm:px-5 sm:py-20 md:px-8 md:py-24 lg:px-10 lg:py-32"
    >
      <div className="bento-card p-5 sm:p-5 sm:p-6 lg:p-8 lg:p-10">
        <SectionLabel number="01">ABOUT</SectionLabel>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] items-start">
          <div className="space-y-6">
            {profile.aboutImage || profile.heroImage || profile.image ? (
              <div className="portrait-frame aspect-[4/5] p-3">
                <Image
                  src={profile.aboutImage || profile.heroImage || profile.image}
                  alt={profile.name}
                  className="h-full w-full rounded-[1.1rem] object-cover"
                  width={420}
                  height={300}
                />
                <div className="portrait-wash absolute inset-3 rounded-[1.1rem]" />
                <div className="absolute bottom-7 left-7 z-10">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
                    Profile / Snapshot
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    Developer · Creator · Problem solver
                  </p>
                </div>
              </div>
            ) : null}
            <p
              data-mf-animation="fade-up"
              className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold leading-[1.3] text-foreground"
            >
              {profile.bio1}
            </p>
            {(profile.skills?.length > 0 || profile.languages?.length > 0) && (
              <div
                data-mf-animation="fade-up"
                className="mt-8 flex flex-wrap gap-2"
              >
                {profile.skills?.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex rounded-full border border-border bg-secondary px-3 py-1 font-mono text-[10px] font-bold uppercase text-foreground"
                  >
                    {skill}
                  </span>
                ))}
                {profile.languages?.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[10px] font-bold uppercase text-primary"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div
            data-mf-stagger-animation="fade-up"
            data-mf-stagger-gap="120"
            className="grid gap-8 text-base leading-[1.8] text-muted-foreground"
          >
            <p>{profile.bio2}</p>
            <p>{profile.bio3}</p>
          </div>
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
        data-mf-count-to={target}
        data-mf-count-duration="1600"
        data-mf-count-once="true"
        data-mf-count-trigger="top 95%"
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
      className="mx-auto max-w-[1400px] px-4 py-8 sm:px-5 sm:py-10 md:px-8 lg:px-10"
    >
      <div
        data-mf-stagger-animation="fade-up"
        data-mf-stagger-gap="100"
        className="grid grid-cols-2 gap-6 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="bento-card flex flex-col items-center justify-center p-6 text-center transition-transform hover:-translate-y-1"
          >
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

function Skills({ profile }: { profile: Profile }) {
  const skills = profile.skills || [];
  if (!skills.length) return null;
  return (
    <section
      id="skills"
      className="mx-auto max-w-[1400px] px-4 py-12 sm:px-5 sm:py-16 md:px-8 md:py-20 lg:px-10 lg:py-24"
    >
      <div className="bento-card flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div className="max-w-sm">
          <SectionLabel number="02">CAPABILITIES</SectionLabel>
          <h2 className="display-title text-3xl font-bold text-foreground">
            Tools I use to ship.
          </h2>
        </div>
        <div className="flex max-w-2xl flex-wrap gap-3">
          {skills.map((skill) => (
            <span
              key={skill}
              className="cursor-default rounded-full border border-border bg-secondary px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Marquee({ services }: { services: Service[] }) {
  const words =
    services.length > 0
      ? services.map((service) => service.title)
      : ["Research", "Design", "Code", "Ship", "Learn"];

  return (
    <div
      id="services-strip"
      className="my-10 overflow-hidden bg-secondary py-6 border-y border-border"
    >
      <div
        data-mf-ticker
        data-mf-ticker-speed="45"
        data-mf-ticker-pause-on-hover="true"
        className="font-mono text-[13px] font-bold uppercase tracking-[.2em] text-foreground"
        dangerouslySetInnerHTML={{
          __html: words
            .map(
              (word, index) =>
                `<span key="${word}-${index}" class="px-6 flex items-center gap-6">${word} <span class="h-2 w-2 rounded-full bg-primary animate-pulse"></span></span>`,
            )
            .join(""),
        }}
      />
    </div>
  );
}

function Timeline({ data }: { data: PortfolioData }) {
  return (
    <section
      id="education"
      className="mx-auto max-w-[1400px] px-4 py-16 sm:px-5 sm:py-20 md:px-8 md:py-24 lg:px-10 lg:py-32"
    >
      <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr]">
        <div data-mf-animation="fade-up">
          <SectionLabel number="02">EDUCATION</SectionLabel>
          <h2 className="display-title text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-foreground">
            Academic <br />
            <span>Timeline.</span>
          </h2>
        </div>

        <div
          data-mf-stagger-animation="fade-left"
          data-mf-stagger-gap="100"
          className="grid gap-6"
        >
          {data.education.map((item) => (
            <div
              className="bento-card group flex flex-col sm:flex-row gap-5 p-6 transition-all hover:-translate-y-1"
              key={item.id}
            >
              <div className="sm:w-32 shrink-0">
                <span className="font-mono text-[12px] font-bold text-primary tracking-wider">
                  {item.period}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {item.degree}
                </h3>
                <p className="mt-2 font-mono text-[12px] text-muted-foreground">
                  {item.institution}
                </p>
                <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExperienceSection({ data }: { data: PortfolioData }) {
  return (
    <section
      id="experience"
      className="mx-auto max-w-[1400px] px-4 py-16 sm:px-5 sm:py-20 md:px-8 md:py-24 lg:px-10 lg:py-32"
    >
      <SectionLabel number="03">EXPERIENCE</SectionLabel>
      <div
        data-mf-stagger-animation="fade-up"
        data-mf-stagger-gap="90"
        className="grid gap-6 lg:grid-cols-2 mt-12"
      >
        {data.experience.map((item) => (
          <div
            className="bento-card group p-6 transition-all hover:-translate-y-1"
            key={item.id}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground">
                  {item.role}
                </h3>
                <p className="mt-2 font-mono text-[12px] font-bold text-primary">
                  {item.company}
                </p>
              </div>
              <span className="inline-flex h-8 items-center rounded-full border border-border px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {item.period}
              </span>
            </div>
            <p className="text-base leading-[1.7] text-muted-foreground">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Services({ data }: { data: PortfolioData }) {
  return (
    <section
      id="services"
      className="mx-auto max-w-[1400px] px-4 py-16 sm:px-5 sm:py-20 md:px-8 md:py-24 lg:px-10 lg:py-32"
    >
      <SectionLabel number="04">SERVICES</SectionLabel>

      <div
        data-mf-stagger-animation="zoom-in"
        data-mf-stagger-gap="110"
        className="grid gap-6 lg:grid-cols-3 mt-12"
      >
        {data.services.map((service) => (
          <article
            key={service.id}
            className="bento-card group p-7 transition-all duration-300 hover:-translate-y-2 flex flex-col h-full"
          >
            <div className="font-mono text-[2rem] font-bold text-primary mb-6">
              {service.number}
            </div>

            <h3 className="text-2xl font-bold leading-tight text-foreground mb-4">
              {service.title}
            </h3>

            <p className="text-sm leading-[1.8] text-muted-foreground flex-grow">
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
  return (
    <section
      id="work"
      className="mx-auto max-w-[1400px] px-4 py-16 sm:px-5 sm:py-20 md:px-8 md:py-24 lg:px-10 lg:py-32"
    >
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end mb-12">
        <SectionLabel number="05">PROJECTS</SectionLabel>
      </div>

      <div
        data-mf-stagger-animation="fade-up"
        data-mf-stagger-gap="90"
        className="grid gap-8 lg:grid-cols-2"
      >
        {data.projects.map((project) => (
          <article
            key={project.id}
            className="bento-card group flex flex-col transition-all hover:-translate-y-2 overflow-hidden"
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
              <div className="flex w-full flex-wrap items-center gap-3 opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => setSelectedProject(project)}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary sm:w-auto"
                >
                  View project details <ArrowUpRight size={13} />
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
        ))}
      </div>
      {selectedProject && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 p-5 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedProject.title} details`}
        >
          <div className="bento-card relative max-h-[85vh] w-full max-w-2xl overflow-y-auto p-5 sm:p-6 lg:p-8">
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
            {selectedProject.liveUrl && (
              <a
                href={selectedProject.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-background"
              >
                <ExternalLink size={14} /> Open live project
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Testimonials({ data }: { data: PortfolioData }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!data.testimonials || data.testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % data.testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [data.testimonials]);

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
      className="mx-auto max-w-[1400px] px-4 py-16 sm:px-5 sm:py-20 md:px-8 md:py-24 lg:px-10 lg:py-32"
    >
      <SectionLabel number="06">TESTIMONIALS</SectionLabel>
      <div className="bento-card relative overflow-hidden p-5 sm:p-5 sm:p-6 lg:p-8 lg:p-10 border-l-4 border-l-primary">
        <div className="absolute top-0 right-0 p-8 text-primary/10 font-sans text-9xl leading-none"></div>
        <div className="relative z-10 flex flex-col justify-center min-h-[250px]">
          <div
            key={currentIndex}
            className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out"
          >
            <p className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold leading-[1.4] tracking-tight text-foreground max-w-4xl">
              {item?.quote ||
                "The best work makes the difficult feel possible."}
            </p>
            <div className="mt-12 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full border border-border bg-secondary flex items-center justify-center font-mono font-bold text-primary">
                {item?.name.charAt(0)}
              </div>
              <div>
                <p className="font-mono text-[12px] font-bold uppercase tracking-[.1em] text-foreground">
                  {item?.name}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  {item?.role}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center gap-3">
            {data.testimonials.length > 1 && (
              <button
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
          className="inline-flex w-full sm:w-auto justify-center items-center gap-3 rounded-full bg-primary px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-[.1em] text-background transition-all hover:scale-105 glow-border disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
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
      className="mx-auto max-w-[1400px] px-4 py-16 sm:px-5 sm:py-20 md:px-8 md:py-24 lg:px-10 lg:py-32"
    >
      <SectionLabel number="07">CONTACT</SectionLabel>
      <div className="grid gap-16 lg:grid-cols-[1.5fr_1fr] items-start">
        <div data-mf-animation="fade-up">
          <h2 className="display-title text-[clamp(3rem,6vw,5rem)] font-bold leading-[1.05] tracking-tight text-foreground">
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
          <ContactForm />
        </div>

        <div
          data-mf-animation="fade-left"
          className="flex flex-col gap-4 mt-0 lg:mt-24"
        >
          <a
            href={`https://${profile.github.replace(/^https?:\/\//, "")}`}
            className="bento-card group flex items-center gap-4 p-4 transition-all hover:-translate-y-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-background">
              <FaGithub size={18} />
            </div>
            {profile.github}
          </a>

          {profile.linkedin && (
            <a
              href={`https://${profile.linkedin.replace(/^https?:\/\//, "")}`}
              className="bento-card group flex items-center gap-4 p-4 transition-all hover:-translate-y-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-background">
                <FaLinkedin size={18} />
              </div>
              {profile.linkedin}
            </a>
          )}

          <a
            href={`mailto:${profile.email}`}
            className="bento-card group flex items-center gap-4 p-4 transition-all hover:-translate-y-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-background">
              <Mail size={18} />
            </div>
            say hello
          </a>

          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              className="bento-card group flex items-center gap-4 p-4 transition-all hover:-translate-y-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-background">
                <Phone size={18} />
              </div>
              {profile.phone}
            </a>
          )}

          <div className="bento-card flex items-center gap-4 p-4 font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-primary">
              <MapPin size={18} />
            </div>
            {profile.location}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ profile }: { profile: Profile }) {
  return (
    <footer className="border-t border-border bg-background px-4 py-8 sm:px-5 sm:py-12 md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-6 lg:flex-row">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span className="flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Built with code & coffee
        </span>
        <a
          href="#top"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-primary transition-transform hover:-translate-y-1 hover:bg-primary hover:text-background"
          aria-label="Back to top"
        >
          ↑
        </a>
      </div>
    </footer>
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
              Compiling portfolio
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

function CursorEffect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot = document.createElement("div");
    const ring = document.createElement("div");
    dot.className = "cursor-dot";
    ring.className = "cursor-ring";

    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add("has-custom-cursor");

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let frameId: number | null = null;

    const updateDotPosition = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    };

    const updateActiveState = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const isInteractive = target.closest(
        "a, button, input, textarea, select, summary",
      );
      if (isInteractive) {
        ring.classList.add("is-active");
      } else {
        ring.classList.remove("is-active");
      }
    };

    const tick = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      frameId = window.requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", updateDotPosition);
    window.addEventListener("mouseover", updateActiveState);
    window.addEventListener("mouseout", updateActiveState);
    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", updateDotPosition);
      window.removeEventListener("mouseover", updateActiveState);
      window.removeEventListener("mouseout", updateActiveState);
      if (frameId) window.cancelAnimationFrame(frameId);
      dot.remove();
      ring.remove();
      document.body.classList.remove("has-custom-cursor");
    };
  }, []);

  return null;
}

export function PublicPortfolio() {
  const { data, isLoading, isError } = usePortfolioQuery();
  useMotionFlow([data]);
  const [themeOverride, setThemeOverride] = useState<"dark" | "light" | null>(
    null,
  );
  const [scrollProgress, setScrollProgress] = useState(0);

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
    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0);
    };
    const scheduleProgress = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };
    updateProgress();
    window.addEventListener("scroll", scheduleProgress, { passive: true });
    window.addEventListener("resize", scheduleProgress);
    return () => {
      window.removeEventListener("scroll", scheduleProgress);
      window.removeEventListener("resize", scheduleProgress);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const recordVisit = async () => {
      try {
        const payload = {
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

  const themeMode = data.themeSettings?.mode ?? "dark";
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
          "--background": "0 0% 98%",
          "--foreground": "220 25% 12%",
          "--border": "220 18% 86%",
          "--input": "220 18% 92%",
          "--card": "0 0% 100%",
          "--card-foreground": "220 25% 12%",
          "--card-border": "220 18% 88%",
          "--primary-foreground": "220 25% 12%",
          "--secondary": "220 17% 96%",
          "--secondary-foreground": "220 25% 12%",
          "--muted": "220 18% 95%",
          "--muted-foreground": "220 9% 40%",
          "--accent": "152 100% 45%",
          "--accent-foreground": "220 25% 12%",
          "--destructive": "0 84% 60%",
          "--destructive-foreground": "0 0% 100%",
        }
      : {}),
  } as React.CSSProperties;

  return (
    <div
      id="top"
      className={`${activeMode === "light" ? "light" : "dark"} min-h-[100dvh] bg-background selection:bg-primary/20 selection:text-primary`}
      style={customStyle}
    >
      <CursorEffect />
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
          className="h-full bg-primary transition-[width] duration-150"
          style={{ width: `${scrollProgress}%` }}
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
        {data.sectionVisibility?.about && <About profile={data.profile} />}
        {data.sectionVisibility?.stats && <Stats stats={data.stats} />}
        {(data.sectionVisibility?.skills ?? true) && (
          <Skills profile={data.profile} />
        )}
        {data.sectionVisibility?.services && (
          <Marquee services={data.services} />
        )}
        {data.sectionVisibility?.education && <Timeline data={data} />}
        {data.sectionVisibility?.experience && (
          <ExperienceSection data={data} />
        )}
        {data.sectionVisibility?.services && <Services data={data} />}
        {data.sectionVisibility?.projects && <Work data={data} />}
        {data.sectionVisibility?.testimonials && <Testimonials data={data} />}
        {data.sectionVisibility?.contact && <Contact profile={data.profile} />}
      </main>
      <Footer profile={data.profile} />
    </div>
  );
}
