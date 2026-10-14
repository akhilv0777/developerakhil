import type { Metadata } from "next";
import NotFound from "@/views/not-found";

export const metadata: Metadata = {
  title: "Page Not Found | Akhilesh Vishwakarma",
  description: "The page you were looking for could not be found.",
};

export default function NotFoundPage() {
  return <NotFound />;
}
