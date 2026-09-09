// ---------------------------------------------------------------------
// Shared data shapes for the portfolio site (public frontend + admin console).
// ---------------------------------------------------------------------

export type Service = {
  id: string;
  title: string;
  description: string;
  number: string;
};

export type Project = {
  id: string;
  title: string;
  category: string;
  year: string;
  description: string;
  tags: string;
  accent: string;
  image?: string;
  liveUrl?: string;
};

export type Education = {
  id: string;
  degree: string;
  institution: string;
  period: string;
  detail: string;
};

export type Experience = {
  id: string;
  role: string;
  company: string;
  period: string;
  detail: string;
};

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
};

export type Stat = { id: string; value: string; label: string };

export type SocialLinkLocation = "nav" | "contact" | "footer";

export type SocialLink = {
  id: string;
  label: string;
  url: string;
  icon?: string;
  iconImage?: string;
  locations?: SocialLinkLocation[];
};

export type HeroImageSettings = {
  preset: string;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  opacity: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
  backgroundRemoved?: boolean;
  backupUrl?: string;
  overlayColor: string;
  overlayOpacity: number;
};

export type Profile = {
  name: string;
  tagline: string;
  roles?: string[];
  whatsapp?: string;
  location: string;
  bio1: string;
  bio2: string;
  bio3: string;
  email: string;
  phone: string;
  github: string;
  linkedin: string;
  socialLinks?: SocialLink[];
  image: string;
  heroImage?: string;
  heroMobileImage?: string;
  heroDesktopSettings?: HeroImageSettings;
  heroMobileSettings?: HeroImageSettings;
  aboutImage?: string;
  resume: string;
  resumeName: string;
  contactTitle: string;
  contactNote: string;
  skills: string[];
  languages: string[];
};

export type SectionVisibility = {
  hero: boolean;
  about: boolean;
  stats: boolean;
  skills: boolean;
  marquee: boolean;
  education: boolean;
  experience: boolean;
  services: boolean;
  projects: boolean;
  testimonials: boolean;
  contact: boolean;
};

export type ThemeSettings = {
  accentColor: string;
  mode: "dark" | "light" | "auto";
};

export type PortfolioData = {
  profile: Profile;
  stats: Stat[];
  services: Service[];
  projects: Project[];
  education: Education[];
  experience: Experience[];
  testimonials: Testimonial[];
  sectionVisibility: SectionVisibility;
  themeSettings: ThemeSettings;
};
