import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Mail,
  MapPin,
  Menu,
  X,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Link } from "wouter";
import { useMotionFlow } from "@/lib/motionflow";
import type {
  PortfolioData,
  Profile,
  Service,
  Stat,
} from "@/lib/portfolio-types";
import { usePortfolioQuery } from "@/lib/portfolio-api";

// ---------------------------------------------------------------------
// Public-facing portfolio site.
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

export function PortfolioLoading({ error = false }: { error?: boolean } = {}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background px-6 text-center overflow-hidden">
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
          <style
            dangerouslySetInnerHTML={{
              __html: `
              .macbook { position: relative; width: 228px; height: 260px; }
              .macbook__topBord { position: absolute; z-index: 0; top: 34px; left: 0; width: 128px; height: 116px; border-radius: 6px; transform-origin: center; background: linear-gradient(-135deg, #c8c9c9 52%, #8c8c8c 56%); transform: scale(0) skewY(-30deg); animation: topbord 0.4s 1.7s ease-out forwards; }
              .macbook__topBord::before { content: ""; position: absolute; z-index: 2; top: 8px; left: 6px; width: 100%; height: 100%; border-radius: 6px; background: #000; }
              .macbook__topBord::after { content: ""; position: absolute; z-index: 1; bottom: -7px; left: 8px; width: 168px; height: 12px; transform-origin: left bottom; transform: rotate(-42deg) skew(-4deg); background: linear-gradient(-135deg, #c8c9c9 52%, #8c8c8c 56%); }
              .macbook__display { position: absolute; z-index: 10; top: 17px; left: 12px; width: calc(100% - 12px); height: calc(100% - 18px); background: #111; border-radius: 2px; overflow: hidden; }
              .macbook__display::before { content: ""; position: absolute; z-index: 15; top: -9px; left: -6px; width: calc(100% + 12px); height: calc(100% + 18px); border-radius: 6px; background: linear-gradient(60deg, rgba(255, 255, 255, 0) 60%, rgba(255, 255, 255, 0.15) 60%); pointer-events: none; }
              .macbook__load { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #222; z-index: 20; animation: display 0.4s 4.3s ease forwards; }
              .macbook__load::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto; width: 80px; height: 6px; border-radius: 3px; border: solid 1px #fff; }
              .macbook__load::after { content: ""; position: absolute; top: 0; left: 18px; bottom: 0; margin: auto; width: 0; height: 6px; border-radius: 3px; background: #fff; animation: load 2s 2s ease-out forwards; }
              .macbook__underBord { position: relative; left: 42px; bottom: -145px; width: 150px; height: 90px; border-radius: 6px; transform-origin: center; transform: rotate(-30deg) skew(30deg); background: linear-gradient(-45deg, #c8c9c9 61%, #8c8c8c 66%); animation: modal 0.5s 1s ease-out forwards; opacity: 0; }
              .macbook__underBord::before { content: ""; position: absolute; z-index: 3; top: -8px; left: 8px; width: 100%; height: 100%; border-radius: 6px; background: #dcdede; }
              .macbook__underBord::after { content: ""; position: absolute; z-index: 2; top: -8px; left: 12px; width: 170px; height: 15px; transform-origin: top left; background: linear-gradient(-45deg, #c8c9c9 61%, #8c8c8c 66%); transform: rotate(31deg) skew(-16deg); }
              .macbook__keybord { position: relative; top: 0; left: 16px; z-index: 3; border-radius: 3px; width: calc(100% - 16px); height: 45px; background: #c8c9c9; }
              .macbook__keybord::before { content: ""; position: absolute; bottom: -30px; left: 0; right: 0; margin: 0 auto; width: 40px; height: 25px; border-radius: 3px; background: #c8c9c9; }
              .keybord { position: relative; top: 2px; left: 2px; display: flex; flex-direction: column; width: calc(100% - 3px); height: calc(100% - 4px); }
              .keybord__touchbar { width: 100%; height: 6px; border-radius: 3px; background: #000; }
              .keybord__keyBox { display: grid; grid-template-rows: 3fr 1fr; grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr; width: 100%; height: 24px; margin: 1px 0 0 0; padding: 0 0 0 1px; box-sizing: border-box; list-style: none; }
              .keybord__key { position: relative; width: 8px; height: 7px; margin: 1px; background: #000; }
              .keybord__keyBox .keybord__key { transform: translate(60px, -60px); animation: key 0.2s 1.4s ease-out forwards; opacity: 0; }
              .keybord__keyBox .keybord__key::before, .keybord__keyBox .keybord__key::after { content: ""; position: absolute; left: 0; width: 100%; height: 100%; background: #000; }
              .keybord__key::before { top: 8px; transform: translate(20px, -20px); animation: key1 0.2s 1.5s ease-out forwards; }
              .keybord__key::after { top: 16px; transform: translate(40px, -40px); animation: key2 0.2s 1.6s ease-out forwards; }
              .keybord__keyBox .key--12::before { width: 10px; }
              .keybord__keyBox .key--13::before { height: 10px; }
              .key--01 { grid-row: 1 / 2; grid-column: 1 / 2; }
              .key--02 { grid-row: 1 / 2; grid-column: 2 / 3; }
              .key--03 { grid-row: 1 / 2; grid-column: 3 / 4; }
              .key--04 { grid-row: 1 / 2; grid-column: 4 / 5; }
              .key--05 { grid-row: 1 / 2; grid-column: 5 / 6; }
              .key--06 { grid-row: 1 / 2; grid-column: 6 / 7; }
              .key--07 { grid-row: 1 / 2; grid-column: 7 / 8; }
              .key--08 { grid-row: 1 / 2; grid-column: 8 / 9; }
              .key--09 { grid-row: 1 / 2; grid-column: 9 / 10; }
              .key--10 { grid-row: 1 / 2; grid-column: 10 / 11; }
              .key--11 { grid-row: 1 / 2; grid-column: 11 / 12; }
              .key--12 { grid-row: 1 / 2; grid-column: 12 / 13; }
              .key--13 { grid-row: 1 / 2; grid-column: 13 / 14; }
              .keybord__keyBox--under { margin: 0; padding: 0 0 0 1px; box-sizing: border-box; list-style: none; display: flex; }
              .keybord__keyBox--under .keybord__key { transform: translate(80px, -80px); animation: key3 0.3s 1.6s linear forwards; opacity: 0; }
              .key--19 { width: 28px; }
              @keyframes topbord { 0% { transform: scale(0) skewY(-30deg); } 30% { transform: scale(1.1) skewY(-30deg); } 45% { transform: scale(0.9) skewY(-30deg); } 60% { transform: scale(1.05) skewY(-30deg); } 75% { transform: scale(0.95) skewY(-30deg); } 90% { transform: scale(1.02) skewY(-30deg); } 100% { transform: scale(1) skewY(-30deg); } }
              @keyframes display { 0% { opacity: 1; } 100% { opacity: 0; visibility: hidden; } }
              @keyframes load { 0% { width: 0; } 20% { width: 40px; } 30% { width: 40px; } 60% { width: 60px; } 90% { width: 60px; } 100% { width: 80px; } }
              @keyframes modal { 0% { transform: scale(0) rotate(-30deg) skew(30deg); opacity: 0; } 30% { transform: scale(1.1) rotate(-30deg) skew(30deg); opacity: 1; } 45% { transform: scale(0.9) rotate(-30deg) skew(30deg); opacity: 1; } 60% { transform: scale(1.05) rotate(-30deg) skew(30deg); opacity: 1; } 75% { transform: scale(0.95) rotate(-30deg) skew(30deg); opacity: 1; } 90% { transform: scale(1.02) rotate(-30deg) skew(30deg); opacity: 1; } 100% { transform: scale(1) rotate(-30deg) skew(30deg); opacity: 1; } }
              @keyframes key { 0% { transform: translate(60px, -60px); opacity: 0; } 100% { transform: translate(0px, 0px); opacity: 1; } }
              @keyframes key1 { 0% { transform: translate(20px, -20px); opacity: 0; } 100% { transform: translate(0px, 0px); opacity: 1; } }
              @keyframes key2 { 0% { transform: translate(40px, -40px); opacity: 0; } 100% { transform: translate(0px, 0px); opacity: 1; } }
              @keyframes key3 { 0% { transform: translate(80px, -80px); opacity: 0; } 100% { transform: translate(0px, 0px); opacity: 1; } }
              @keyframes textFadeIn { 0% { opacity: 0; } 100% { opacity: 1; }}
            `,
            }}
          />
          <div className="macbook">
            <div className="macbook__topBord">
              <div className="macbook__display">
                <div className="macbook__load"></div>
                <div
                  className="absolute inset-0 p-3 flex flex-col font-mono z-10 opacity-0"
                  style={{ animation: "textFadeIn 0.5s 4.7s forwards" }}
                >
                  <div className="text-[12px] text-green-500 mb-1 flex items-center whitespace-nowrap">
                    <span className="mr-1">&gt;</span>
                    <span>I'm Akhil, a</span>
                  </div>
                  <div className="flex items-center text-[13px] font-bold text-green-400">
                    <span className="mr-2">&gt;</span>
                    <div
                      data-mf-text-type="typing"
                      data-mf-text-typing-speed="80"
                      data-mf-text-typing-delete-speed="40"
                      data-mf-text-typing-interval="1200"
                      data-mf-text-typing-loop="true"
                      data-mf-text-typing-cursor="true"
                      data-mf-text-typing-cursor-char="|"
                      data-mf-text-typing-cursor-blink="true"
                    >
                      <span>Developer.</span>
                      <span>Designer.</span>
                      <span>Editor.</span>
                    </div>
                    <span className="animate-pulse w-2 h-4 bg-green-400 ml-[2px] block"></span>
                  </div>
                </div>
              </div>
            </div>
            <div className="macbook__underBord">
              <div className="macbook__keybord">
                <div className="keybord">
                  <div className="keybord__touchbar"></div>
                  <ul className="keybord__keyBox">
                    <li className="keybord__key key--01"></li>
                    <li className="keybord__key key--02"></li>
                    <li className="keybord__key key--03"></li>
                    <li className="keybord__key key--04"></li>
                    <li className="keybord__key key--05"></li>
                    <li className="keybord__key key--06"></li>
                    <li className="keybord__key key--07"></li>
                    <li className="keybord__key key--08"></li>
                    <li className="keybord__key key--09"></li>
                    <li className="keybord__key key--10"></li>
                    <li className="keybord__key key--11"></li>
                    <li className="keybord__key key--12"></li>
                    <li className="keybord__key key--13"></li>
                  </ul>
                  <ul className="keybord__keyBox--under">
                    <li className="keybord__key key--14"></li>
                    <li className="keybord__key key--15"></li>
                    <li className="keybord__key key--16"></li>
                    <li className="keybord__key key--17"></li>
                    <li className="keybord__key key--18"></li>
                    <li className="keybord__key key--19"></li>
                    <li className="keybord__key key--20"></li>
                    <li className="keybord__key key--21"></li>
                    <li className="keybord__key key--22"></li>
                    <li className="keybord__key key--23"></li>
                    <li className="keybord__key key--24"></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PublicPortfolio() {
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
