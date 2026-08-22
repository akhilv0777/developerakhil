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
export type Profile = {
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

export type PortfolioData = {
  profile: Profile;
  stats: Stat[];
  services: Service[];
  projects: Project[];
  education: Education[];
  experience: Experience[];
  testimonials: Testimonial[];
};
