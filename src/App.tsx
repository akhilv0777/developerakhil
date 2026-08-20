import { type FormEvent, type ReactNode, useState } from 'react';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { ArrowDownRight, ArrowUpRight, Check, ExternalLink, Lock, LogOut, Mail, MapPin, Menu, Pencil, Plus, RotateCcw, Save, Trash2, X } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import '@/index.css';

type Service = { id: string; title: string; description: string; number: string };
type Project = { id: string; title: string; category: string; year: string; description: string; tags: string; accent: string };
type Education = { id: string; degree: string; institution: string; period: string; detail: string };
type Experience = { id: string; role: string; company: string; period: string; detail: string };
type Testimonial = { id: string; quote: string; name: string; role: string };
type PortfolioData = { services: Service[]; projects: Project[]; education: Education[]; experience: Experience[]; testimonials: Testimonial[] };

// Used only as an instant-render placeholder while the real content
// loads from the database, and as the payload for "reset to defaults".
const defaultPortfolioData: PortfolioData = {
  services: [
    { id: 'svc-1', number: '01', title: 'Product engineering', description: 'From first sketch to a reliable, fast product people want to use.' },
    { id: 'svc-2', number: '02', title: 'Web experiences', description: 'Editorial, expressive interfaces with a little more soul than expected.' },
    { id: 'svc-3', number: '03', title: 'Design systems', description: 'A shared visual language that lets a team move quickly without losing taste.' },
  ],
  projects: [
    { id: 'prj-1', title: 'Aster / finance for humans', category: 'Product design + engineering', year: '2024', description: 'A calmer way to understand the money moving through your life.', tags: 'React, TypeScript, Product', accent: 'lime' },
    { id: 'prj-2', title: 'Fieldnotes', category: 'Editorial platform', year: '2023', description: 'A living archive for curious people making things in the real world.', tags: 'Next.js, CMS, Art direction', accent: 'coral' },
    { id: 'prj-3', title: 'Morrow studio', category: 'Brand system + web', year: '2023', description: 'A new digital home for a studio working at the edge of materials and light.', tags: 'WebGL, Motion, Strategy', accent: 'blue' },
  ],
  education: [
    { id: 'edu-1', degree: 'B.Tech, Computer Science', institution: 'University of Mumbai', period: '2015 — 2019', detail: 'Systems, algorithms, and the habit of taking things apart to see how they work.' },
    { id: 'edu-2', degree: 'The self-directed studio', institution: 'Everywhere, always', period: '2019 — now', detail: 'A continuing practice in visual design, typography, and making useful things.' },
  ],
  experience: [
    { id: 'exp-1', role: 'Senior full-stack developer', company: 'Independent / select partners', period: '2021 — now', detail: 'Partnering with founders and small teams to turn ambitious ideas into shipped products.' },
    { id: 'exp-2', role: 'Full-stack developer', company: 'Bynocs Technologies', period: '2019 — 2021', detail: 'Built dependable web platforms and learned that good software begins with listening.' },
  ],
  testimonials: [
    { id: 'tst-1', quote: 'Akhilesh brings the rare combination of a sharp eye and the patience to make the hard parts simple.', name: 'Riya Menon', role: 'Founder, Common Thread' },
    { id: 'tst-2', quote: 'He made our product feel like us. Not just functional — unmistakably ours.', name: 'Nikhil Shah', role: 'Creative director, Morrow' },
  ],
};

// ---------------------------------------------------------------------
// Data layer: public content comes from GET /api/portfolio (no auth).
// Admin edits are saved via PUT /api/portfolio (requires a valid session
// cookie, checked server-side — see api/portfolio.ts).
// ---------------------------------------------------------------------

function usePortfolioQuery() {
  return useQuery<PortfolioData>({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load portfolio content');
      return response.json();
    },
    initialData: defaultPortfolioData,
    staleTime: 30_000,
  });
}

function useSavePortfolioMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PortfolioData) => {
      const response = await fetch('/api/portfolio', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save changes');
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['portfolio'], data);
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
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.status === 401) return { authenticated: false };
      if (!response.ok) throw new Error('Failed to check session');
      return response.json();
    },
    staleTime: 60_000,
    retry: false,
  });
}

function Nav() {
  const [open, setOpen] = useState(false);
  const links = [['about', '01 / about'], ['work', '02 / work'], ['contact', '03 / contact']];
  return <header className="fixed top-0 z-30 w-full border-b border-foreground/15 bg-background/90 backdrop-blur-md"><div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 md:px-10"><Link href="/" className="flex items-center gap-3" data-testid="link-home"><span className="flex h-8 w-8 items-center justify-center bg-foreground font-mono text-sm font-bold text-background">AV</span><span className="hidden font-mono text-[11px] uppercase tracking-[.22em] sm:inline">Akhilesh Vishwakarma</span></Link><nav className={`${open ? 'absolute left-0 top-[72px] flex w-full flex-col border-b border-foreground/15 bg-background p-5' : 'hidden'} gap-5 md:static md:flex md:w-auto md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0`}>{links.map(([href, label]) => <a key={href} href={`#${href}`} onClick={() => setOpen(false)} className="font-mono text-[11px] uppercase tracking-[.16em] text-muted-foreground transition-colors hover:text-foreground" data-testid={`link-nav-${href}`}>{label}</a>)}</nav><button type="button" onClick={() => setOpen((value) => !value)} className="border border-foreground/20 p-2 md:hidden" aria-label="Toggle navigation" data-testid="button-toggle-nav">{open ? <X size={18} /> : <Menu size={18} />}</button></div></header>;
}

function SectionLabel({ number, children, dark = false }: { number: string; children: ReactNode; dark?: boolean }) {
  return <div className={`mb-10 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[.2em] ${dark ? 'text-background/60' : 'text-muted-foreground'}`}><span className={dark ? 'text-primary' : 'text-accent'}>{number}</span><span>{children}</span><span className="h-px w-12 bg-current opacity-40" /></div>;
}

function Hero() {
  return <section className="grid-paper relative flex min-h-[min(900px,100dvh)] items-end overflow-hidden border-b border-foreground/15 px-5 pb-16 pt-32 md:px-10 md:pb-20"><div className="mx-auto grid w-full max-w-[1440px] items-end gap-12 lg:grid-cols-[1fr_320px]"><div><p className="reveal mb-8 font-mono text-[11px] uppercase tracking-[.22em] text-muted-foreground">Full-stack developer <span className="mx-2 text-accent">/</span> digital craftsman</p><h1 className="display-title reveal reveal-delay-1 max-w-5xl text-[clamp(4.5rem,13vw,12.5rem)] font-semibold leading-[.78]">Building<br /><span className="text-accent">the useful</span><br />and unusual.</h1><div className="reveal reveal-delay-2 mt-12 flex flex-col gap-5 sm:flex-row sm:items-center"><a href="#work" className="group inline-flex w-fit items-center gap-5 bg-foreground px-5 py-4 font-mono text-[11px] uppercase tracking-[.14em] text-background transition-transform hover:-translate-y-1" data-testid="link-hero-work">See selected work <ArrowDownRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1 group-hover:translate-y-1" /></a><span className="font-mono text-[11px] text-muted-foreground">Currently accepting a few good problems.</span></div></div><div className="reveal reveal-delay-3 relative hidden h-[300px] border-l border-foreground/20 pl-7 lg:block"><div className="absolute left-7 top-0 h-2 w-2 -translate-x-1/2 bg-primary" /><p className="font-mono text-[11px] uppercase leading-[1.8] text-muted-foreground">Based in<br /><strong className="font-normal text-foreground">Mumbai, India</strong></p><div className="absolute bottom-0 left-7 right-0"><div className="mb-4 h-px w-full bg-foreground/20" /><p className="font-mono text-[11px] leading-[1.8] text-muted-foreground">I care about the line between a good idea and the moment someone finally gets it.</p></div></div></div><div className="absolute right-5 top-28 font-mono text-[10px] text-muted-foreground md:right-10">01—05 / 2025</div></section>;
}

