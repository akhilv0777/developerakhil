import type { MetadataRoute } from "next";
import { getContactSettings } from "@/lib/api-server/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getContactSettings().catch(() => null);
  const baseUrl =
    settings?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://www.akhilesh-vishwakarma.com";
  const root = baseUrl.replace(/\/$/, "");

  return [
    {
      url: root,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${root}/#projects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${root}/#contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
