import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import {
  getContactSettings,
  getPublicPortfolioData,
} from "@/lib/api-server/db";

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

const defaultDescription =
  "Developer Akhil (Akhilesh Vishwakarma) is a PHP and WordPress developer in India, building React-powered Gutenberg blocks, Laravel apps, and modern websites.";
const previousDefaultDescription =
  "Akhilesh Vishwakarma is a full-stack developer and UI engineer building modern, scalable web experiences with React, Next.js, and custom product design.";
const defaultKeywords = [
  "Developer Akhil",
  "Akhil developer",
  "Akhilesh Vishwakarma",
  "WordPress developer India",
  "PHP developer India",
  "Gutenberg developer",
  "React developer",
  "Laravel developer",
  "web developer portfolio",
];
const normalizeOpenGraphImage = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return "/og-image.png";
  return trimmed.toLowerCase().endsWith(".svg")
    ? trimmed.replace(/\.svg$/i, ".png")
    : trimmed;
};
const getPageTitle = (siteName: string) =>
  `Developer Akhil | ${siteName} - WordPress & PHP Developer`;
const getSeoDescription = (configuredDescription?: string) => {
  const description = configuredDescription?.trim();
  return !description || description === previousDefaultDescription
    ? defaultDescription
    : description;
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getContactSettings();
    const siteName = settings.siteName || "Akhilesh Vishwakarma";
    const description = getSeoDescription(settings.siteDescription);
    const configuredKeywords =
      settings.siteKeywords
        ?.split(",")
        .map((value) => value.trim())
        .filter(Boolean) || [];
    const keywords =
      configuredKeywords.length > 0
        ? Array.from(new Set(configuredKeywords))
        : defaultKeywords;
    const siteUrl =
      settings.siteUrl ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://developerakhil.site/";
    const ogImage = normalizeOpenGraphImage(settings.openGraphImage);
    const faviconUrl = settings.faviconUrl || "/favicon.svg";
    const canonicalUrl = siteUrl.replace(/\/+$/, "");
    const ogImageUrl = new URL(ogImage, canonicalUrl).toString();
    const verification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
    const title = settings.seoTitle?.trim() || getPageTitle(siteName);
    const openGraphTitle = settings.openGraphTitle?.trim() || title;
    const openGraphDescription =
      settings.openGraphDescription?.trim() || description;
    const twitterHandle = settings.twitterHandle?.trim()
      ? settings.twitterHandle.trim().replace(/^@?/, "@")
      : undefined;
    const allowIndexing = settings.allowIndexing ?? true;

    return {
      metadataBase: new URL(canonicalUrl),
      title,
      description,
      keywords,
      applicationName: siteName,
      authors: [{ name: siteName }, { name: "Akhilesh Vishwakarma" }],
      creator: siteName,
      publisher: siteName,
      alternates: { canonical: canonicalUrl },
      verification: verification ? { google: verification } : undefined,
      icons: {
        icon: faviconUrl,
        shortcut: faviconUrl,
        apple: faviconUrl,
      },
      manifest: "/site.webmanifest",
      robots: {
        index: allowIndexing,
        follow: true,
        googleBot: {
          index: allowIndexing,
          follow: true,
        },
      },
      openGraph: {
        title: openGraphTitle,
        description: openGraphDescription,
        siteName,
        type: "website",
        url: canonicalUrl,
        locale: "en_US",
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: siteName }],
      },
      twitter: {
        card: "summary_large_image",
        site: twitterHandle,
        creator: twitterHandle,
        title: openGraphTitle,
        description: openGraphDescription,
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
      },
    };
  } catch {
    const siteName = "Akhilesh Vishwakarma";
    const defaultTitle = getPageTitle(siteName);
    const fallbackUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://developerakhil.site/";
    const fallbackOgImage = new URL(
      normalizeOpenGraphImage("/og-image.png"),
      fallbackUrl,
    ).toString();
    const verification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

    return {
      metadataBase: new URL(fallbackUrl.replace(/\/+$/, "")),
      title: defaultTitle,
      description: defaultDescription,
      keywords: defaultKeywords,
      applicationName: siteName,
      authors: [{ name: siteName }, { name: "Developer Akhil" }],
      creator: siteName,
      publisher: siteName,
      alternates: { canonical: fallbackUrl.replace(/\/+$/, "") },
      verification: verification ? { google: verification } : undefined,
      icons: {
        icon: "/favicon.svg",
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
        siteName,
        type: "website",
        url: fallbackUrl.replace(/\/+$/, ""),
        locale: "en_US",
        images: [{ url: fallbackOgImage, width: 1200, height: 630, alt: siteName }],
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
        "application-name": siteName,
        "theme-color": "#0f172a",
        "color-scheme": "dark light",
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
  const portfolio = await getPublicPortfolioData();
  const siteName = settings?.siteName || "Akhilesh Vishwakarma";
  const description = getSeoDescription(settings?.siteDescription);
  const siteTitle = settings?.seoTitle?.trim() || getPageTitle(siteName);
  const siteUrl =
    settings?.siteUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://developerakhil.site/";
  const canonicalUrl = siteUrl.replace(/\/+$/, "");
  const ogImage = normalizeOpenGraphImage(settings?.openGraphImage);
  const ogImageUrl = new URL(ogImage, canonicalUrl).toString();
  const profile = portfolio.profile;
  const absoluteProfileUrl = (value: string) =>
    /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const sameAs = [
    profile.github,
    profile.linkedin,
    ...(profile.socialLinks || []).map((link) => link.url),
  ]
    .filter(Boolean)
    .map(absoluteProfileUrl);
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: profile.name,
      alternateName: "Developer Akhil",
      jobTitle: profile.roles?.join(", ") || profile.tagline,
      description: profile.bio1 || description,
      knowsAbout: profile.skills,
      sameAs,
      url: canonicalUrl,
      image: ogImageUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteTitle,
      url: canonicalUrl,
      description,
      inLanguage: "en-IN",
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
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