function About() {
  return <section id="about" className="mx-auto grid max-w-[1440px] gap-12 px-5 py-24 md:grid-cols-[.6fr_1.4fr] md:px-10 md:py-36"><SectionLabel number="01">A little context</SectionLabel><div><p className="max-w-4xl text-[clamp(2rem,4.8vw,5rem)] font-medium leading-[.98] tracking-[-.055em]">I’m Akhilesh — a developer who likes products with a point of view.</p><div className="mt-12 grid gap-8 border-t border-foreground/15 pt-7 text-sm leading-[1.8] text-muted-foreground md:grid-cols-2"><p>For the past 6 years, I’ve moved between interface, API, database, and the conversations that connect them. The best work happens when those boundaries get blurry.</p><p>I work with people who have something worth making and need a partner who can bring both technical rigor and a human eye to the room.</p></div></div></section>;
}

function Stats() {
  const stats = [['06', 'years making'], ['38', 'things shipped'], ['12', 'happy teams'], ['∞', 'tabs open']];
  return <section className="border-y border-foreground/15 bg-foreground px-5 py-10 text-background md:px-10"><div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-y-10 md:grid-cols-4">{stats.map(([value, label]) => <div key={label} className="border-l border-background/20 pl-5 first:border-0"><p className="font-mono text-4xl text-primary md:text-5xl" data-testid={`stat-${label}`}>{value}</p><p className="mt-2 font-mono text-[10px] uppercase tracking-[.18em] text-background/60">{label}</p></div>)}</div></section>;
}

function Marquee() {
  return <div className="overflow-hidden border-b border-foreground/15 bg-primary py-3 text-foreground"><div className="flex w-max animate-[ticker_22s_linear_infinite] font-mono text-[11px] uppercase tracking-[.2em]"><span className="pr-8">Research → design → code → ship → learn → repeat&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;</span><span className="pr-8">Research → design → code → ship → learn → repeat&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;</span></div></div>;
}

function Timeline({ data }: { data: PortfolioData }) {
  return <section className="mx-auto grid max-w-[1440px] gap-16 px-5 py-24 md:grid-cols-2 md:px-10 md:py-32"><div><SectionLabel number="02">The long way round</SectionLabel><h2 className="display-title max-w-xl text-5xl font-semibold leading-[.9] tracking-[-.06em] md:text-7xl">Learning by<br /><span className="text-accent">doing.</span></h2><p className="mt-8 max-w-sm text-sm leading-[1.8] text-muted-foreground">A practice built in public, with generous collaborators and a healthy suspicion of easy answers.</p></div><div className="space-y-0 border-t border-foreground/15">{data.education.map((item) => <div className="grid gap-4 border-b border-foreground/15 py-7 sm:grid-cols-[130px_1fr]" key={item.id} data-testid={`education-${item.id}`}><p className="font-mono text-[10px] uppercase tracking-[.12em] text-accent">{item.period}</p><div><h3 className="text-lg font-medium">{item.degree}</h3><p className="mt-1 font-mono text-[11px] text-muted-foreground">{item.institution}</p><p className="mt-4 text-sm leading-[1.7] text-muted-foreground">{item.detail}</p></div></div>)}</div></section>;
}

