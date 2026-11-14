import type { Metadata } from "next";
import Link from "next/link";
import { getContactSettings, getPublicPortfolioData } from "@/lib/api-server/db";
import ProjectDetailClient from "./ProjectDetailClient";

const normalizeOpenGraphImage = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return "/og-image.png";
  return trimmed.toLowerCase().endsWith(".svg")
    ? trimmed.replace(/\.svg$/i, ".png")
    : trimmed;
};

type ProjectRouteParams = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProjectRouteParams): Promise<Metadata> {
  const { id } = await params;
  const [settings, portfolio] = await Promise.all([
    getContactSettings().catch(() => null),
    getPublicPortfolioData(),
  ]);
  const project = portfolio.projects.find((item) => item.id === id);
  const siteName = settings?.siteName || "Akhilesh Vishwakarma";
  const siteUrl =
    settings?.siteUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://developerakhil.site/";
  const canonicalUrl = siteUrl.replace(/\/+$/, "");
  const shareUrl = `${canonicalUrl}/projects/${encodeURIComponent(id)}`;
  const imageSource =
    project?.image ||
    normalizeOpenGraphImage(settings?.openGraphImage || "/og-image.png");
  const imageUrl = new URL(imageSource, canonicalUrl).toString();
  const title = project
    ? `${project.title} | ${siteName}`
    : `Project | ${siteName}`;
  const description =
    project?.description ||
    "Explore this case study and project details from the portfolio.";

  return {
    title,
    description,
    alternates: { canonical: shareUrl },
    openGraph: {
      title,
      description,
      siteName,
      type: "website",
      url: shareUrl,
      locale: "en_US",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: project?.title || siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: ProjectRouteParams) {
  const { id } = await params;
  const portfolio = await getPublicPortfolioData();
  const project = portfolio.projects.find((item) => item.id === id);

  if (!project) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 text-center">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Project not found</p>
        <h1 className="display-title text-4xl font-bold text-foreground">This case study is unavailable.</h1>
        <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground hover:border-primary hover:text-primary">
          Back to projects
        </Link>
      </main>
    );
  }

  return <ProjectDetailClient initialData={portfolio} projectId={id} />;
}