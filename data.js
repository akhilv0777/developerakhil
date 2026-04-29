/* =====================================================
 * Portfolio content
 * Edit this file to update services, projects, etc.
 * ===================================================== */

window.PORTFOLIO_DATA = {
  services: [
    {
      icon: "bi-code-slash",
      title: "Web Development",
      description:
        "Pixel-perfect, performant web apps built with React, Next.js and modern tooling.",
      tags: ["React", "Next.js", "TypeScript"],
    },
    {
      icon: "bi-palette",
      title: "UI / UX Design",
      description:
        "Thoughtful interfaces and design systems that scale with your product and team.",
      tags: ["Design Systems", "Figma", "Prototyping"],
    },
    {
      icon: "bi-phone",
      title: "Mobile Apps",
      description:
        "Cross-platform mobile experiences with React Native and Expo, backed by solid APIs.",
      tags: ["React Native", "Expo", "iOS / Android"],
    },
    {
      icon: "bi-rocket-takeoff",
      title: "Performance Audit",
      description:
        "Deep-dive performance audits with measurable wins on Core Web Vitals and conversion.",
      tags: ["Lighthouse", "CWV", "Optimisation"],
    },
    {
      icon: "bi-stack",
      title: "Architecture",
      description:
        "Pragmatic technical architecture for products that need to grow without breaking.",
      tags: ["Node.js", "PostgreSQL", "AWS"],
    },
    {
      icon: "bi-lightning-charge",
      title: "DevOps",
      description:
        "CI/CD pipelines, infra-as-code and observability so you ship without fear.",
      tags: ["Docker", "GitHub Actions", "Vercel"],
    },
  ],

  education: [
    {
      icon: "bi-mortarboard",
      year: "2013 — 2017",
      degree: "B.Tech in Computer Science",
      school: "Indian Institute of Technology",
      detail:
        "Specialised in distributed systems and human-computer interaction. Graduated with honours, GPA 8.7/10.",
      tags: ["Algorithms", "HCI", "Systems"],
    },
    {
      icon: "bi-book",
      year: "2018 — 2019",
      degree: "Full-Stack Web Development",
      school: "freeCodeCamp · Frontend Masters",
      detail:
        "Deep dives into modern JavaScript, React internals, accessibility and performance. 1,200+ hours of structured learning.",
      tags: ["React", "Node.js", "A11y"],
    },
    {
      icon: "bi-award",
      year: "2020 — 2021",
      degree: "Product Design Foundations",
      school: "Designlab · IDF",
      detail:
        "Visual design, typography, design systems and user research — bridging the gap between engineering and craft.",
      tags: ["UX Research", "Typography", "Systems"],
    },
  ],

  experience: [
    {
      year: "2022 — Now",
      role: "Senior Full-Stack Engineer",
      company: "Acme Corp",
      description:
        "Leading platform engineering. Established a design system that cut implementation time by 40%. Mentoring two engineers.",
    },
    {
      year: "2019 — 2022",
      role: "Product Engineer",
      company: "Studio Interface",
      description:
        "Built award-winning marketing sites and web apps for global brands at a boutique digital agency.",
    },
    {
      year: "2017 — 2019",
      role: "Frontend Developer",
      company: "TechFlow Startup",
      description:
        "Built interactive dashboards with React and D3.js. Discovered a love for the design–engineering border.",
    },
  ],

  toolkit: {
    Frontend: ["React", "Next.js", "TypeScript", "Tailwind", "Framer Motion"],
    Backend: ["Node.js", "PostgreSQL", "GraphQL", "Redis", "REST APIs"],
    "Tools & Cloud": ["Figma", "AWS", "Docker", "Vercel", "Git"],
  },

  projects: [
    {
      title: "Nexus Trading Platform",
      tag: "Fintech / 2024",
      description:
        "Reimagining institutional trading with a real-time data layer and a high-density UI that traders actually want to use. Cut decision latency by 38%.",
      image: "./projects/project-1.png",
      stack: ["React", "WebSockets", "D3"],
    },
    {
      title: "Aura Atelier",
      tag: "E-Commerce / 2023",
      description:
        "An editorial shopping experience for an independent fragrance brand. Atmospheric art direction, fluid transitions, and a checkout flow that lifted conversion 34%.",
      image: "./projects/project-2.png",
      stack: ["Next.js", "Shopify", "GSAP"],
    },
    {
      title: "Metrik Analytics",
      tag: "SaaS / 2023",
      description:
        "A self-serve analytics product for product teams. Built a fast, customisable dashboard layer and an event ingestion pipeline that scales.",
      image: "./projects/project-3.png",
      stack: ["TypeScript", "PostgreSQL", "Recharts"],
    },
    {
      title: "Halo Health",
      tag: "Healthtech / 2022",
      description:
        "Patient-first appointment scheduling for a network of clinics. Reduced no-shows by 22% with a smart reminders engine.",
      image: "./projects/project-4.png",
      stack: ["React Native", "Node.js", "Twilio"],
    },
    {
      title: "Forge Collective",
      tag: "Agency Site / 2024",
      description:
        "An award-winning marketing site for a creative collective. Editorial layouts, scroll-triggered animations and a custom CMS.",
      image: "./projects/project-1.png",
      stack: ["Next.js", "Framer Motion", "Sanity"],
    },
    {
      title: "Vertex Studio",
      tag: "Branding / 2023",
      description:
        "A bold, type-driven portfolio for a 3D motion studio. WebGL-powered hero, custom shader transitions, and a CMS-driven case study layer.",
      image: "./projects/project-2.png",
      stack: ["Three.js", "GLSL", "Next.js"],
    },
  ],

  testimonials: [
    {
      quote:
        "Akhilesh is the rare engineer who genuinely cares about both the code and the experience. Our launch was the smoothest in company history.",
      name: "Sarah Chen",
      role: "Head of Product, Nexus",
    },
    {
      quote:
        "We've worked with a lot of devs. Few combine taste, speed, and reliability the way Akhilesh does. He raised our entire bar.",
      name: "Marcus Reid",
      role: "Founder, Aura Atelier",
    },
    {
      quote:
        "Tireless, opinionated in the right ways, and a force-multiplier on any team. Hire him before someone else does.",
      name: "Priya Patel",
      role: "CTO, Metrik",
    },
    {
      quote:
        "From first sketch to final ship, the craft was visible at every step. Pixel-perfect, performant, and a joy to collaborate with.",
      name: "Daniel Okafor",
      role: "Design Lead, Studio Interface",
    },
  ],
  rotatorWords: ["Developer.", "Freelancer.", "Designer.", "Problem Solver.", "Coder."],
  contactEmail: "hello@akhilesh.dev",
};
