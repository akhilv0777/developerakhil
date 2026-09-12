import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { getContactSettings } from "@/lib/api-server/db";

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
    const account = settings.googleAdsenseAccount?.trim();
    return {
      title: settings.siteName || "Akhilesh Vishwakarma — Developer",
      description: "Full-stack developer & digital craftsman",
      ...(account && /^ca-pub-\d{10,32}$/.test(account)
        ? { other: { "google-adsense-account": account } }
        : {}),
    };
  } catch {
    return {
      title: "Akhilesh Vishwakarma — Developer",
      description: "Full-stack developer & digital craftsman",
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