function ExperienceSection({ data }: { data: PortfolioData }) {
  return <section className="bg-foreground px-5 py-24 text-background md:px-10 md:py-32"><div className="mx-auto max-w-[1440px]"><SectionLabel dark number="03">Selected chapters</SectionLabel><div className="grid gap-12 md:grid-cols-[.65fr_1.35fr]"><h2 className="display-title text-5xl font-semibold leading-[.88] tracking-[-.06em] md:text-7xl">The work<br />behind<br /><span className="text-primary">the work.</span></h2><div className="border-t border-background/20">{data.experience.map((item, index) => <div className="grid gap-5 border-b border-background/20 py-8 sm:grid-cols-[100px_1fr_100px]" key={item.id} data-testid={`experience-${item.id}`}><span className="font-mono text-[10px] text-background/50">0{index + 1}</span><div><h3 className="text-xl">{item.role}</h3><p className="mt-1 font-mono text-[11px] text-primary">{item.company}</p><p className="mt-5 max-w-xl text-sm leading-[1.7] text-background/60">{item.detail}</p></div><span className="font-mono text-[10px] text-background/50 sm:text-right">{item.period}</span></div>)}</div></div></div></section>;
}

function Services({ data }: { data: PortfolioData }) {
  return <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-32"><SectionLabel number="04">What I can do</SectionLabel><div className="grid border-t border-foreground/15 md:grid-cols-3">{data.services.map((service) => <article key={service.id} className="group border-b border-foreground/15 py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0" data-testid={`service-${service.id}`}><span className="font-mono text-[11px] text-accent">{service.number}</span><h3 className="mt-16 max-w-xs text-2xl font-medium leading-tight">{service.title}</h3><p className="mt-5 max-w-xs text-sm leading-[1.7] text-muted-foreground">{service.description}</p><div className="mt-10 h-8 w-8 border border-foreground/25 p-2 transition-all group-hover:border-primary group-hover:bg-primary"><ArrowUpRight className="h-3.5 w-3.5" /></div></article>)}</div></section>;
}

