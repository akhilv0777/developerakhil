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
  image?: string; // Image field added for projects
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

// ---------------------------------------------------------------------
// Data layer: public content comes from GET /api/portfolio (no auth).
// ---------------------------------------------------------------------

function usePortfolioQuery() {
  return useQuery<PortfolioData>({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const response = await fetch("/api/portfolio", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Failed to load portfolio content");
      const json = await response.json();
      return json;
    },
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
        const detail = Array.isArray(body.details)
          ? ` (${body.details.join("; ")})`
          : "";
        throw new Error((body.error || "Failed to save changes") + detail);
      }
      return undefined;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

function useResetPortfolioMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/portfolio", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to reset content");
      }
      await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

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

// ---------------------------------------------------------------------
// UI Components
// ---------------------------------------------------------------------

function Nav({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const links = [
    ["about", "About"],
    ["work", "Work"],
    ["contact", "Contact"],
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
    <header className="fixed top-4 left-1/2 z-50 w-[95%] max-w-[1000px] -translate-x-1/2 rounded-full border border-card-border bg-background/80 px-6 py-4 backdrop-blur-md shadow-[var(--shadow-soft)] transition-all">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 group"
          data-testid="link-home"
        >
          {profile.image ? (
            <img
              src={profile.image}
              alt={profile.name}
              className="h-9 w-9 rounded-full object-cover transition-transform group-hover:scale-110"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-mono text-sm font-bold text-primary-foreground transition-transform group-hover:scale-110">
              {initials}
            </span>
          )}
          <span className="hidden font-mono text-[12px] font-semibold uppercase tracking-[.15em] sm:inline text-foreground">
            {profile.name}
          </span>
        </Link>

        <nav
          className={`${open ? "absolute left-0 top-[70px] flex w-full flex-col items-center gap-4 rounded-3xl border border-card-border bg-card p-6 shadow-xl" : "hidden"} md:static md:flex md:w-auto md:flex-row md:items-center md:gap-8 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
        >
          {links.map(([href, label]) => (
            <a
              key={href}
              href={`#${href}`}
              onClick={() => setOpen(false)}
              className="font-mono text-[11px] font-medium uppercase tracking-[.15em] text-muted-foreground transition-colors hover:text-primary"
              data-testid={`link-nav-${href}`}
            >
              {label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-full bg-secondary p-2 text-secondary-foreground md:hidden"
          aria-label="Toggle navigation"
          data-testid="button-toggle-nav"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
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
      <div className="flex h-8 items-center justify-center rounded-full bg-primary/10 px-4">
        <span className="font-mono text-[10px] font-bold text-primary">
          {number}
        </span>
      </div>
      <span className="font-mono text-[11px] uppercase tracking-[.2em] text-muted-foreground font-semibold">
        {children}
      </span>
      <span className="h-px w-16 bg-border" />
    </div>
  );
}

function Hero({ profile }: { profile: Profile }) {
  return (
    <section className="relative flex min-h-[min(900px,100dvh)] items-center overflow-hidden bg-background px-5 pb-16 pt-32 md:px-10 md:pb-20">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative mx-auto grid w-full max-w-[1440px] items-center gap-16 lg:grid-cols-[1.2fr_1fr]">
        <div className="z-10">
          <div className="reveal inline-flex items-center gap-3 rounded-full bg-primary/10 px-5 py-2.5 mb-8">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="font-mono text-[11px] uppercase tracking-[.15em] text-primary font-semibold">
              {profile.tagline}
            </p>
          </div>

          <h1 className="display-title reveal reveal-delay-1 max-w-5xl text-[clamp(3.5rem,8vw,7.5rem)] font-bold leading-[1.05] text-foreground tracking-tight">
            Building <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              the useful
            </span>
            <br />
            and unusual.
          </h1>

          <div className="reveal reveal-delay-2 mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="#work"
              className="group inline-flex w-fit items-center gap-3 rounded-full bg-foreground px-8 py-4 font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-background transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)] hover:bg-primary"
              data-testid="link-hero-work"
            >
              See selected work{" "}
              <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
            </a>

            {profile.resume && (
              <a
                href={profile.resume}
                download={profile.resumeName || "resume.pdf"}
                className="group inline-flex w-fit items-center gap-3 rounded-full border border-card-border bg-card px-8 py-4 font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-foreground transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)] hover:border-primary"
                data-testid="link-hero-resume"
              >
                Download résumé
                <ArrowDownRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
              </a>
            )}
          </div>
        </div>

        <div
          data-mf-parallax
          data-mf-parallax-speed="0.3"
          data-mf-parallax-speed-mobile="0"
          className="reveal reveal-delay-3 relative z-10 flex flex-col items-center lg:items-end mt-12 lg:mt-0"
        >
          <div className="relative group">
            <div className="absolute -inset-6 rounded-full bg-primary/5 scale-95 opacity-0 transition-all duration-700 ease-out group-hover:scale-100 group-hover:opacity-100" />

            {profile.image && (
              <img
                src={profile.image}
                alt={profile.name}
                className="relative z-10 h-72 w-72 rounded-full border-[8px] border-card object-cover shadow-[var(--shadow-soft)] transition-transform duration-500 ease-out group-hover:scale-[1.03] sm:h-96 sm:w-96"
                data-testid="img-profile-photo"
              />
            )}

            <div className="absolute bottom-6 -left-10 z-20 flex items-center gap-4 rounded-2xl border border-card-border bg-card/95 p-4 backdrop-blur-md shadow-xl transition-transform duration-500 hover:-translate-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MapPin size={20} />
              </div>
              <div>
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[.15em] text-muted-foreground">
                  Based in
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {profile.location}
                </p>
              </div>
            </div>

            <div className="absolute top-10 -right-12 z-20 hidden md:flex max-w-[240px] flex-col gap-2 rounded-2xl border border-card-border bg-card/95 p-5 backdrop-blur-md shadow-xl transition-transform duration-500 hover:-translate-y-2">
              <p className="text-sm leading-[1.6] text-muted-foreground font-medium">
                I care about the line between a good idea and the moment someone
                finally gets it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function About({ profile }: { profile: Profile }) {
  return (
    <section
      id="about"
      className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-36"
    >
      <div className="rounded-3xl bg-card p-8 md:p-16 shadow-[var(--shadow-soft)] border border-card-border">
        <SectionLabel number="01">A little context</SectionLabel>
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr] items-start">
          <p
            data-mf-animation="fade-up"
            className="text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-foreground"
          >
            {profile.bio1}
          </p>
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
    return <span className="text-5xl font-bold text-foreground">{value}</span>;
  }
  const [, digits, suffix] = match;
  const target = Number(digits.replace(/,/g, ""));
  return (
    <span className="text-5xl font-bold text-foreground">
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
    <section className="px-5 py-10 md:px-10">
      <div
        data-mf-stagger-animation="fade-up"
        data-mf-stagger-gap="100"
        className="mx-auto grid max-w-[1440px] grid-cols-2 gap-6 md:grid-cols-4"
      >
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="flex flex-col items-center justify-center rounded-3xl bg-card p-10 text-center shadow-[var(--shadow-soft)] border border-card-border transition-transform hover:-translate-y-1"
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

function Marquee({ services }: { services: Service[] }) {
  const words =
    services.length > 0
      ? services.map((service) => service.title)
      : ["Research", "Design", "Code", "Ship", "Learn"];

  return (
    <div className="my-10 overflow-hidden bg-primary/5 py-6">
      <div
        data-mf-ticker
        data-mf-ticker-speed="45"
        data-mf-ticker-pause-on-hover="true"
        className="font-mono text-[13px] font-bold uppercase tracking-[.2em] text-primary"
      >
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className="px-6 flex items-center gap-6"
          >
            {word} <span className="h-2 w-2 rounded-full bg-accent" />
          </span>
        ))}
      </div>
    </div>
  );
}

function Timeline({ data }: { data: PortfolioData }) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-32">
      <div className="grid gap-16 md:grid-cols-[1fr_1.2fr]">
        <div data-mf-animation="fade-up">
          <SectionLabel number="02">The long way round</SectionLabel>
          <h2 className="display-title text-[clamp(2.5rem,5vw,5rem)] font-bold leading-[1.05] tracking-tight">
            Learning by <span className="text-accent">doing.</span>
          </h2>
          <p className="mt-8 max-w-sm text-base leading-[1.8] text-muted-foreground">
            A practice built in public, with generous collaborators and a
            healthy suspicion of easy answers.
          </p>
        </div>

        <div
          data-mf-stagger-animation="fade-left"
          data-mf-stagger-gap="100"
          className="grid gap-6"
        >
          {data.education.map((item) => {
            const periodParts = item.period.split("-");

            return (
              <div
                className="group relative flex gap-6 rounded-3xl bg-card p-8 shadow-[var(--shadow-soft)] border border-card-border transition-all hover:shadow-xl hover:-translate-y-1"
                key={item.id}
              >
                <div className="hidden sm:flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full bg-primary/10 text-primary p-2 text-center">
                  <span className="font-mono text-[10px] font-bold leading-tight flex flex-col whitespace-pre-line">
                    {periodParts.length > 1 ? (
                      <>
                        {periodParts[0].trim()} —<br />
                        {periodParts[1].trim()}
                      </>
                    ) : (
                      item.period
                    )}
                  </span>
                </div>
                <div>
                  <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[.15em] text-accent sm:hidden">
                    {item.period}
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">
                    {item.degree}
                  </h3>
                  <p className="mt-2 font-mono text-[12px] font-medium text-primary">
                    {item.institution}
                  </p>
                  <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ExperienceSection({ data }: { data: PortfolioData }) {
  return (
    <section className="bg-secondary/30 px-5 py-24 md:px-10 md:py-32 rounded-[3rem] mx-2 md:mx-5">
      <div className="mx-auto max-w-[1440px]">
        <SectionLabel number="03">Selected chapters</SectionLabel>
        <div className="grid gap-16 md:grid-cols-[1fr_1.5fr] items-start">
          <h2
            data-mf-animation="fade-right"
            className="display-title sticky top-32 text-[clamp(2.5rem,5vw,5rem)] font-bold leading-[1.05] tracking-tight"
          >
            The work <br />
            behind <br />
            <span className="text-primary">the work.</span>
          </h2>

          <div
            data-mf-stagger-animation="fade-up"
            data-mf-stagger-gap="90"
            className="grid gap-6"
          >
            {data.experience.map((item, index) => (
              <div
                className="group rounded-3xl bg-card p-8 shadow-[var(--shadow-soft)] border border-card-border transition-all hover:shadow-xl hover:-translate-y-1"
                key={item.id}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-foreground">
                      {item.role}
                    </h3>
                    <p className="mt-2 font-mono text-[12px] font-bold text-primary">
                      {item.company}
                    </p>
                  </div>
                  <span className="inline-flex h-8 items-center rounded-full bg-secondary px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {item.period}
                  </span>
                </div>
                <p className="text-base leading-[1.7] text-muted-foreground">
                  {item.detail}
                </p>
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
        className="grid gap-6 md:grid-cols-3 mt-12"
      >
        {data.services.map((service) => (
          <article
            key={service.id}
            className="group relative bg-card p-10 rounded-3xl shadow-[var(--shadow-soft)] border border-card-border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col h-full"
          >
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary font-mono text-[12px] font-bold mb-8">
              {service.number}
            </div>

            <h3 className="text-2xl font-bold leading-tight text-foreground mb-4">
              {service.title}
            </h3>

            <p className="text-sm leading-[1.8] text-muted-foreground flex-grow">
              {service.description}
            </p>

            <div className="mt-10 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <ArrowUpRight className="h-5 w-5" />
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
      className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-32"
    >
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end mb-12">
        <SectionLabel number="05">Selected work</SectionLabel>
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[.15em] text-muted-foreground mb-12 md:mb-0">
          A small selection / 2022—2026
        </span>
      </div>

      <div
        data-mf-stagger-animation="fade-up"
        data-mf-stagger-gap="90"
        className="grid gap-10"
      >
        {data.projects.map((project, index) => (
          <article
            key={project.id}
            className="group grid gap-8 rounded-[2.5rem] bg-card p-8 md:p-10 shadow-[var(--shadow-soft)] border border-card-border transition-all hover:shadow-2xl hover:-translate-y-2 md:grid-cols-[1fr_1.2fr] items-center"
          >
            <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-3xl bg-secondary">
              {project.image ? (
                <>
                  <img
                    src={project.image}
                    alt={project.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10 transition-colors duration-700 group-hover:bg-transparent" />
                  <div className="absolute bottom-6 left-6 inline-flex rounded-full bg-background/90 backdrop-blur-md px-4 py-2 font-mono text-[10px] font-bold uppercase text-foreground z-10 shadow-sm">
                    {project.tags}
                  </div>
                </>
              ) : (
                <div
                  className={`absolute inset-0 transition-transform duration-700 group-hover:scale-105 flex items-center justify-center ${project.accent === "lime" ? "bg-green-100" : project.accent === "coral" ? "bg-red-100" : "bg-blue-100"}`}
                >
                  <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
                  <div className="absolute bottom-6 left-6 inline-flex rounded-full bg-white/80 backdrop-blur-md px-4 py-2 font-mono text-[10px] font-bold uppercase text-foreground shadow-sm">
                    {project.tags}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center px-4">
              <div className="flex items-center justify-between mb-6">
                <span className="inline-flex rounded-full bg-primary/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                  {project.category}
                </span>
                <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                  {project.year}
                </span>
              </div>

              <h3 className="text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.1] tracking-tight mb-6">
                {project.title}
              </h3>

              <p className="text-base leading-[1.8] text-muted-foreground mb-10">
                {project.description}
              </p>

              <a
                href="#"
                className="inline-flex w-fit items-center gap-3 rounded-full bg-secondary px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                View Project <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </article>
        ))}
      </div>
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

  return (
    <section className="bg-primary/5 px-5 py-24 md:px-10 md:py-36 rounded-[3rem] mx-2 md:mx-5 my-20">
      <div className="mx-auto max-w-[1440px]">
        <SectionLabel number="06">Good words, kept</SectionLabel>
        <div className="grid gap-12 md:grid-cols-[1.3fr_.7fr] items-center">
          <div className="flex flex-col justify-center">
            <div
              key={currentIndex}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out"
            >
              <p className="text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.2] tracking-tight text-foreground">
                “
                {item?.quote ||
                  "The best work makes the difficult feel possible."}
                ”
              </p>
              <div className="mt-10 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-mono font-bold text-primary">
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

            <div className="mt-12 flex gap-3">
              {data.testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-500 ease-in-out ${
                    currentIndex === idx
                      ? "w-10 bg-primary"
                      : "w-2 bg-foreground/20 hover:bg-foreground/40"
                  }`}
                  aria-label={`View testimonial ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="self-end rounded-3xl bg-card p-8 shadow-lg border border-card-border hidden md:block">
            <p className="text-base leading-[1.8] text-muted-foreground font-medium">
              The brief is never the whole story. I make room for the unexpected
              bit that makes the result feel alive.
            </p>
          </div>
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
    const subject = encodeURIComponent(
      `Hello from ${form.name || "your site"}`,
    );
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
      className="mt-12 grid gap-6 rounded-3xl bg-card p-8 shadow-xl border border-card-border sm:grid-cols-2 sm:p-10"
    >
      <label className="sm:col-span-1">
        <span className="mb-3 block font-mono text-[11px] font-semibold uppercase tracking-[.15em] text-muted-foreground">
          Your name
        </span>
        <input
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="w-full rounded-2xl border border-border bg-secondary/50 px-5 py-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
          placeholder="Jane Doe"
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
          className="w-full rounded-2xl border border-border bg-secondary/50 px-5 py-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
          placeholder="jane@example.com"
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
          className="w-full resize-y rounded-2xl border border-border bg-secondary/50 px-5 py-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
          placeholder="Tell me about your project..."
        />
      </label>
      <div className="flex flex-col items-start gap-4 sm:col-span-2 sm:flex-row sm:items-center mt-2">
        <button
          type="submit"
          className="inline-flex w-full sm:w-auto justify-center items-center gap-3 rounded-full bg-primary px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-[.1em] text-primary-foreground transition-all hover:-translate-y-1 hover:shadow-lg"
        >
          Send message <ArrowUpRight className="h-4 w-4" />
        </button>
        {sent && (
          <span className="rounded-full bg-green-100 px-4 py-2 font-mono text-[10px] font-bold uppercase text-green-700">
            Opening email app…
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
      className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-32"
    >
      <SectionLabel number="07">Your turn</SectionLabel>
      <div className="grid gap-16 md:grid-cols-[1.2fr_1fr] items-start">
        <div data-mf-animation="fade-up">
          <h2 className="display-title text-[clamp(3.5rem,7vw,6rem)] font-bold leading-[1.05] tracking-tight">
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
          <ContactForm email={profile.email} />
        </div>

        <div
          data-mf-animation="fade-left"
          className="flex flex-col gap-6 rounded-3xl bg-secondary/30 p-10 mt-0 md:mt-24"
        >
          <h3 className="font-mono text-[12px] font-bold uppercase tracking-wider text-foreground mb-4">
            Connect
          </h3>

          <a
            href={`https://${profile.github.replace(/^https?:\/\//, "")}`}
            className="group flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 font-mono text-[11px] font-semibold uppercase tracking-wider"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FaGithub size={18} />
            </div>
            {profile.github}
          </a>

          <a
            href={`mailto:${profile.email}`}
            className="group flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 font-mono text-[11px] font-semibold uppercase tracking-wider"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail size={18} />
            </div>
            say hello
          </a>

          <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm font-mono text-[11px] font-semibold uppercase tracking-wider">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MapPin size={18} />
            </div>
            {profile.location}
          </div>

          {profile.resume && (
            <a
              href={profile.resume}
              download={profile.resumeName || "resume.pdf"}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-card-border bg-card px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-wider transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-lg"
            >
              <ArrowDownRight size={16} /> Download résumé
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function Footer({ profile }: { profile: Profile }) {
  return (
    <footer className="border-t border-border bg-background px-5 py-12 md:px-10">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-6 md:flex-row">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          Made with curiosity & care
        </span>
        <a
          href="#top"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform hover:-translate-y-1"
          aria-label="Back to top"
        >
          ↑
        </a>
      </div>
    </footer>
  );
}

function PortfolioLoading({ error = false }: { error?: boolean } = {}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      {error ? (
        <div className="rounded-3xl bg-red-50 p-8 border border-red-100 max-w-sm">
          <p className="font-mono text-[12px] font-bold uppercase tracking-wider text-destructive mb-3">
            Oops! Could not load
          </p>
          <p className="text-sm text-red-600/80">
            The database did not return the content. Refresh the page and try
            again.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <span
            className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
            aria-hidden="true"
          />
          <p className="font-mono text-[11px] font-bold uppercase tracking-[.2em] text-primary">
            Loading Portfolio…
          </p>
        </div>
      )}
    </div>
  );
}

function PublicPortfolio() {
  const { data, isLoading, isError } = usePortfolioQuery();
  useMotionFlow([data]);
  if (isLoading) return <PortfolioLoading />;
  if (isError || !data) return <PortfolioLoading error />;
  return (
    <div
      id="top"
      className="min-h-[100dvh] bg-background selection:bg-primary/20 selection:text-primary"
    >
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
// Console / Admin Area
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
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm rounded-[2rem] bg-card p-8 shadow-[var(--shadow-soft)] border border-card-border">
        <div className="mb-8 flex flex-col items-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
            <p className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Secure Console Access
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Username
            </span>
            <input
              required
              autoFocus
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </span>
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
            />
          </label>
          {error && (
            <p className="rounded-lg bg-red-50 p-3 font-mono text-[10px] font-bold text-destructive text-center">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-4 font-mono text-[11px] font-bold uppercase tracking-wider text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5"
          >
            {submitting ? "Checking…" : "Log in securely"}
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
      image: "",
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
  const [form, setForm] = useState<Record<string, string>>(() => ({ ...value }) as unknown as Record<string, string>);
  useEffect(() => { setForm({ ...value } as unknown as Record<string, string>); }, [value]);
  
  const fields: Record<Resource, string[]> = {
    stats: ["value", "label"],
    services: ["number", "title", "description"],
    projects: ["title", "category", "year", "description", "tags", "accent", "image"],
    education: ["degree", "institution", "period", "detail"],
    experience: ["role", "company", "period", "detail"],
    testimonials: ["quote", "name", "role"],
  };
  const labels: Record<string, string> = {
    value: "Value (e.g. 06, 100+, ∞)", label: "Label (e.g. years making)",
    number: "Index", title: "Title", description: "Description",
    category: "Category", year: "Year", tags: "Tags", accent: "Color treatment Fallback",
    degree: "Degree", institution: "Institution", period: "Period",
    detail: "Detail", role: "Role", company: "Company",
    quote: "Quote", name: "Name", image: "Project Image (Optional)",
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setForm((prev) => ({ ...prev, [field]: dataUrl }));
    } catch (error) {
      console.error(error);
    } finally {
      event.target.value = "";
    }
  };
  
  return (
    <form
      onSubmit={(event) => { event.preventDefault(); onSave({ ...value, ...form } as PortfolioData[Resource][number]); }}
      className="mt-6 rounded-3xl border border-card-border bg-card p-5 md:p-8 shadow-md"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {fields[resource].map((field) => (
          <label key={field} className={field === "description" || field === "detail" || field === "quote" || field === "image" ? "md:col-span-2" : ""}>
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{labels[field]}</span>
            {field === "image" ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-border bg-secondary/50 p-4">
                 {form[field] ? (
                   <div className="flex items-center gap-4 w-full sm:w-auto">
                     <img src={form[field]} alt="Preview" className="h-16 w-16 shrink-0 rounded-lg object-cover shadow-sm" />
                     <button type="button" onClick={() => setForm(prev => ({ ...prev, [field]: "" }))} className="font-mono text-[10px] font-bold text-destructive uppercase tracking-wider hover:underline whitespace-nowrap">Remove Image</button>
                   </div>
                 ) : (
                   <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">No image uploaded.</span>
                 )}
                 <label className="sm:ml-auto inline-flex w-full sm:w-auto cursor-pointer items-center justify-center rounded-full bg-primary/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors whitespace-nowrap">
                   <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, field)} className="hidden" />
                   {form[field] ? "Replace Image" : "Upload Image"}
                 </label>
              </div>
            ) : field === "accent" ? (
              <select
                value={form[field] || ""}
                onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
              >
                <option value="lime">Lime</option><option value="coral">Coral</option><option value="blue">Blue</option>
              </select>
            ) : field === "description" || field === "detail" || field === "quote" ? (
              <textarea
                required value={form[field] || ""} rows={4}
                onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                className="w-full resize-y rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
              />
            ) : (
              <input
                required value={form[field] || ""}
                onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
              />
            )}
          </label>
        ))}
      </div>
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button type="submit" className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-full bg-primary px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <Save size={14} /> Save {resourceMeta[resource].singular}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full w-full sm:w-auto border border-border bg-card px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-secondary transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}

function ProfileEditor({ profile, onSave, saving }: { profile: Profile; onSave: (value: Profile) => void; saving: boolean; }) {
  const [form, setForm] = useState<Profile>(profile);
  const [imageError, setImageError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  useEffect(() => { setForm(profile); }, [profile]);
  
  const fields: { key: keyof Profile; label: string; long?: boolean }[] = [
    { key: "name", label: "Name" }, { key: "email", label: "Email" },
    { key: "tagline", label: "Tagline" }, { key: "location", label: "Location" },
    { key: "github", label: "GitHub (e.g. github.com/you)" },
    { key: "bio1", label: "Headline bio", long: true },
    { key: "bio2", label: "About paragraph 1", long: true },
    { key: "bio3", label: "About paragraph 2", long: true },
    { key: "contactTitle", label: "Contact heading", long: true },
    { key: "contactNote", label: "Contact note" },
  ];

  const handleImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    setImageError(null);
    try { const dataUrl = await fileToResizedDataUrl(file); setForm((current) => ({ ...current, image: dataUrl })); }
    catch (error) { setImageError((error as Error).message); } finally { event.target.value = ""; }
  };

  const handleResume = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    setResumeError(null);
    if (file.size > 2 * 1024 * 1024) { setResumeError("That file is too large — please keep it under 2MB."); event.target.value = ""; return; }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onerror = () => reject(new Error("Could not read that file."));
        reader.onload = () => resolve(reader.result as string); reader.readAsDataURL(file);
      });
      setForm((current) => ({ ...current, resume: dataUrl, resumeName: file.name }));
    } catch (error) { setResumeError((error as Error).message); } finally { event.target.value = ""; }
  };

  return (
    <form onSubmit={(event) => { event.preventDefault(); onSave(form); }} className="mt-6 rounded-3xl border border-card-border bg-card p-5 md:p-10 shadow-md">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-secondary bg-secondary">
          {form.image ? <img src={form.image} alt="Profile" className="h-full w-full object-cover" /> : <span className="font-mono text-[10px] uppercase text-muted-foreground">No photo</span>}
        </div>
        <div className="flex flex-col gap-3 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="inline-flex w-full sm:w-auto cursor-pointer items-center justify-center rounded-full bg-secondary px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-secondary/70 transition-colors whitespace-nowrap">
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" /> Upload new photo
            </label>
            {form.image && (
              <button type="button" onClick={() => setForm((current) => ({ ...current, image: "" }))} className="w-full sm:w-auto rounded-full bg-red-50 px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap">
                Remove
              </button>
            )}
          </div>
          {imageError && <p className="font-mono text-[11px] text-destructive">{imageError}</p>}
        </div>
      </div>
      
      <div className="mb-10 rounded-2xl bg-secondary/30 p-5 md:p-6 border border-border min-w-0">
        <span className="mb-4 block font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">Résumé Document</span>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label className="inline-flex w-full sm:w-auto cursor-pointer items-center justify-center rounded-full bg-primary/10 px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors whitespace-nowrap">
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleResume} className="hidden" />
            {form.resume ? "Replace file" : "Upload file"}
          </label>
          {form.resume && (
            <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
              <span className="font-mono text-[12px] font-medium text-foreground truncate">{form.resumeName || "resume.pdf"}</span>
              <button type="button" onClick={() => setForm((current) => ({ ...current, resume: "", resumeName: "" }))} className="shrink-0 font-mono text-[11px] font-bold uppercase text-destructive hover:underline">
                Remove
              </button>
            </div>
          )}
        </div>
        {resumeError && <p className="mt-3 font-mono text-[11px] text-destructive">{resumeError}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {fields.map(({ key, label, long }) => (
          <label key={key} className={long ? "md:col-span-2" : ""}>
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            {long ? (
              <textarea
                required value={form[key]} rows={3}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                className="w-full resize-y rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
              />
            ) : (
              <input
                required value={form[key]}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
              />
            )}
          </label>
        ))}
      </div>
      <div className="mt-8 flex gap-3">
        <button type="submit" disabled={saving} className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-full bg-primary px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 whitespace-nowrap">
          <Save size={16} /> Save profile
        </button>
      </div>
    </form>
  );
}

function AdminArea({ data, username }: { data: PortfolioData; username?: string; }) {
  const [section, setSection] = useState<"profile" | Resource>("profile");
  const [editing, setEditing] = useState<PortfolioData[Resource][number] | null>(null);
  const [saved, setSaved] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const saveMutation = useSavePortfolioMutation();
  const resetMutation = useResetPortfolioMutation();
  const resource = section === "profile" ? null : section;
  const items = resource ? (data[resource] ?? []) : [];

  const persist = (next: PortfolioData, onDone?: () => void) => {
    saveMutation.mutate(next, {
      onSuccess: () => {
        setSaved(true); window.setTimeout(() => setSaved(false), 1800);
        toast({ title: "Saved ✨", description: "Your beautiful changes are live!" });
        onDone?.();
      },
      onError: (error) => { toast({ variant: "destructive", title: "Save failed", description: (error as Error)?.message || "Something went wrong." }); },
    });
  };

  const saveProfile = (value: Profile) => persist({ ...data, profile: value });
  const saveItem = (value: PortfolioData[Resource][number]) => {
    if (!resource) return;
    const next = items.some((item) => item.id === value.id) ? items.map((item) => (item.id === value.id ? value : item)) : [...items, value];
    persist({ ...data, [resource]: next }, () => setEditing(null));
  };
  const deleteItem = (id: string) => {
    if (!resource) return;
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    persist({ ...data, [resource]: items.filter((item) => item.id !== id) });
  };
  const resetAll = () => {
    if (!window.confirm("Reset all content to the original portfolio?")) return;
    resetMutation.mutate(undefined, {
      onSuccess: () => { toast({ title: "Reset complete", description: "Fresh default content is live." }); },
      onError: (error) => { toast({ variant: "destructive", title: "Reset failed", description: (error as Error)?.message }); },
    });
  };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-sm font-bold text-primary-foreground shadow-md">
              AV
            </span>
            <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-foreground truncate">
              Console {username ? `· ${username}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 [scrollbar-width:none]">
            <button onClick={() => setLocation("/")} className="whitespace-nowrap shrink-0 flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
              View site <ExternalLink size={14} />
            </button>
            <button onClick={logout} className="whitespace-nowrap shrink-0 flex items-center gap-2 rounded-full bg-red-50 px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-100 transition-colors">
              Log out <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>
      
      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-10 md:py-16 min-w-0">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end rounded-3xl bg-primary/5 p-6 md:p-12 border border-primary/10">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-primary mb-6 whitespace-nowrap">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Live Editing
            </span>
            <h1 className="text-[clamp(2rem,6vw,5rem)] font-bold leading-tight tracking-tight text-foreground break-words">
              Shape the <span className="text-primary">story.</span>
            </h1>
          </div>
          <div className="max-w-xs text-sm leading-[1.7] text-muted-foreground font-medium shrink-0">
            <p>Edits save straight to the live database and appear on the public site immediately.</p>
            {saveMutation.isPending && <p className="mt-3 font-mono text-[10px] uppercase text-primary">Saving your magic…</p>}
            {saved && <p className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase text-green-600"><Check size={14} /> Saved beautiful</p>}
          </div>
        </div>
        
        <div className="grid gap-10 lg:grid-cols-[240px_1fr] min-w-0">
          <aside className="min-w-0 lg:border-r lg:border-border lg:pr-8">
            <div className="-mx-4 px-4 flex gap-3 overflow-x-auto pb-4 snap-x lg:mx-0 lg:px-0 lg:flex-col lg:gap-2 lg:overflow-visible lg:pb-0 [scrollbar-width:none]">
              <button
                onClick={() => { setSection("profile"); setEditing(null); }}
                className={`whitespace-nowrap flex w-auto sm:w-full shrink-0 snap-start items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all ${section === "profile" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary"}`}
              >
                Profile
              </button>
              {(Object.keys(resourceMeta) as Resource[]).map((key) => (
                <button
                  key={key}
                  onClick={() => { setSection(key); setEditing(null); }}
                  className={`whitespace-nowrap flex w-auto sm:w-full shrink-0 snap-start items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all ${section === key ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary"}`}
                >
                  <span>{resourceMeta[key].label}</span>
                  <span className={`inline-flex h-6 items-center justify-center rounded-full px-2 text-[9px] ${section === key ? "bg-primary-foreground/20" : "bg-card border border-border"}`}>
                    {(data[key] ?? []).length.toString().padStart(2, "0")}
                  </span>
                </button>
              ))}
            </div>
            
            <button
              onClick={resetAll} disabled={resetMutation.isPending}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-100 bg-red-50 px-4 py-4 font-mono text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-100 transition-colors"
            >
              <RotateCcw size={14} /> Reset all content
            </button>
          </aside>
          
          {section === "profile" ? (
            <section className="min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Profile Settings</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">Customize your personal brand across the site.</p>
              <ProfileEditor profile={data.profile} onSave={saveProfile} saving={saveMutation.isPending} />
            </section>
          ) : (
            resource && (
              <section className="min-w-0">
                <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2 truncate">{resourceMeta[resource].label}</h2>
                    <p className="text-sm sm:text-base text-muted-foreground">Manage your {resourceMeta[resource].label.toLowerCase()} collection.</p>
                  </div>
                  <button
                    onClick={() => setEditing(emptyFor(resource))}
                    className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all whitespace-nowrap"
                  >
                    <Plus size={16} /> Add {resourceMeta[resource].singular}
                  </button>
                </div>
                
                {editing && <AdminForm key={editing.id} resource={resource} value={editing} onSave={saveItem} onCancel={() => setEditing(null)} />}
                
                <div className="mt-8 grid gap-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 rounded-2xl bg-card p-5 shadow-sm border border-card-border hover:shadow-md transition-shadow min-w-0">
                      <div className="flex items-start sm:items-center gap-4 min-w-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-primary">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-foreground truncate">{itemTitle(item)}</h3>
                          <p className="mt-1 truncate max-w-full text-sm text-muted-foreground font-medium">{itemSubtitle(item)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 self-end sm:self-auto shrink-0">
                        <button onClick={() => setEditing(item)} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors">
                          <Trash2 size={16} />
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

  if (auth.isLoading)
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  if (!auth.data?.authenticated) return <LoginPage />;
  if (portfolio.isLoading) return <PortfolioLoading />;
  if (portfolio.isError || !portfolio.data) return <PortfolioLoading error />;
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
