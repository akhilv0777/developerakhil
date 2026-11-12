import type { MetadataRoute } from "next";
import { getContactSettings } from "@/lib/api-server/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getContactSettings().catch(() => null);
  const baseUrl =
    settings?.siteUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://developerakhil.site/";
  const root = baseUrl.replace(/\/+$/, "");

  return [
    {
      url: root,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
