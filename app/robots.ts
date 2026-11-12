import type { MetadataRoute } from "next";
import { getContactSettings } from "@/lib/api-server/db";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getContactSettings().catch(() => null);
  const baseUrl =
    settings?.siteUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://developerakhil.site/";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${baseUrl.replace(/\/+$/, "")}/sitemap.xml`,
  };
}
