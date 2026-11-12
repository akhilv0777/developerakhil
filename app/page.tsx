import { PublicPortfolio } from "@/views/PublicSite";
import { getPublicPortfolioData } from "@/lib/api-server/db";

export default async function Home() {
  const initialData = await getPublicPortfolioData();
  return <PublicPortfolio initialData={initialData} />;
}