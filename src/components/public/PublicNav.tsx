"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  ChevronDown,
  Menu,
  Minus,
  Moon,
  Plus,
  Sun,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { DEFAULT_PROFILE_IMAGE } from "@/lib/portfolio-types";
import type { PortfolioData } from "@/lib/portfolio-types";
import { SocialIcon } from "./SocialIcon";
import { SiteTranslator } from "./SiteTranslator";

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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [activeHash, setActiveHash] = useState("");
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const profileLinks: Array<[string, string]> = [];
  if (data.sectionVisibility?.about) profileLinks.push(["about", "About"]);
  if (
    data.sectionVisibility?.about &&
    (data.sectionVisibility?.skills ?? true) &&
    (profile.skills?.length > 0 || profile.languages?.length > 0)
  ) {
    profileLinks.push(["skills", "Skills"]);
  }
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
  ].filter((group) => group.items.length > 0);
  const links = groups.flatMap((group) => group.items);
  const sectionIds = links.map(([href]) => href).join(",");

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isAtTop = currentScrollY < 32;
      const scrollingUp = currentScrollY < lastScrollY.current;

      setIsNavVisible(isAtTop || scrollingUp);
      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      setOpenGroup(null);
      menuButtonRef.current?.focus();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleSectionClick = (
    event: ReactMouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    event.preventDefault();
    setOpen(false);
    setOpenGroup(null);
    setActiveHash(href);
    document
      .getElementById(href)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
  };

  useEffect(() => {
    const updateActiveHash = () => {
      const nextHash = window.location.hash.replace("#", "");
      if (!nextHash) return;
      setActiveHash(nextHash);
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    };
    updateActiveHash();
    window.addEventListener("hashchange", updateActiveHash);
    const sections = sectionIds
      .split(",")
      .filter(Boolean)
      .map((href) => document.getElementById(href))
      .filter((section): section is HTMLElement => section !== null);
    if (!sections.length) {
      return () => window.removeEventListener("hashchange", updateActiveHash);
    }
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveHash(visible.target.id);
    }, { threshold: [0.2, 0.5, 0.8], rootMargin: "-15% 0px -35% 0px" });
    sections.forEach((section) => observer.observe(section));
    return () => {
      window.removeEventListener("hashchange", updateActiveHash);
      observer.disconnect();
    };
  }, [sectionIds]);

  return (
    <header className={`glass-nav fixed top-3 z-50 w-[calc(100%-2rem)] max-w-5xl border px-4 py-3 backdrop-blur-md transition-all duration-300 sm:top-5 sm:px-6 sm:py-4 ${isNavVisible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-[calc(100%+1rem)] opacity-0"}`}>
      <div className="flex items-center justify-between">
        <Link href="/" className="group flex min-w-0 flex-1 items-center gap-3" data-testid="link-home">
          <Image
            src={profile.image || DEFAULT_PROFILE_IMAGE}
            alt={profile.name}
            className="h-9 w-9 rounded-full object-cover transition-transform group-hover:scale-110"
            width={36}
            height={36}
          />
          <span className="flex min-w-0 flex-col items-start leading-none">
            <span className="break-words font-mono text-[12px] font-semibold uppercase tracking-wider text-foreground">
              {profile.name}
            </span>
            <span className="mt-1 max-w-[38vw] truncate text-[9px] font-medium tracking-wide text-muted-foreground sm:max-w-none">
              {profile.roles?.find(Boolean) || profile.tagline || "Software Developer"}
            </span>
          </span>
        </Link>
        <nav
          id="primary-navigation"
          aria-label="Primary navigation"
          className={`${open ? "absolute left-0 top-[70px] flex max-h-[calc(100dvh-6.5rem)] w-full flex-col items-center gap-4 overflow-y-auto overscroll-contain rounded-3xl border border-border bg-background p-6 shadow-xl" : "hidden"} lg:mr-4 lg:static lg:flex lg:max-h-none lg:max-w-[62vw] lg:flex-row lg:items-center lg:gap-6 lg:overflow-visible lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
        >
          {groups.map((group) => {
            const isSingle = group.items.length === 1 && group.label === "Hire me";
            const groupActive = group.items.some(([href]) => activeHash === href);
            if (isSingle) {
              const [href, label] = group.items[0];
              return <Link key={href} href="/" onClick={(event) => handleSectionClick(event, href)} className="available-for-btn shrink-0" data-testid={`link-nav-${href}`} aria-current={groupActive ? "page" : undefined}>
                <span>{label}</span>
              </Link>;
            }
            return <div key={group.label} className="group relative w-full shrink-0 lg:w-auto">
              <button type="button" onClick={() => setOpenGroup((current) => current === group.label ? null : group.label)} className={`flex w-full cursor-pointer items-center justify-between gap-1 border-b border-border py-3 font-mono text-[11px] font-medium uppercase tracking-[.15em] transition-colors lg:w-auto lg:border-0 lg:py-0 ${groupActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`} aria-expanded={openGroup === group.label}>
                {group.label}<span className="lg:hidden" aria-hidden="true">{openGroup === group.label ? <Minus size={15} /> : <Plus size={15} />}</span><ChevronDown size={13} className={`hidden transition-transform lg:block ${openGroup === group.label ? "rotate-180" : ""}`} />
              </button>
              <div className={`${openGroup === group.label ? "flex" : "hidden"} relative mt-3 min-w-48 flex-col gap-1 rounded-lg border border-border/80 bg-card/95 p-2 shadow-2xl backdrop-blur-xl lg:absolute lg:left-1/2 lg:top-full lg:mt-2 lg:hidden lg:-translate-x-1/2 lg:before:absolute lg:before:-top-2 lg:before:left-0 lg:before:right-0 lg:before:h-2 lg:before:content-[''] lg:group-hover:flex`}>
                {group.items.map(([href, label]) => {
                  const isActive = activeHash === href || (!activeHash && href === "about");
                  return <Link key={href} href="/" onClick={(event) => handleSectionClick(event, href)} className={`rounded-md border-l-2 px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[.15em] transition-colors ${isActive ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:border-primary/40 hover:bg-secondary hover:text-primary"}`} data-testid={`link-nav-${href}`} aria-current={isActive ? "page" : undefined}>{label}</Link>;
                })}
              </div>
            </div>;
          })}
        </nav>
        <div
          className="public-nav-controls flex items-center gap-2"
          dir="ltr"
        >
          <SiteTranslator />
          {profile.github && (
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              aria-label="Open GitHub profile"
              title="GitHub"
              className="hidden rounded-md border border-border bg-secondary p-2 text-foreground transition-colors hover:border-primary hover:text-primary sm:inline-flex"
            >
              <FaGithub size={15} />
            </a>
          )}
          {profile.linkedin && (
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label="Open LinkedIn profile"
              title="LinkedIn"
              className="hidden rounded-md border border-border bg-secondary p-2 text-foreground transition-colors hover:border-primary hover:text-primary sm:inline-flex"
            >
              <FaLinkedin size={15} />
            </a>
          )}
          {profile.socialLinks?.filter((link) => !link.locations || link.locations.includes("nav")).map((link) => (
            <a
              key={link.id}
              href={/^https?:\/\//i.test(link.url) ? link.url : `https://${link.url}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${link.label}`}
              title={link.label}
              className="hidden rounded-md border border-border bg-secondary p-2 text-foreground transition-colors hover:border-primary hover:text-primary sm:inline-flex"
            >
              <SocialIcon label={link.label} icon={link.icon} iconImage={link.iconImage} size={15} className="shrink-0 text-primary" />
            </a>
          ))}
          <button type="button" onClick={onToggleTheme} className="rounded-md border border-border bg-secondary p-2 text-foreground transition-colors hover:border-primary hover:text-primary" aria-label={`Switch to ${isLight ? "dark" : "light"} theme`} data-testid="button-toggle-theme">{isLight ? <Moon size={16} /> : <Sun size={16} />}</button>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-md bg-secondary p-2 text-foreground hover:text-primary lg:hidden"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="primary-navigation"
            data-testid="button-toggle-nav"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
