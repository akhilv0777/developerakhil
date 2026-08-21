import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import {
  Link,
  Route,
  Router as WouterRouter,
  Switch,
  useLocation,
} from "wouter";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ExternalLink,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useMotionFlow } from "@/lib/motionflow";
import "@/index.css";

type Service = {
  id: string;
  title: string;
  description: string;
  number: string;
};
type Project = {
  id: string;
  title: string;
  category: string;
  year: string;
  description: string;
  tags: string;
  accent: string;
};
type Education = {
  id: string;
  degree: string;
  institution: string;
  period: string;
  detail: string;
};
type Experience = {
  id: string;
  role: string;
  company: string;
  period: string;
  detail: string;
};
type Testimonial = { id: string; quote: string; name: string; role: string };
type Stat = { id: string; value: string; label: string };
type Profile = {
  name: string;
  tagline: string;
  location: string;
  bio1: string;
  bio2: string;
  bio3: string;
  email: string;
  github: string;
  image: string;
  resume: string;
  resumeName: string;
  contactTitle: string;
  contactNote: string;
};
type PortfolioData = {
  profile: Profile;
  stats: Stat[];
  services: Service[];
  projects: Project[];
  education: Education[];
  experience: Experience[];
  testimonials: Testimonial[];
};

const defaultProfile: Profile = {
  name: "Akhilesh Vishwakarma",
  tagline: "Full-stack developer / digital craftsman",
  location: "Mumbai, India",
  bio1: "I’m Akhilesh — a developer who likes products with a point of view.",
  bio2: "For the past 6 years, I’ve moved between interface, API, database, and the conversations that connect them. The best work happens when those boundaries get blurry.",
  bio3: "I work with people who have something worth making and need a partner who can bring both technical rigor and a human eye to the room.",
  email: "hello@akhilesh.dev",
  github: "github.com/akhilesh-v",
  image: "",
  resume: "",
  resumeName: "",
  contactTitle: "Have a\ngood one?",
  contactNote: "Currently accepting a few good problems.",
};

// Used only as an instant-render placeholder while the real content
// loads from the database, and as the payload for "reset to defaults".
const defaultPortfolioData: PortfolioData = {
  profile: defaultProfile,
  stats: [
    { id: "stat-1", value: "06", label: "years making" },
    { id: "stat-2", value: "38", label: "things shipped" },
    { id: "stat-3", value: "12", label: "happy teams" },
    { id: "stat-4", value: "∞", label: "tabs open" },
  ],
  services: [
    {
      id: "svc-1",
      number: "01",
      title: "Product engineering",
      description:
        "From first sketch to a reliable, fast product people want to use.",
    },
    {
      id: "svc-2",
      number: "02",
      title: "Web experiences",
      description:
        "Editorial, expressive interfaces with a little more soul than expected.",
    },
    {
      id: "svc-3",
      number: "03",
      title: "Design systems",
      description:
        "A shared visual language that lets a team move quickly without losing taste.",
    },
  ],
  projects: [
    {
      id: "prj-1",
      title: "Aster / finance for humans",
      category: "Product design + engineering",
      year: "2024",
      description:
        "A calmer way to understand the money moving through your life.",
      tags: "React, TypeScript, Product",
      accent: "lime",
    },
    {
      id: "prj-2",
      title: "Fieldnotes",
      category: "Editorial platform",
      year: "2023",
      description:
        "A living archive for curious people making things in the real world.",
      tags: "Next.js, CMS, Art direction",
      accent: "coral",
    },
    {
      id: "prj-3",
      title: "Morrow studio",
      category: "Brand system + web",
      year: "2023",
      description:
        "A new digital home for a studio working at the edge of materials and light.",
      tags: "WebGL, Motion, Strategy",
      accent: "blue",
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "B.Tech, Computer Science",
      institution: "University of Mumbai",
      period: "2015 — 2019",
      detail:
        "Systems, algorithms, and the habit of taking things apart to see how they work.",
    },
    {
      id: "edu-2",
      degree: "The self-directed studio",
      institution: "Everywhere, always",
      period: "2019 — now",
      detail:
        "A continuing practice in visual design, typography, and making useful things.",
    },
  ],
  experience: [
    {
      id: "exp-1",
      role: "Senior full-stack developer",
      company: "Independent / select partners",
      period: "2021 — now",
      detail:
        "Partnering with founders and small teams to turn ambitious ideas into shipped products.",
    },
    {
      id: "exp-2",
      role: "Full-stack developer",
      company: "Bynocs Technologies",
      period: "2019 — 2021",
      detail:
        "Built dependable web platforms and learned that good software begins with listening.",
    },
  ],
  testimonials: [
    {
      id: "tst-1",
      quote:
        "Akhilesh brings the rare combination of a sharp eye and the patience to make the hard parts simple.",
      name: "Riya Menon",
      role: "Founder, Common Thread",
    },
    {
      id: "tst-2",
      quote:
        "He made our product feel like us. Not just functional — unmistakably ours.",
      name: "Nikhil Shah",
      role: "Creative director, Morrow",
    },
  ],
};

// ---------------------------------------------------------------------
// Data layer: public content comes from GET /api/portfolio (no auth).
// Admin edits are saved via PUT /api/portfolio (requires a valid session
// cookie, checked server-side — see api/portfolio.ts).
// ---------------------------------------------------------------------

function usePortfolioQuery() {
  return useQuery<PortfolioData>({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const response = await fetch("/api/portfolio", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to load portfolio content");
      const json = await response.json();
      // Older saved rows (before the Profile feature existed) won't have
      // a `profile` key yet — fall back to the defaults so the public
      // site and admin form always have something sensible to render.
      return {
        ...defaultPortfolioData,
        ...json,
        profile: { ...defaultProfile, ...(json?.profile ?? {}) },
      };
    },
    initialData: defaultPortfolioData,
    staleTime: 30_000,
  });
}

function useSavePortfolioMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PortfolioData) => {
      const response = await fetch("/api/portfolio", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const detail = Array.isArray(body.details) ? ` (${body.details.join("; ")})` : "";
        throw new Error((body.error || "Failed to save changes") + detail);
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["portfolio"], data);
    },
  });
}

// ---------------------------------------------------------------------
// Auth: session state comes from GET /api/auth/me, which reads the
// httpOnly session cookie server-side. The frontend never sees or
// stores the admin credentials or the session token itself.
// ---------------------------------------------------------------------

function useAuthQuery() {
  return useQuery<{ authenticated: boolean; username?: string }>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (response.status === 401) return { authenticated: false };
      if (!response.ok) throw new Error("Failed to check session");
      return response.json();
    },
    staleTime: 60_000,
    retry: false,
  });
}

function Nav({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const links = [
    ["about", "01 / about"],
    ["work", "02 / work"],
    ["contact", "03 / contact"],
  ];
  const initials =
    profile.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AV";
  return (
    <header className="fixed top-0 z-30 w-full border-b border-foreground/15 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 md:px-10">
        <Link
          href="/"
          className="flex items-center gap-3"
          data-testid="link-home"
        >
          {profile.image ? (
            <img
              src={profile.image}
              alt={profile.name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center bg-foreground font-mono text-sm font-bold text-background">
              {initials}
            </span>
          )}
          <span className="hidden font-mono text-[11px] uppercase tracking-[.22em] sm:inline">
            {profile.name}
          </span>
        </Link>
        <nav
          className={`${open ? "absolute left-0 top-[72px] flex w-full flex-col border-b border-foreground/15 bg-background p-5" : "hidden"} gap-5 md:static md:flex md:w-auto md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0`}
        >
          {links.map(([href, label]) => (
            <a
              key={href}
              href={`#${href}`}
              onClick={() => setOpen(false)}
              className="font-mono text-[11px] uppercase tracking-[.16em] text-muted-foreground transition-colors hover:text-foreground"
              data-testid={`link-nav-${href}`}
            >
              {label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="border border-foreground/20 p-2 md:hidden"
          aria-label="Toggle navigation"
          data-testid="button-toggle-nav"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
    </header>
  );
}

function SectionLabel({
  number,
  children,
  dark = false,
}: {
  number: string;
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className={`mb-10 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[.2em] ${dark ? "text-background/60" : "text-muted-foreground"}`}
    >
      <span className={dark ? "text-primary" : "text-accent"}>{number}</span>
      <span>{children}</span>
      <span className="h-px w-12 bg-current opacity-40" />
    </div>
  );
}

function Hero({ profile }: { profile: Profile }) {
  return (
    <section className="grid-paper relative flex min-h-[min(900px,100dvh)] items-end overflow-hidden border-b border-foreground/15 px-5 pb-16 pt-32 md:px-10 md:pb-20">
      <div className="mx-auto grid w-full max-w-[1440px] items-end gap-12 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="reveal mb-8 font-mono text-[11px] uppercase tracking-[.22em] text-muted-foreground">
            {profile.tagline}
          </p>
          <h1 className="display-title reveal reveal-delay-1 max-w-5xl text-[clamp(4.5rem,13vw,12.5rem)] font-semibold leading-[.78]">
            Building
            <br />
            <span className="text-accent">the useful</span>
            <br />
            and unusual.
          </h1>
          <div className="reveal reveal-delay-2 mt-12 flex flex-col gap-5 sm:flex-row sm:items-center">
            <a
              href="#work"
              className="group inline-flex w-fit items-center gap-5 bg-foreground px-5 py-4 font-mono text-[11px] uppercase tracking-[.14em] text-background transition-transform hover:-translate-y-1"
              data-testid="link-hero-work"
            >
              See selected work{" "}
              <ArrowDownRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
            </a>
            <span className="font-mono text-[11px] text-muted-foreground">
              {profile.contactNote}
            </span>
            {profile.resume && (
              <a
                href={profile.resume}
                download={profile.resumeName || "resume.pdf"}
                className="group inline-flex w-fit items-center gap-3 border border-foreground/25 px-5 py-4 font-mono text-[11px] uppercase tracking-[.14em] transition-colors hover:border-primary hover:bg-primary"
                data-testid="link-hero-resume"
              >
                Download résumé
                <ArrowDownRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1 group-hover:translate-y-1 group-hover:text-foreground" />
              </a>
            )}
          </div>
        </div>
        <div
          data-mf-parallax
          data-mf-parallax-speed="0.3"
          data-mf-parallax-speed-mobile="0"
          className="reveal reveal-delay-3 relative hidden h-[300px] border-l border-foreground/20 pl-7 lg:block"
        >
          {profile.image && (
            <img
              src={profile.image}
              alt={profile.name}
              className="mb-6 h-28 w-28 rounded-full object-cover"
              data-testid="img-profile-photo"
            />
          )}
          <div className="absolute left-7 top-0 h-2 w-2 -translate-x-1/2 bg-primary" />
          <p className="font-mono text-[11px] uppercase leading-[1.8] text-muted-foreground">
            Based in
            <br />
            <strong className="font-normal text-foreground">
              {profile.location}
            </strong>
          </p>
          <div className="absolute bottom-0 left-7 right-0">
            <div className="mb-4 h-px w-full bg-foreground/20" />
            <p className="font-mono text-[11px] leading-[1.8] text-muted-foreground">
              I care about the line between a good idea and the moment someone
              finally gets it.
            </p>
          </div>
        </div>
      </div>
      <div className="absolute right-5 top-28 font-mono text-[10px] text-muted-foreground md:right-10">
        01—05 / 2025
      </div>
    </section>
  );
}

function About({ profile }: { profile: Profile }) {
  return (
    <section
      id="about"
      className="mx-auto grid max-w-[1440px] gap-12 px-5 py-24 md:grid-cols-[.6fr_1.4fr] md:px-10 md:py-36"
    >
      <SectionLabel number="01">A little context</SectionLabel>
      <div>
        <p
          data-mf-animation="fade-up"
          className="max-w-4xl text-[clamp(2rem,4.8vw,5rem)] font-medium leading-[.98] tracking-[-.055em]"
        >
          {profile.bio1}
        </p>
        <div
          data-mf-stagger-animation="fade-up"
          data-mf-stagger-gap="120"
          className="mt-12 grid gap-8 border-t border-foreground/15 pt-7 text-sm leading-[1.8] text-muted-foreground md:grid-cols-2"
        >
          <p>{profile.bio2}</p>
          <p>{profile.bio3}</p>
        </div>
      </div>
    </section>
  );
}

/** Splits a stat's free-text value ("06", "38+", "10,000", "∞") into a
 * leading numeric run MotionFlow can count up to, plus a static suffix.
 * Falls back to plain (non-animated) text when nothing numeric is found. */
function StatValue({ value }: { value: string }) {
  const match = value.match(/^(\d[\d,]*)(.*)$/);
  if (!match) {
    return (
      <span className="font-mono text-4xl text-primary md:text-5xl">
        {value}
      </span>
    );
  }
  const [, digits, suffix] = match;
  const target = Number(digits.replace(/,/g, ""));
  return (
    <span className="font-mono text-4xl text-primary md:text-5xl">
      <span
        data-mf-count-to={target}
        data-mf-count-duration="1600"
        data-mf-count-once="true"
        data-mf-count-trigger="top 95%"
      >
        0
      </span>
      {suffix}
    </span>
  );
}

function Stats({ stats }: { stats: Stat[] }) {
  return (
    <section className="border-y border-foreground/15 bg-foreground px-5 py-10 text-background md:px-10">
      <div
        data-mf-stagger-animation="fade-up"
        data-mf-stagger-gap="100"
        className="mx-auto grid max-w-[1440px] grid-cols-2 gap-y-10 md:grid-cols-4"
      >
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="border-l border-background/20 pl-5 first:border-0"
          >
            <p data-testid={`stat-${stat.id}`}>
              <StatValue value={stat.value} />
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[.18em] text-background/60">
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
  return (
    <div className="overflow-hidden border-b border-foreground/15 bg-primary py-3 text-foreground">
      <div
        data-mf-ticker
        data-mf-ticker-speed="45"
        data-mf-ticker-pause-on-hover="true"
        className="font-mono text-[11px] uppercase tracking-[.2em]"
      >
        {words.map((word, index) => (
          <span key={`${word}-${index}`} className="px-4">
            {word} <span className="text-foreground/50">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Timeline({ data }: { data: PortfolioData }) {
  return (
    <section className="mx-auto grid max-w-[1440px] gap-16 px-5 py-24 md:grid-cols-2 md:px-10 md:py-32">
      <div data-mf-animation="fade-up">
        <SectionLabel number="02">The long way round</SectionLabel>
        <h2 className="display-title max-w-xl text-5xl font-semibold leading-[.9] tracking-[-.06em] md:text-7xl">
          Learning by
          <br />
          <span className="text-accent">doing.</span>
        </h2>
        <p className="mt-8 max-w-sm text-sm leading-[1.8] text-muted-foreground">
          A practice built in public, with generous collaborators and a healthy
          suspicion of easy answers.
        </p>
      </div>
      <div
        data-mf-stagger-animation="fade-left"
        data-mf-stagger-gap="100"
        className="space-y-0 border-t border-foreground/15"
      >
        {data.education.map((item) => (
          <div
            className="grid gap-4 border-b border-foreground/15 py-7 sm:grid-cols-[130px_1fr]"
            key={item.id}
            data-testid={`education-${item.id}`}
          >
            <p className="font-mono text-[10px] uppercase tracking-[.12em] text-accent">
              {item.period}
            </p>
            <div>
              <h3 className="text-lg font-medium">{item.degree}</h3>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {item.institution}
              </p>
              <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">
                {item.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExperienceSection({ data }: { data: PortfolioData }) {
  return (
    <section className="bg-foreground px-5 py-24 text-background md:px-10 md:py-32">
      <div className="mx-auto max-w-[1440px]">
        <SectionLabel dark number="03">
          Selected chapters
        </SectionLabel>
        <div className="grid gap-12 md:grid-cols-[.65fr_1.35fr]">
          <h2
            data-mf-animation="fade-right"
            className="display-title text-5xl font-semibold leading-[.88] tracking-[-.06em] md:text-7xl"
          >
            The work
            <br />
            behind
            <br />
            <span className="text-primary">the work.</span>
          </h2>
          <div
            data-mf-stagger-animation="fade-up"
            data-mf-stagger-gap="90"
            className="border-t border-background/20"
          >
            {data.experience.map((item, index) => (
              <div
                className="grid gap-5 border-b border-background/20 py-8 sm:grid-cols-[100px_1fr_100px]"
                key={item.id}
                data-testid={`experience-${item.id}`}
              >
                <span className="font-mono text-[10px] text-background/50">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-xl">{item.role}</h3>
                  <p className="mt-1 font-mono text-[11px] text-primary">
                    {item.company}
                  </p>
                  <p className="mt-5 max-w-xl text-sm leading-[1.7] text-background/60">
                    {item.detail}
                  </p>
                </div>
                <span className="font-mono text-[10px] text-background/50 sm:text-right">
                  {item.period}
                </span>
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
    <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-32">
      <SectionLabel number="04">What I can do</SectionLabel>
      <div
        data-mf-stagger-animation="zoom-in"
        data-mf-stagger-gap="110"
        className="grid border-t border-foreground/15 md:grid-cols-3"
      >
        {data.services.map((service) => (
          <article
            key={service.id}
            className="group border-b border-foreground/15 py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"
            data-testid={`service-${service.id}`}
          >
            <span className="font-mono text-[11px] text-accent">
              {service.number}
            </span>
            <h3 className="mt-16 max-w-xs text-2xl font-medium leading-tight">
              {service.title}
            </h3>
            <p className="mt-5 max-w-xs text-sm leading-[1.7] text-muted-foreground">
              {service.description}
            </p>
            <div className="mt-10 h-8 w-8 border border-foreground/25 p-2 transition-all group-hover:border-primary group-hover:bg-primary">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Work({ data }: { data: PortfolioData }) {
  return (
    <section
      id="work"
      className="border-t border-foreground/15 bg-[#dfe4d4] px-5 py-24 text-[#10151b] md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionLabel number="05">Selected work</SectionLabel>
          <span className="font-mono text-[10px] uppercase tracking-[.15em] text-[#10151b]/55">
            A small selection / 2022—2024
          </span>
        </div>
        <div
          data-mf-stagger-animation="fade-up"
          data-mf-stagger-gap="90"
          className="space-y-5"
        >
          {data.projects.map((project, index) => (
            <article
              key={project.id}
              className="group grid gap-7 border-t border-[#10151b]/20 py-8 md:grid-cols-[80px_1fr_1fr_100px] md:items-center"
              data-testid={`project-${project.id}`}
            >
              <span className="font-mono text-[11px] text-[#10151b]/50">
                0{index + 1}
              </span>
              <div>
                <h3 className="max-w-xl text-[clamp(2rem,4vw,4.3rem)] font-medium leading-[.9] tracking-[-.065em]">
                  {project.title}
                </h3>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[.15em] text-[#10151b]/55">
                  {project.category}
                </p>
              </div>
              <div className="relative hidden h-28 overflow-hidden bg-[#10151b]/10 md:block">
                <div
                  className={`absolute inset-0 transition-transform duration-500 group-hover:scale-105 ${project.accent === "lime" ? "bg-[#cfff32]" : project.accent === "coral" ? "bg-[#ed7059]" : "bg-[#8bcfc8]"}`}
                >
                  <div className="absolute -right-4 -top-10 h-40 w-40 rounded-full border-[18px] border-[#10151b]/15" />
                  <div className="absolute bottom-4 left-5 font-mono text-[10px] uppercase">
                    {project.tags}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end">
                <span className="font-mono text-[11px] text-[#10151b]/50">
                  {project.year}
                </span>
                <ArrowUpRight className="ml-8 h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </div>
              <p className="col-start-2 max-w-sm text-sm leading-[1.6] text-[#10151b]/65 md:col-start-3">
                {project.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials({ data }: { data: PortfolioData }) {
  const item = data.testimonials[0];
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-36">
      <SectionLabel number="06">Good words, kept</SectionLabel>
      <div className="grid gap-10 md:grid-cols-[1.3fr_.7fr]">
        <div
          data-mf-animation="fade-up"
          className="border-l-4 border-primary pl-6 md:pl-10"
        >
          <p className="max-w-4xl text-[clamp(2rem,4vw,4.5rem)] font-medium leading-[.98] tracking-[-.055em]">
            “{item?.quote || "The best work makes the difficult feel possible."}
            ”
          </p>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-[.14em] text-muted-foreground">
            {item?.name} <span className="mx-2 text-accent">/</span>{" "}
            {item?.role}
          </p>
        </div>
        <div className="self-end border-t border-foreground/15 pt-6">
          <p className="text-sm leading-[1.7] text-muted-foreground">
            The brief is never the whole story. I make room for the unexpected
            bit that makes the result feel alive.
          </p>
        </div>
      </div>
    </section>
  );
}

function ContactForm({ email }: { email: string }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const subject = encodeURIComponent(`Hello from ${form.name || "your site"}`);
    const body = encodeURIComponent(
      `${form.message}\n\n— ${form.name}${form.email ? ` (${form.email})` : ""}`,
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    setSent(true);
    window.setTimeout(() => setSent(false), 4000);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 grid gap-4 border-t border-foreground/20 pt-8 sm:grid-cols-2"
      data-testid="form-contact"
    >
      <label className="sm:col-span-1">
        <span className="mb-2 block font-mono text-[10px] uppercase tracking-[.15em] text-foreground/60">
          Your name
        </span>
        <input
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="w-full border border-foreground/25 bg-background/40 px-3 py-3 text-sm outline-none focus:border-foreground"
          data-testid="input-contact-name"
        />
      </label>
      <label className="sm:col-span-1">
        <span className="mb-2 block font-mono text-[10px] uppercase tracking-[.15em] text-foreground/60">
          Your email
        </span>
        <input
          required
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          className="w-full border border-foreground/25 bg-background/40 px-3 py-3 text-sm outline-none focus:border-foreground"
          data-testid="input-contact-email"
        />
      </label>
      <label className="sm:col-span-2">
        <span className="mb-2 block font-mono text-[10px] uppercase tracking-[.15em] text-foreground/60">
          Message
        </span>
        <textarea
          required
          rows={4}
          value={form.message}
          onChange={(event) =>
            setForm({ ...form, message: event.target.value })
          }
          className="w-full resize-y border border-foreground/25 bg-background/40 px-3 py-3 text-sm outline-none focus:border-foreground"
          data-testid="input-contact-message"
        />
      </label>
      <div className="flex items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          className="inline-flex items-center gap-2 bg-foreground px-5 py-3 font-mono text-[10px] uppercase tracking-[.14em] text-background transition-transform hover:-translate-y-0.5"
          data-testid="button-send-message"
        >
          Send message <ArrowUpRight className="h-4 w-4" />
        </button>
        {sent && (
          <span className="font-mono text-[10px] uppercase text-foreground/70">
            Opening your email app…
          </span>
        )}
      </div>
    </form>
  );
}

function Contact({ profile }: { profile: Profile }) {
  const titleLines = profile.contactTitle.split("\n");
  return (
    <section
      id="contact"
      className="bg-accent px-5 py-24 text-foreground md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-[1440px]">
        <SectionLabel number="07">Your turn</SectionLabel>
        <div className="grid gap-12 md:grid-cols-[1.4fr_.6fr]">
          <div data-mf-animation="fade-up">
            <h2 className="display-title max-w-5xl text-[clamp(4rem,11vw,10rem)] font-semibold leading-[.78] tracking-[-.08em]">
              {titleLines.map((line, index) => (
                <span key={index}>
                  {line}
                  {index < titleLines.length - 1 && <br />}
                </span>
              ))}
            </h2>
            {profile.contactNote && (
              <p className="mt-6 max-w-md text-sm leading-[1.7] text-foreground/70">
                {profile.contactNote}
              </p>
            )}
            <a
              href={`mailto:${profile.email}`}
              className="group mt-12 inline-flex items-center gap-4 border-b-2 border-foreground pb-3 font-mono text-sm uppercase tracking-[.12em]"
              data-testid="link-email"
            >
              {profile.email}{" "}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </a>
            <ContactForm email={profile.email} />
          </div>
          <div
            data-mf-animation="fade-left"
            className="flex flex-col justify-end gap-5 font-mono text-[11px] uppercase tracking-[.14em]"
          >
            <a
              href={`https://${profile.github.replace(/^https?:\/\//, "")}`}
              className="flex items-center gap-3 transition-opacity hover:opacity-60"
              data-testid="link-github"
            >
              <FaGithub size={15} /> {profile.github}
            </a>
            <a
              href={`mailto:${profile.email}`}
              className="flex items-center gap-3 transition-opacity hover:opacity-60"
              data-testid="link-contact-mail"
            >
              <Mail size={15} /> say hello
            </a>
            <span className="flex items-center gap-3">
              <MapPin size={15} /> {profile.location}
            </span>
            {profile.resume && (
              <a
                href={profile.resume}
                download={profile.resumeName || "resume.pdf"}
                className="mt-4 flex items-center gap-3 border border-foreground/30 px-4 py-3 normal-case tracking-normal transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
                data-testid="link-contact-resume"
              >
                <ArrowDownRight size={15} /> Download résumé
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ profile }: { profile: Profile }) {
  return (
    <footer className="bg-foreground px-5 py-8 text-background md:px-10">
      <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 font-mono text-[10px] uppercase tracking-[.15em] text-background/50 sm:flex-row">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span className="terminal-caret">Made with curiosity & care</span>
        <a
          href="#top"
          className="text-primary hover:text-background"
          data-testid="link-back-top"
        >
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}

function PublicPortfolio() {
  const { data } = usePortfolioQuery();
  useMotionFlow([data]);
  return (
    <div id="top" className="grain min-h-[100dvh] bg-background">
      <Nav profile={data.profile} />
      <main>
        <Hero profile={data.profile} />
        <About profile={data.profile} />
        <Stats stats={data.stats} />
        <Marquee services={data.services} />
        <Timeline data={data} />
        <ExperienceSection data={data} />
        <Services data={data} />
        <Work data={data} />
        <Testimonials data={data} />
        <Contact profile={data.profile} />
      </main>
      <Footer profile={data.profile} />
    </div>
  );
}

// ---------------------------------------------------------------------
// /console — login gate + admin dashboard. Nothing here is linked from
// the public site; the URL itself is the only way in, and every write
// still requires a valid server-checked session.
// ---------------------------------------------------------------------

function LoginPage() {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error || "Login failed.");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grain flex min-h-[100dvh] items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center bg-foreground text-background">
            <Lock size={16} />
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">
              Restricted
            </p>
            <h1 className="text-xl font-medium">Console access</h1>
          </div>
        </div>
        <form
          onSubmit={handleSubmit}
          className="border border-foreground/20 bg-background p-6"
          data-testid="form-login"
        >
          <label className="mb-4 block">
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">
              Username
            </span>
            <input
              required
              autoFocus
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full border border-foreground/20 bg-card px-3 py-3 text-sm outline-none focus:border-primary"
              data-testid="input-username"
            />
          </label>
          <label className="mb-6 block">
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">
              Password
            </span>
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-foreground/20 bg-card px-3 py-3 text-sm outline-none focus:border-primary"
              data-testid="input-password"
            />
          </label>
          {error && (
            <p
              className="mb-5 font-mono text-[11px] text-destructive"
              data-testid="text-login-error"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 bg-foreground px-4 py-3 font-mono text-[10px] uppercase tracking-[.14em] text-background transition-opacity hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
            data-testid="button-login"
          >
            {submitting ? "Checking…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}

type Resource = Exclude<keyof PortfolioData, "profile">;
const resourceMeta: Record<Resource, { label: string; singular: string }> = {
  stats: { label: "Stats", singular: "stat" },
  services: { label: "Services", singular: "service" },
  projects: { label: "Projects", singular: "project" },
  education: { label: "Education", singular: "education" },
  experience: { label: "Experience", singular: "role" },
  testimonials: { label: "Testimonials", singular: "testimonial" },
};
const emptyFor = (resource: Resource): PortfolioData[Resource][number] => {
  const id = `${resource.slice(0, -1)}-${Date.now()}`;
  if (resource === "stats") return { id, value: "", label: "" } as Stat;
  if (resource === "services")
    return { id, number: "0X", title: "", description: "" } as Service;
  if (resource === "projects")
    return {
      id,
      title: "",
      category: "",
      year: String(new Date().getFullYear()),
      description: "",
      tags: "",
      accent: "lime",
    } as Project;
  if (resource === "education")
    return {
      id,
      degree: "",
      institution: "",
      period: "",
      detail: "",
    } as Education;
  if (resource === "experience")
    return { id, role: "", company: "", period: "", detail: "" } as Experience;
  return { id, quote: "", name: "", role: "" } as Testimonial;
};
const itemTitle = (
  item: Stat | Service | Project | Education | Experience | Testimonial,
): string => {
  if ("value" in item && "label" in item)
    return `${item.value || "—"} · ${item.label || "Untitled"}`;
  if ("title" in item) return item.title || "Untitled";
  if ("degree" in item) return item.degree || "Untitled";
  if ("role" in item && "company" in item) return item.role || "Untitled";
  if ("name" in item) return item.name || "Untitled";
  return "Untitled";
};
const itemSubtitle = (
  item: Stat | Service | Project | Education | Experience | Testimonial,
): string => {
  if ("description" in item) return String(item.description);
  if ("institution" in item) return String(item.institution);
  if ("company" in item) return String(item.company);
  if ("detail" in item) return String(item.detail);
  if ("quote" in item) return String(item.quote);
  return "";
};

function AdminForm({
  resource,
  value,
  onSave,
  onCancel,
}: {
  resource: Resource;
  value: PortfolioData[Resource][number];
  onSave: (value: PortfolioData[Resource][number]) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(
    () => ({ ...value }) as unknown as Record<string, string>,
  );
  // Keep the form in sync whenever a different item is opened for editing
  // (e.g. clicking "Edit" on another row without closing this form first).
  useEffect(() => {
    setForm({ ...value } as unknown as Record<string, string>);
  }, [value]);
  const fields: Record<Resource, string[]> = {
    stats: ["value", "label"],
    services: ["number", "title", "description"],
    projects: ["title", "category", "year", "description", "tags", "accent"],
    education: ["degree", "institution", "period", "detail"],
    experience: ["role", "company", "period", "detail"],
    testimonials: ["quote", "name", "role"],
  };
  const labels: Record<string, string> = {
    value: "Value (e.g. 06, 100+, ∞)",
    label: "Label (e.g. years making)",
    number: "Index",
    title: "Title",
    description: "Description",
    category: "Category",
    year: "Year",
    tags: "Tags",
    accent: "Color treatment",
    degree: "Degree",
    institution: "Institution",
    period: "Period",
    detail: "Detail",
    role: "Role",
    company: "Company",
    quote: "Quote",
    name: "Name",
  };
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ ...value, ...form } as PortfolioData[Resource][number]);
      }}
      className="mt-5 border border-foreground/20 bg-background p-5 md:p-7"
      data-testid={`form-${resource}`}
    >
      <div className="grid gap-5 md:grid-cols-2">
        {fields[resource].map((field) => (
          <label
            key={field}
            className={
              field === "description" || field === "detail" || field === "quote"
                ? "md:col-span-2"
                : ""
            }
          >
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">
              {labels[field]}
            </span>
            {field === "accent" ? (
              <select
                value={form[field] || ""}
                onChange={(event) =>
                  setForm({ ...form, [field]: event.target.value })
                }
                className="w-full border border-foreground/20 bg-card px-3 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="lime">Lime</option>
                <option value="coral">Coral</option>
                <option value="blue">Blue</option>
              </select>
            ) : field === "description" ||
              field === "detail" ||
              field === "quote" ? (
              <textarea
                required
                value={form[field] || ""}
                onChange={(event) =>
                  setForm({ ...form, [field]: event.target.value })
                }
                rows={4}
                className="w-full resize-y border border-foreground/20 bg-card px-3 py-3 text-sm outline-none focus:border-primary"
                data-testid={`input-${field}`}
              />
            ) : (
              <input
                required
                value={form[field] || ""}
                onChange={(event) =>
                  setForm({ ...form, [field]: event.target.value })
                }
                className="w-full border border-foreground/20 bg-card px-3 py-3 text-sm outline-none focus:border-primary"
                data-testid={`input-${field}`}
              />
            )}
          </label>
        ))}
      </div>
      <div className="mt-7 flex gap-3">
        <button
          type="submit"
          className="inline-flex items-center gap-2 bg-foreground px-4 py-3 font-mono text-[10px] uppercase tracking-[.14em] text-background hover:bg-primary hover:text-primary-foreground"
          data-testid="button-save-item"
        >
          <Save size={14} /> Save {resourceMeta[resource].singular}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-foreground/25 px-4 py-3 font-mono text-[10px] uppercase tracking-[.14em] hover:bg-muted"
          data-testid="button-cancel-item"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Reads an uploaded image file, downsizes it so the DB row stays small,
 * and resolves to a base64 data URL ready to store/display directly. */
function fileToResizedDataUrl(file: File, maxDimension = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () =>
        reject(new Error("That file doesn’t look like a valid image."));
      img.onload = () => {
        const scale = Math.min(
          1,
          maxDimension / Math.max(img.width, img.height),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx)
          return reject(
            new Error("Image processing is not supported in this browser."),
          );
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function ProfileEditor({
  profile,
  onSave,
  saving,
}: {
  profile: Profile;
  onSave: (value: Profile) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Profile>(profile);
  const [imageError, setImageError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  // Re-sync whenever the saved profile changes underneath us — otherwise
  // the fields keep showing whatever was typed before the last save
  // (or stale defaults) instead of what's actually persisted.
  useEffect(() => {
    setForm(profile);
  }, [profile]);
  const fields: { key: keyof Profile; label: string; long?: boolean }[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "tagline", label: "Tagline (shown under the header)" },
    { key: "location", label: "Location" },
    { key: "github", label: "GitHub (e.g. github.com/you)" },
    { key: "bio1", label: "Headline bio (large text in About)", long: true },
    { key: "bio2", label: "About paragraph 1", long: true },
    { key: "bio3", label: "About paragraph 2", long: true },
    {
      key: "contactTitle",
      label: "Contact heading (use a new line to break it)",
      long: true,
    },
    { key: "contactNote", label: "Contact note (small line near the CTA)" },
  ];

  const handleImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError(null);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setForm((current) => ({ ...current, image: dataUrl }));
    } catch (error) {
      setImageError((error as Error).message);
    } finally {
      event.target.value = "";
    }
  };

  const handleResume = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setResumeError(null);
    // Kept well under the platform's hard request-size limit: the file is
    // stored as a base64 data URL (~33% bigger than the raw file) alongside
    // the rest of the portfolio JSON, so a 4MB PDF could previously push
    // the whole save past the limit and get rejected.
    const MAX_BYTES = 2 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      setResumeError("That file is too large — please keep it under 2MB.");
      event.target.value = "";
      return;
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read that file."));
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      setForm((current) => ({
        ...current,
        resume: dataUrl,
        resumeName: file.name,
      }));
    } catch (error) {
      setResumeError((error as Error).message);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(form);
      }}
      className="mt-5 border border-foreground/20 bg-background p-5 md:p-7"
      data-testid="form-profile"
    >
      <div className="mb-7 flex items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-foreground/20 bg-card">
          {form.image ? (
            <img
              src={form.image}
              alt="Profile"
              className="h-full w-full object-cover"
              data-testid="img-profile-preview"
            />
          ) : (
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              No photo
            </span>
          )}
        </div>
        <div>
          <label className="inline-flex cursor-pointer items-center gap-2 border border-foreground/25 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.13em] hover:bg-muted">
            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="hidden"
              data-testid="input-profile-image"
            />
            Upload photo
          </label>
          {form.image && (
            <button
              type="button"
              onClick={() => setForm((current) => ({ ...current, image: "" }))}
              className="ml-3 font-mono text-[10px] uppercase tracking-[.13em] text-muted-foreground hover:text-destructive"
              data-testid="button-remove-photo"
            >
              Remove
            </button>
          )}
          {imageError && (
            <p className="mt-2 font-mono text-[11px] text-destructive">
              {imageError}
            </p>
          )}
        </div>
      </div>
      <div className="mb-7 border-t border-foreground/15 pt-6">
        <span className="mb-3 block font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">
          Résumé (shown as a download button on the site)
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 border border-foreground/25 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.13em] hover:bg-muted">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResume}
              className="hidden"
              data-testid="input-profile-resume"
            />
            {form.resume ? "Replace résumé" : "Upload résumé"}
          </label>
          {form.resume && (
            <>
              <a
                href={form.resume}
                download={form.resumeName || "resume.pdf"}
                className="font-mono text-[10px] uppercase tracking-[.13em] text-muted-foreground hover:text-foreground"
                data-testid="link-view-resume"
              >
                {form.resumeName || "resume.pdf"}
              </a>
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    resume: "",
                    resumeName: "",
                  }))
                }
                className="font-mono text-[10px] uppercase tracking-[.13em] text-muted-foreground hover:text-destructive"
                data-testid="button-remove-resume"
              >
                Remove
              </button>
            </>
          )}
        </div>
        {resumeError && (
          <p className="mt-2 font-mono text-[11px] text-destructive">
            {resumeError}
          </p>
        )}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {fields.map(({ key, label, long }) => (
          <label key={key} className={long ? "md:col-span-2" : ""}>
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">
              {label}
            </span>
            {long ? (
              <textarea
                required
                value={form[key]}
                onChange={(event) =>
                  setForm({ ...form, [key]: event.target.value })
                }
                rows={3}
                className="w-full resize-y border border-foreground/20 bg-card px-3 py-3 text-sm outline-none focus:border-primary"
                data-testid={`input-${key}`}
              />
            ) : (
              <input
                required
                value={form[key]}
                onChange={(event) =>
                  setForm({ ...form, [key]: event.target.value })
                }
                className="w-full border border-foreground/20 bg-card px-3 py-3 text-sm outline-none focus:border-primary"
                data-testid={`input-${key}`}
              />
            )}
          </label>
        ))}
      </div>
      <div className="mt-7 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-foreground px-4 py-3 font-mono text-[10px] uppercase tracking-[.14em] text-background hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
          data-testid="button-save-profile"
        >
          <Save size={14} /> Save profile
        </button>
      </div>
    </form>
  );
}

function AdminArea({
  data,
  username,
}: {
  data: PortfolioData;
  username?: string;
}) {
  const [section, setSection] = useState<"profile" | Resource>("profile");
  const [editing, setEditing] = useState<
    PortfolioData[Resource][number] | null
  >(null);
  const [saved, setSaved] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const saveMutation = useSavePortfolioMutation();
  const resource = section === "profile" ? null : section;
  const items = resource ? data[resource] : [];

  // `onDone` only fires once the PUT has actually succeeded — this is what
  // closes edit forms / clears selections. Never close a form optimistically
  // before the server confirms the save, or a failed save (e.g. malformed
  // payload) looks identical to a successful one.
  const persist = (next: PortfolioData, onDone?: () => void) => {
    saveMutation.mutate(next, {
      onSuccess: () => {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1800);
        toast({ title: "Saved", description: "Your changes are live on the site." });
        onDone?.();
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Save failed",
          description: (error as Error)?.message || "Something went wrong — your changes were not saved.",
        });
      },
    });
  };

  const saveProfile = (value: Profile) => persist({ ...data, profile: value });
  const saveItem = (value: PortfolioData[Resource][number]) => {
    if (!resource) return;
    const next = items.some((item) => item.id === value.id)
      ? items.map((item) => (item.id === value.id ? value : item))
      : [...items, value];
    // Close the form only after the save succeeds, so a failed save leaves
    // the form open (with the error visible) instead of silently reverting.
    persist({ ...data, [resource]: next }, () => setEditing(null));
  };
  const deleteItem = (id: string) => {
    if (!resource) return;
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    persist({ ...data, [resource]: items.filter((item) => item.id !== id) });
  };
  const resetAll = () => {
    if (!window.confirm("Reset all content to the original portfolio?")) return;
    persist(defaultPortfolioData);
  };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  };

  return (
    <div className="grain min-h-[100dvh] bg-background">
      <header className="border-b border-foreground/15 bg-foreground text-background">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-5 py-5 md:px-10">
          <div
            className="flex items-center gap-3"
            data-testid="link-admin-home"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary font-mono text-sm font-bold text-primary-foreground">
              AV
            </span>
            <span className="truncate font-mono text-[11px] uppercase tracking-[.2em]">
              Content / console{username ? ` · ${username}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.15em] text-background/60 hover:text-primary"
              data-testid="button-view-site"
            >
              View live site <ExternalLink size={14} />
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.15em] text-background/60 hover:text-destructive"
              data-testid="button-logout"
            >
              Log out <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
        <div className="flex flex-col justify-between gap-8 border-b border-foreground/15 pb-10 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">
              Signed in / changes save to the database
            </p>
            <h1 className="display-title mt-5 text-6xl font-semibold leading-[.85] tracking-[-.07em] md:text-8xl">
              Shape the
              <br />
              <span className="text-accent">story.</span>
            </h1>
          </div>
          <div className="max-w-xs text-sm leading-[1.7] text-muted-foreground">
            <p>
              Edits save straight to the live database and appear on the public
              site immediately.
            </p>
            {saveMutation.isPending && (
              <p className="mt-3 font-mono text-[10px] uppercase text-muted-foreground">
                Saving…
              </p>
            )}
            {saved && (
              <p className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase text-green-700">
                <Check size={13} /> Saved
              </p>
            )}
            {saveMutation.isError && (
              <p className="mt-3 font-mono text-[10px] uppercase text-destructive">
                {(saveMutation.error as Error)?.message || "Save failed"}
              </p>
            )}
          </div>
        </div>
        <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
          <aside className="lg:border-r lg:border-foreground/15 lg:pr-6">
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0 lg:pb-0">
              <button
                type="button"
                onClick={() => {
                  setSection("profile");
                  setEditing(null);
                }}
                className={`flex shrink-0 items-center justify-between gap-6 whitespace-nowrap px-3 py-3 text-left font-mono text-[11px] uppercase tracking-[.13em] lg:w-full ${section === "profile" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
                data-testid="button-tab-profile"
              >
                <span>Profile</span>
              </button>
              {(Object.keys(resourceMeta) as Resource[]).map((key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => {
                    setSection(key);
                    setEditing(null);
                  }}
                  className={`flex shrink-0 items-center justify-between gap-6 whitespace-nowrap px-3 py-3 text-left font-mono text-[11px] uppercase tracking-[.13em] lg:w-full ${section === key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
                  data-testid={`button-tab-${key}`}
                >
                  <span>{resourceMeta[key].label}</span>
                  <span className={section === key ? "text-primary" : ""}>
                    {data[key].length.toString().padStart(2, "0")}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={resetAll}
              className="mt-6 flex w-full items-center gap-2 border-t border-foreground/15 px-3 py-4 font-mono text-[10px] uppercase tracking-[.13em] text-muted-foreground hover:text-destructive lg:mt-10"
              data-testid="button-reset-content"
            >
              <RotateCcw size={13} /> Reset all content
            </button>
          </aside>
          {section === "profile" ? (
            <section>
              <div className="mb-6">
                <p className="font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">
                  Editing
                </p>
                <h2 className="mt-2 text-2xl font-medium">Profile</h2>
                <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                  Your name, photo, and bio shown across the public site
                  (header, hero, about, and contact).
                </p>
              </div>
              <ProfileEditor
                profile={data.profile}
                onSave={saveProfile}
                saving={saveMutation.isPending}
              />
            </section>
          ) : (
            resource && (
              <section>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">
                      Editing collection
                    </p>
                    <h2 className="mt-2 text-2xl font-medium">
                      {resourceMeta[resource].label}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing(emptyFor(resource))}
                    className="inline-flex items-center gap-2 bg-primary px-4 py-3 font-mono text-[10px] uppercase tracking-[.13em] text-primary-foreground hover:bg-foreground hover:text-background"
                    data-testid="button-add-item"
                  >
                    <Plus size={15} /> Add {resourceMeta[resource].singular}
                  </button>
                </div>
                {editing && (
                  <AdminForm
                    key={editing.id}
                    resource={resource}
                    value={editing}
                    onSave={saveItem}
                    onCancel={() => setEditing(null)}
                  />
                )}
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="group grid gap-4 border-t border-foreground/15 py-5 md:grid-cols-[48px_1fr_auto] md:items-center"
                      data-testid={`admin-row-${item.id}`}
                    >
                      <span className="font-mono text-[10px] text-accent">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="font-medium">{itemTitle(item)}</h3>
                        <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-muted-foreground">
                          {itemSubtitle(item)}
                        </p>
                      </div>
                      <div className="flex gap-2 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => setEditing(item)}
                          className="border border-foreground/20 p-2 hover:border-primary hover:bg-primary"
                          aria-label={`Edit item ${index + 1}`}
                          data-testid={`button-edit-${item.id}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          className="border border-foreground/20 p-2 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
                          aria-label={`Delete item ${index + 1}`}
                          data-testid={`button-delete-${item.id}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          )}
        </div>
      </main>
    </div>
  );
}

function ConsolePage() {
  const auth = useAuthQuery();
  const portfolio = usePortfolioQuery();

  if (auth.isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <p className="font-mono text-[11px] uppercase tracking-[.15em] text-muted-foreground">
          Checking session…
        </p>
      </div>
    );
  }
  if (!auth.data?.authenticated) {
    return <LoginPage />;
  }
  return <AdminArea data={portfolio.data} username={auth.data.username} />;
}

function RouterContent() {
  return (
    <Switch>
      <Route path="/console">
        <ConsolePage />
      </Route>
      <Route path="/">
        <PublicPortfolio />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

const queryClient = new QueryClient();
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <RouterContent />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
