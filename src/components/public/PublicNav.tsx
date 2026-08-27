"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Menu,
  Minus,
  Moon,
  Plus,
  Sun,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { PortfolioData } from "@/lib/portfolio-types";

export function PublicNav({
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
  if (data.sectionVisibility?.skills ?? true) profileLinks.push(["skills", "Skills"]);
  if (data.sectionVisibility?.education) profileLinks.push(["education", "Education"]);
  if (data.sectionVisibility?.experience) profileLinks.push(["experience", "Experience"]);
  const workLinks: Array<[string, string]> = [];
  if (data.sectionVisibility?.services) workLinks.push(["services", "Services"]);
  if (data.sectionVisibility?.projects) workLinks.push(["work", "Projects"]);
  if (data.sectionVisibility?.testimonials) workLinks.push(["testimonials", "Testimonials"]);
  const groups: Array<{ label: string; items: Array<[string, string]> }> = [
    { label: "Profile", items: profileLinks },
    { label: "Work", items: workLinks },
    ...(data.sectionVisibility?.contact
      ? [{ label: "Hire me", items: [["contact", "Hire me"] as [string, string]] }]
      : []),
  ];
  const links = groups.flatMap((group) => group.items);
  const initials = profile.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "AV";

  useEffect(() => {
    const updateActiveHash = () => {
      const nextHash = window.location.hash.replace("#", "");
      setActiveHash(nextHash || "about");
    };
    updateActiveHash();
    window.addEventListener("hashchange", updateActiveHash);
    const sections = links.map(([href]) => document.getElementById(href)).filter(Boolean) as HTMLElement[];
    if (!sections.length) return () => window.removeEventListener("hashchange", updateActiveHash);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) {
        setActiveHash(visible.target.id);
        if (typeof window.history?.replaceState === "function") {
          const nextHash = `#${visible.target.id}`;
          if (window.location.hash !== nextHash) window.history.replaceState(null, "", nextHash);
        }
      }
    }, { threshold: [0.2, 0.5, 0.8], rootMargin: "-15% 0px -35% 0px" });
    sections.forEach((section) => observer.observe(section));
    return () => {
      window.removeEventListener("hashchange", updateActiveHash);
      observer.disconnect();
    };
  }, [links]);

  return (
    <header className="glass-nav fixed top-4 left-1/2 z-50 w-[95%] max-w-[1000px] -translate-x-1/2 rounded-full border px-6 py-4 backdrop-blur-md transition-all">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group" data-testid="link-home">
          {profile.heroImage || profile.image ? (
            <Image src={profile.heroImage || profile.image} alt={profile.name} className="h-9 w-9 rounded-full object-cover transition-transform group-hover:scale-110" width={36} height={36} />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-mono text-sm font-bold text-background transition-transform group-hover:scale-110">{initials}</span>
          )}
          <span className="font-mono text-[12px] font-semibold uppercase tracking-wider text-foreground">{profile.name}</span>
        </Link>
        <nav className={`${open ? "absolute left-0 top-[70px] flex w-full flex-col items-center gap-4 rounded-3xl border border-border bg-background p-6 shadow-xl" : "hidden"} lg:static lg:flex lg:max-w-[62vw] lg:flex-row lg:items-center lg:gap-6 lg:overflow-visible lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}>
          {groups.map((group) => {
            const isSingle = group.items.length === 1 && group.label === "Hire me";
            const groupActive = group.items.some(([href]) => activeHash === href);
            if (isSingle) {
              const [href, label] = group.items[0];
              return <a key={href} href={`#${href}`} onClick={() => setOpen(false)} className={`shrink-0 font-mono text-[11px] font-medium uppercase tracking-[.15em] transition-colors ${groupActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`} data-testid={`link-nav-${href}`} aria-current={groupActive ? "page" : undefined}>{label}</a>;
            }
            return <div key={group.label} className="group relative w-full shrink-0 lg:w-auto">
              <button type="button" onClick={() => setOpenGroup((current) => current === group.label ? null : group.label)} className={`flex w-full cursor-pointer items-center justify-between gap-1 border-b border-border py-3 font-mono text-[11px] font-medium uppercase tracking-[.15em] transition-colors lg:w-auto lg:border-0 lg:py-0 ${groupActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`} aria-expanded={openGroup === group.label}>
                {group.label}<span className="lg:hidden" aria-hidden="true">{openGroup === group.label ? <Minus size={15} /> : <Plus size={15} />}</span><ChevronDown size={13} className={`hidden transition-transform lg:block ${openGroup === group.label ? "rotate-180" : ""}`} />
              </button>
              <div className={`${openGroup === group.label ? "flex" : "hidden"} relative mt-3 min-w-44 flex-col gap-3 rounded-xl border border-border bg-background p-3 shadow-xl lg:absolute lg:left-1/2 lg:top-full lg:mt-2 lg:hidden lg:-translate-x-1/2 lg:border lg:bg-background lg:p-3 lg:pl-3 lg:shadow-xl lg:before:absolute lg:before:-top-2 lg:before:left-0 lg:before:right-0 lg:before:h-2 lg:before:content-[''] lg:group-hover:flex`}>
                <span className="absolute -top-3 left-1/2 hidden -translate-x-1/2 text-muted-foreground lg:flex" aria-hidden="true"><ChevronUp size={12} strokeWidth={2.5} /></span>
                {group.items.map(([href, label]) => {
                  const isActive = activeHash === href || (!activeHash && href === "about");
                  return <a key={href} href={`#${href}`} onClick={() => { setOpen(false); setOpenGroup(null); }} className={`font-mono text-[10px] font-medium uppercase tracking-[.15em] transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`} data-testid={`link-nav-${href}`} aria-current={isActive ? "page" : undefined}>{label}</a>;
                })}
              </div>
            </div>;
          })}
        </nav>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onToggleTheme} className="rounded-full border border-border bg-secondary p-2 text-foreground transition-colors hover:border-primary hover:text-primary" aria-label={`Switch to ${isLight ? "dark" : "light"} theme`} data-testid="button-toggle-theme">{isLight ? <Moon size={16} /> : <Sun size={16} />}</button>
          <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-full bg-secondary p-2 text-foreground lg:hidden hover:text-primary" aria-label="Toggle navigation" data-testid="button-toggle-nav">{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
    </header>
  );
}