function Work({ data }: { data: PortfolioData }) {
  return <section id="work" className="border-t border-foreground/15 bg-[#dfe4d4] px-5 py-24 text-[#10151b] md:px-10 md:py-32"><div className="mx-auto max-w-[1440px]"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><SectionLabel number="05">Selected work</SectionLabel><span className="font-mono text-[10px] uppercase tracking-[.15em] text-[#10151b]/55">A small selection / 2022—2024</span></div><div className="space-y-5">{data.projects.map((project, index) => <article key={project.id} className="group grid gap-7 border-t border-[#10151b]/20 py-8 md:grid-cols-[80px_1fr_1fr_100px] md:items-center" data-testid={`project-${project.id}`}><span className="font-mono text-[11px] text-[#10151b]/50">0{index + 1}</span><div><h3 className="max-w-xl text-[clamp(2rem,4vw,4.3rem)] font-medium leading-[.9] tracking-[-.065em]">{project.title}</h3><p className="mt-4 font-mono text-[10px] uppercase tracking-[.15em] text-[#10151b]/55">{project.category}</p></div><div className="relative hidden h-28 overflow-hidden bg-[#10151b]/10 md:block"><div className={`absolute inset-0 transition-transform duration-500 group-hover:scale-105 ${project.accent === 'lime' ? 'bg-[#cfff32]' : project.accent === 'coral' ? 'bg-[#ed7059]' : 'bg-[#8bcfc8]'}`}><div className="absolute -right-4 -top-10 h-40 w-40 rounded-full border-[18px] border-[#10151b]/15" /><div className="absolute bottom-4 left-5 font-mono text-[10px] uppercase">{project.tags}</div></div></div><div className="flex items-center justify-between md:justify-end"><span className="font-mono text-[11px] text-[#10151b]/50">{project.year}</span><ArrowUpRight className="ml-8 h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></div><p className="col-start-2 max-w-sm text-sm leading-[1.6] text-[#10151b]/65 md:col-start-3">{project.description}</p></article>)}</div></div></section>;
}

function Testimonials({ data }: { data: PortfolioData }) {
  const item = data.testimonials[0];
  return <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-36"><SectionLabel number="06">Good words, kept</SectionLabel><div className="grid gap-10 md:grid-cols-[1.3fr_.7fr]"><div className="border-l-4 border-primary pl-6 md:pl-10"><p className="max-w-4xl text-[clamp(2rem,4vw,4.5rem)] font-medium leading-[.98] tracking-[-.055em]">“{item?.quote || 'The best work makes the difficult feel possible.'}”</p><p className="mt-8 font-mono text-[11px] uppercase tracking-[.14em] text-muted-foreground">{item?.name} <span className="mx-2 text-accent">/</span> {item?.role}</p></div><div className="self-end border-t border-foreground/15 pt-6"><p className="text-sm leading-[1.7] text-muted-foreground">The brief is never the whole story. I make room for the unexpected bit that makes the result feel alive.</p></div></div></section>;
}

function Contact() {
  return <section id="contact" className="bg-accent px-5 py-24 text-foreground md:px-10 md:py-32"><div className="mx-auto max-w-[1440px]"><SectionLabel number="07">Your turn</SectionLabel><div className="grid gap-12 md:grid-cols-[1.4fr_.6fr]"><div><h2 className="display-title max-w-5xl text-[clamp(4rem,11vw,10rem)] font-semibold leading-[.78] tracking-[-.08em]">Have a<br />good one?</h2><a href="mailto:hello@akhilesh.dev" className="group mt-12 inline-flex items-center gap-4 border-b-2 border-foreground pb-3 font-mono text-sm uppercase tracking-[.12em]" data-testid="link-email">hello@akhilesh.dev <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></a></div><div className="flex flex-col justify-end gap-5 font-mono text-[11px] uppercase tracking-[.14em]"><a href="https://github.com" className="flex items-center gap-3 transition-opacity hover:opacity-60" data-testid="link-github"><FaGithub size={15} /> github / akhilesh-v</a><a href="mailto:hello@akhilesh.dev" className="flex items-center gap-3 transition-opacity hover:opacity-60" data-testid="link-contact-mail"><Mail size={15} /> say hello</a><span className="flex items-center gap-3"><MapPin size={15} /> Mumbai / IST</span></div></div></div></section>;
}

function Footer() {
  return <footer className="bg-foreground px-5 py-8 text-background md:px-10"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 font-mono text-[10px] uppercase tracking-[.15em] text-background/50 sm:flex-row"><span>© {new Date().getFullYear()} Akhilesh Vishwakarma</span><span className="terminal-caret">Made with curiosity & care</span><a href="#top" className="text-primary hover:text-background" data-testid="link-back-top">Back to top ↑</a></div></footer>;
}

function PublicPortfolio() {
  const { data } = usePortfolioQuery();
  return <div id="top" className="grain min-h-[100dvh] bg-background"><Nav /><main><Hero /><About /><Stats /><Marquee /><Timeline data={data} /><ExperienceSection data={data} /><Services data={data} /><Work data={data} /><Testimonials data={data} /><Contact /></main><Footer /></div>;
}

// ---------------------------------------------------------------------
// /console — login gate + admin dashboard. Nothing here is linked from
// the public site; the URL itself is the only way in, and every write
// still requires a valid server-checked session.
// ---------------------------------------------------------------------

function LoginPage() {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error || 'Login failed.');
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="grain flex min-h-[100dvh] items-center justify-center bg-background px-5"><div className="w-full max-w-sm"><div className="mb-8 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center bg-foreground text-background"><Lock size={16} /></span><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">Restricted</p><h1 className="text-xl font-medium">Console access</h1></div></div><form onSubmit={handleSubmit} className="border border-foreground/20 bg-background p-6" data-testid="form-login"><label className="mb-4 block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">Username</span><input required autoFocus value={username} onChange={(event) => setUsername(event.target.value)} className="w-full border border-foreground/20 bg-card px-3 py-3 text-sm outline-none focus:border-primary" data-testid="input-username" /></label><label className="mb-6 block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">Password</span><input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border border-foreground/20 bg-card px-3 py-3 text-sm outline-none focus:border-primary" data-testid="input-password" /></label>{error && <p className="mb-5 font-mono text-[11px] text-destructive" data-testid="text-login-error">{error}</p>}<button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 bg-foreground px-4 py-3 font-mono text-[10px] uppercase tracking-[.14em] text-background transition-opacity hover:bg-primary hover:text-primary-foreground disabled:opacity-50" data-testid="button-login">{submitting ? 'Checking…' : 'Log in'}</button></form></div></div>;
}

type Resource = keyof PortfolioData;
const resourceMeta: Record<Resource, { label: string; singular: string }> = { services: { label: 'Services', singular: 'service' }, projects: { label: 'Projects', singular: 'project' }, education: { label: 'Education', singular: 'education' }, experience: { label: 'Experience', singular: 'role' }, testimonials: { label: 'Testimonials', singular: 'testimonial' } };
const emptyFor = (resource: Resource): PortfolioData[Resource][number] => {
  const id = `${resource.slice(0, -1)}-${Date.now()}`;
  if (resource === 'services') return { id, number: '0X', title: '', description: '' } as Service;
  if (resource === 'projects') return { id, title: '', category: '', year: String(new Date().getFullYear()), description: '', tags: '', accent: 'lime' } as Project;
  if (resource === 'education') return { id, degree: '', institution: '', period: '', detail: '' } as Education;
  if (resource === 'experience') return { id, role: '', company: '', period: '', detail: '' } as Experience;
  return { id, quote: '', name: '', role: '' } as Testimonial;
};
const itemTitle = (item: Service | Project | Education | Experience | Testimonial): string => {
  if ('title' in item) return item.title || 'Untitled';
  if ('degree' in item) return item.degree || 'Untitled';
  if ('role' in item && 'company' in item) return item.role || 'Untitled';
  if ('name' in item) return item.name || 'Untitled';
  return 'Untitled';
};
const itemSubtitle = (item: Service | Project | Education | Experience | Testimonial): string => {
  if ('description' in item) return String(item.description);
  if ('institution' in item) return String(item.institution);
  if ('company' in item) return String(item.company);
  if ('detail' in item) return String(item.detail);
  if ('quote' in item) return String(item.quote);
  return '';
};

function AdminForm({ resource, value, onSave, onCancel }: { resource: Resource; value: PortfolioData[Resource][number]; onSave: (value: PortfolioData[Resource][number]) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Record<string, string>>(() => ({ ...value } as unknown as Record<string, string>));
  const fields: Record<Resource, string[]> = { services: ['number', 'title', 'description'], projects: ['title', 'category', 'year', 'description', 'tags', 'accent'], education: ['degree', 'institution', 'period', 'detail'], experience: ['role', 'company', 'period', 'detail'], testimonials: ['quote', 'name', 'role'] };
  const labels: Record<string, string> = { number: 'Index', title: 'Title', description: 'Description', category: 'Category', year: 'Year', tags: 'Tags', accent: 'Color treatment', degree: 'Degree', institution: 'Institution', period: 'Period', detail: 'Detail', role: 'Role', company: 'Company', quote: 'Quote', name: 'Name' };
  return <form onSubmit={(event) => { event.preventDefault(); onSave({ ...value, ...form } as PortfolioData[Resource][number]); }} className="mt-5 border border-foreground/20 bg-background p-5 md:p-7" data-testid={`form-${resource}`}><div className="grid gap-5 md:grid-cols-2">{fields[resource].map((field) => <label key={field} className={field === 'description' || field === 'detail' || field === 'quote' ? 'md:col-span-2' : ''}><span className="mb-2 block font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">{labels[field]}</span>{field === 'accent' ? <select value={form[field] || ''} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="w-full border border-foreground/20 bg-card px-3 py-3 text-sm outline-none focus:border-primary"><option value="lime">Lime</option><option value="coral">Coral</option><option value="blue">Blue</option></select> : field === 'description' || field === 'detail' || field === 'quote' ? <textarea required value={form[field] || ''} onChange={(event) => setForm({ ...form, [field]: event.target.value })} rows={4} className="w-full resize-y border border-foreground/20 bg-card px-3 py-3 text-sm outline-none focus:border-primary" data-testid={`input-${field}`} /> : <input required value={form[field] || ''} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="w-full border border-foreground/20 bg-card px-3 py-3 text-sm outline-none focus:border-primary" data-testid={`input-${field}`} />}</label>)}</div><div className="mt-7 flex gap-3"><button type="submit" className="inline-flex items-center gap-2 bg-foreground px-4 py-3 font-mono text-[10px] uppercase tracking-[.14em] text-background hover:bg-primary hover:text-primary-foreground" data-testid="button-save-item"><Save size={14} /> Save {resourceMeta[resource].singular}</button><button type="button" onClick={onCancel} className="border border-foreground/25 px-4 py-3 font-mono text-[10px] uppercase tracking-[.14em] hover:bg-muted" data-testid="button-cancel-item">Cancel</button></div></form>;
}

function AdminArea({ data, username }: { data: PortfolioData; username?: string }) {
  const [resource, setResource] = useState<Resource>('services');
  const [editing, setEditing] = useState<PortfolioData[Resource][number] | null>(null);
  const [saved, setSaved] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const saveMutation = useSavePortfolioMutation();
  const items = data[resource];

  const persist = (next: PortfolioData) => {
    saveMutation.mutate(next, {
      onSuccess: () => {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1800);
      },
    });
  };

  const saveItem = (value: PortfolioData[Resource][number]) => {
    const next = items.some((item) => item.id === value.id) ? items.map((item) => (item.id === value.id ? value : item)) : [...items, value];
    persist({ ...data, [resource]: next });
    setEditing(null);
  };
  const deleteItem = (id: string) => {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    persist({ ...data, [resource]: items.filter((item) => item.id !== id) });
  };
  const resetAll = () => {
    if (!window.confirm('Reset all content to the original portfolio?')) return;
    persist(defaultPortfolioData);
  };
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
  };

  return <div className="grain min-h-[100dvh] bg-background"><header className="border-b border-foreground/15 bg-foreground text-background"><div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 md:px-10"><div className="flex items-center gap-3" data-testid="link-admin-home"><span className="flex h-8 w-8 items-center justify-center bg-primary font-mono text-sm font-bold text-primary-foreground">AV</span><span className="font-mono text-[11px] uppercase tracking-[.2em]">Content / console{username ? ` · ${username}` : ''}</span></div><div className="flex items-center gap-5"><button type="button" onClick={() => setLocation('/')} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.15em] text-background/60 hover:text-primary" data-testid="button-view-site">View live site <ExternalLink size={14} /></button><button type="button" onClick={logout} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.15em] text-background/60 hover:text-destructive" data-testid="button-logout">Log out <LogOut size={14} /></button></div></div></header><main className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16"><div className="flex flex-col justify-between gap-8 border-b border-foreground/15 pb-10 md:flex-row md:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">Signed in / changes save to the database</p><h1 className="display-title mt-5 text-6xl font-semibold leading-[.85] tracking-[-.07em] md:text-8xl">Shape the<br /><span className="text-accent">story.</span></h1></div><div className="max-w-xs text-sm leading-[1.7] text-muted-foreground"><p>Edits save straight to the live database and appear on the public site immediately.</p>{saveMutation.isPending && <p className="mt-3 font-mono text-[10px] uppercase text-muted-foreground">Saving…</p>}{saved && <p className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase text-green-700"><Check size={13} /> Saved</p>}{saveMutation.isError && <p className="mt-3 font-mono text-[10px] uppercase text-destructive">{(saveMutation.error as Error)?.message || 'Save failed'}</p>}</div></div><div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]"><aside className="lg:border-r lg:border-foreground/15 lg:pr-6"><div className="flex gap-2 overflow-auto lg:block lg:space-y-1">{(Object.keys(resourceMeta) as Resource[]).map((key) => <button type="button" key={key} onClick={() => { setResource(key); setEditing(null); }} className={`flex w-full shrink-0 items-center justify-between px-3 py-3 text-left font-mono text-[11px] uppercase tracking-[.13em] ${resource === key ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`} data-testid={`button-tab-${key}`}><span>{resourceMeta[key].label}</span><span className={resource === key ? 'text-primary' : ''}>{data[key].length.toString().padStart(2, '0')}</span></button>)}</div><button type="button" onClick={resetAll} className="mt-10 flex w-full items-center gap-2 border-t border-foreground/15 px-3 py-4 font-mono text-[10px] uppercase tracking-[.13em] text-muted-foreground hover:text-destructive" data-testid="button-reset-content"><RotateCcw size={13} /> Reset all content</button></aside><section><div className="mb-6 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">Editing collection</p><h2 className="mt-2 text-2xl font-medium">{resourceMeta[resource].label}</h2></div><button type="button" onClick={() => setEditing(emptyFor(resource))} className="inline-flex items-center gap-2 bg-primary px-4 py-3 font-mono text-[10px] uppercase tracking-[.13em] text-primary-foreground hover:bg-foreground hover:text-background" data-testid="button-add-item"><Plus size={15} /> Add {resourceMeta[resource].singular}</button></div>{editing && <AdminForm resource={resource} value={editing} onSave={saveItem} onCancel={() => setEditing(null)} />}<div className="space-y-3">{items.map((item, index) => <div key={item.id} className="group grid gap-4 border-t border-foreground/15 py-5 md:grid-cols-[48px_1fr_auto] md:items-center" data-testid={`admin-row-${item.id}`}><span className="font-mono text-[10px] text-accent">{String(index + 1).padStart(2, '0')}</span><div><h3 className="font-medium">{itemTitle(item)}</h3><p className="mt-1 line-clamp-2 max-w-2xl text-sm text-muted-foreground">{itemSubtitle(item)}</p></div><div className="flex gap-2 md:opacity-0 md:transition-opacity md:group-hover:opacity-100"><button type="button" onClick={() => setEditing(item)} className="border border-foreground/20 p-2 hover:border-primary hover:bg-primary" aria-label={`Edit item ${index + 1}`} data-testid={`button-edit-${item.id}`}><Pencil size={14} /></button><button type="button" onClick={() => deleteItem(item.id)} className="border border-foreground/20 p-2 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground" aria-label={`Delete item ${index + 1}`} data-testid={`button-delete-${item.id}`}><Trash2 size={14} /></button></div></div>)}</div></section></div></main></div>;
}

function ConsolePage() {
  const auth = useAuthQuery();
  const portfolio = usePortfolioQuery();

  if (auth.isLoading) {
    return <div className="flex min-h-[100dvh] items-center justify-center bg-background"><p className="font-mono text-[11px] uppercase tracking-[.15em] text-muted-foreground">Checking session…</p></div>;
  }
  if (!auth.data?.authenticated) {
    return <LoginPage />;
  }
  return <AdminArea data={portfolio.data} username={auth.data.username} />;
}

function RouterContent() {
  return <Switch><Route path="/console"><ConsolePage /></Route><Route path="/"><PublicPortfolio /></Route><Route component={NotFound} /></Switch>;
}

const queryClient = new QueryClient();
function App() {
  return <ErrorBoundary><QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RouterContent /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider></ErrorBoundary>;
}

export default App;
