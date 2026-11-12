import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { getContactSettings } from "@/lib/api-server/db";

export const dynamic = "force-dynamic";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getContactSettings();
    const siteName = settings.siteName || "Akhilesh Vishwakarma";
    const description =
      settings.siteDescription ||
      "Akhilesh Vishwakarma is a full-stack developer, UI engineer, and digital craftsman building fast, scalable web products with React, Next.js, and modern design systems.";
    const keywords =
      settings.siteKeywords
        ?.split(",")
        .map((value) => value.trim())
        .filter(Boolean) || [
        "Akhilesh Vishwakarma",
        "full stack developer",
        "React developer",
        "Next.js developer",
        "UI engineer",
        "web developer",
        "portfolio website",
      ];
    const siteUrl =
      settings.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://www.developerakhil.site/";
    const ogImage = settings.openGraphImage || "/og-image.svg";
    const faviconUrl = settings.faviconUrl || "/favicon.svg";
    const canonicalUrl = siteUrl.replace(/\/$/, "");
    const ogImageUrl = new URL(ogImage, canonicalUrl).toString();
    const verification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

    return {
      metadataBase: new URL(canonicalUrl),
      title: `${siteName} | Full-Stack Developer & UI Engineer`,
      description,
      keywords,
      applicationName: siteName,
      authors: [{ name: siteName }, { name: "Akhilesh Vishwakarma" }],
      creator: siteName,
      publisher: siteName,
      alternates: { canonical: canonicalUrl },
      verification: verification ? { google: verification } : undefined,
      icons: {
        icon: [
          { url: faviconUrl, type: "image/svg+xml" },
          { url: "/favicon.svg", type: "image/svg+xml" },
        ],
        shortcut: "/favicon.svg",
        apple: "/favicon.svg",
      },
      manifest: "/site.webmanifest",
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      },
      openGraph: {
        title: `${siteName} | Full-Stack Developer & UI Engineer`,
        description,
        siteName,
        type: "website",
        url: canonicalUrl,
        locale: "en_US",
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: siteName }],
      },
      twitter: {
        card: "summary_large_image",
        site: "@akhilesh",
        creator: "@akhilesh",
        title: `${siteName} | Full-Stack Developer & UI Engineer`,
        description,
        images: [ogImageUrl],
      },
      other: {
        ...Object.fromEntries(
          (settings.customMetaTags || []).map(({ name, content }) => [
            name,
            content,
          ]),
        ),
        "application-name": siteName,
        "theme-color": "#0f172a",
        "color-scheme": "dark light",
        keywords: keywords.join(", "),
      },
    };
  } catch {
    const defaultTitle = "Akhilesh Vishwakarma | Full-Stack Developer & UI Engineer";
    const defaultDescription =
      "Akhilesh Vishwakarma is a full-stack developer, UI engineer, and digital craftsman building fast, scalable web products with React, Next.js, and modern design systems.";
    const fallbackUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.developerakhil.site/";
    const fallbackOgImage = new URL("/og-image.svg", fallbackUrl).toString();
    const verification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

    return {
      metadataBase: new URL(fallbackUrl),
      title: defaultTitle,
      description: defaultDescription,
      keywords: [
        "Akhilesh Vishwakarma",
        "full stack developer",
        "React developer",
        "Next.js developer",
        "web developer",
        "portfolio website",
        "frontend developer",
        "backend developer",
      ],
      applicationName: "Akhilesh Vishwakarma",
      authors: [{ name: "Akhilesh Vishwakarma" }],
      creator: "Akhilesh Vishwakarma",
      publisher: "Akhilesh Vishwakarma",
      alternates: { canonical: fallbackUrl },
      verification: verification ? { google: verification } : undefined,
      icons: {
        icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
        shortcut: "/favicon.svg",
        apple: "/favicon.svg",
      },
      manifest: "/site.webmanifest",
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      },
      openGraph: {
        title: defaultTitle,
        description: defaultDescription,
        siteName: "Akhilesh Vishwakarma",
        type: "website",
        url: fallbackUrl,
        locale: "en_US",
        images: [{ url: fallbackOgImage, width: 1200, height: 630, alt: "Akhilesh Vishwakarma" }],
      },
      twitter: {
        card: "summary_large_image",
        site: "@akhilesh",
        creator: "@akhilesh",
        title: defaultTitle,
        description: defaultDescription,
        images: [fallbackOgImage],
      },
      other: {
        "application-name": "Akhilesh Vishwakarma",
        "theme-color": "#0f172a",
        "color-scheme": "dark light",
        keywords: "Akhilesh Vishwakarma, full stack developer, React developer, Next.js developer",
      },
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getContactSettings().catch(() => null);
  const siteName = settings?.siteName || "Akhilesh Vishwakarma";
  const description =
    settings?.siteDescription ||
    "Akhilesh Vishwakarma is a full-stack developer, UI engineer, and digital craftsman building fast, scalable web products with React, Next.js, and modern design systems.";
  const siteUrl =
    settings?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://www.developerakhil.site/";
  const ogImage = settings?.openGraphImage || "/og-image.svg";
  const ogImageUrl = new URL(ogImage, siteUrl).toString();
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: siteName,
      jobTitle: "Full-Stack Developer & UI Engineer",
      description,
      knowsAbout: [
        "Full-Stack Development",
        "React",
        "Next.js",
        "UI Engineering",
        "Web Design",
        "Frontend Architecture",
        "Backend Development",
      ],
      sameAs: [],
      url: siteUrl,
      image: ogImageUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: siteUrl,
      description,
      inLanguage: "en-US",
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
