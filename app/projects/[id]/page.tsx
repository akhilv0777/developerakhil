"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { usePortfolioQuery } from "@/lib/portfolio-api";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError } = usePortfolioQuery();
  const [sharing, setSharing] = useState(false);
  const project = data?.projects.find((item) => item.id === params?.id);
  const projectIndex = project && data ? data.projects.findIndex((item) => item.id === project.id) : -1;
  const previousProject = projectIndex > 0 ? data?.projects[projectIndex - 1] : undefined;
  const nextProject = data && projectIndex >= 0 && projectIndex < data.projects.length - 1 ? data.projects[projectIndex + 1] : undefined;

  const shareProject = async () => {
    if (!project) return;
    setSharing(true);
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: project.title,
          text: project.description,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Project link copied");
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") {
        toast.error("Could not share this project");
      }
    } finally {
      setSharing(false);
    }
  };

  if (isLoading) {
    return <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground">Loading case study...</div>;
  }

  if (isError || !project) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 text-center">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Project not found</p>
        <h1 className="display-title text-4xl font-bold text-foreground">This case study is unavailable.</h1>
        <Link href="/#work" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground hover:border-primary hover:text-primary">
          <ArrowLeft size={14} /> Back to projects
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <ToastContainer position="bottom-right" theme="dark" />
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <Link href="/#work" className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft size={14} /> Back to projects
        </Link>

        <article className="mt-12">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
            <span>{project.category || "Case study"}</span>
            <span className="text-border">/</span>
            <span className="text-muted-foreground">{project.year}</span>
          </div>
          <div className="mt-5 flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <h1 className="display-title max-w-4xl text-5xl font-bold leading-[1.02] sm:text-6xl lg:text-8xl">{project.title}</h1>
            <button type="button" onClick={() => void shareProject()} disabled={sharing} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-border px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground hover:border-primary hover:text-primary disabled:opacity-50">
              <Share2 size={14} /> {sharing ? "Sharing..." : "Share project"}
            </button>
          </div>

          {project.image && (
            <div className="relative mt-12 aspect-[16/8] overflow-hidden rounded-xl border border-border bg-secondary">
              <Image src={project.image} alt={project.title} fill priority sizes="(min-width: 1024px) 960px, 100vw" className="object-cover" />
            </div>
          )}

          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="whitespace-pre-line text-lg leading-[1.9] text-muted-foreground">{project.description}</div>
            <aside className="h-fit border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Project year</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{project.year}</p>
              {project.tags && (
                <>
                  <p className="mt-8 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tools & focus</p>
                  <p className="mt-2 text-sm leading-7 text-foreground">{project.tags}</p>
                </>
              )}
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-background hover:bg-primary/85">
                  <ExternalLink size={14} /> Visit live project
                </a>
              )}
            </aside>
          </div>
          <nav className="mt-16 flex items-center justify-between gap-4 border-t border-border pt-6" aria-label="Project navigation">
            {previousProject ? (
              <Link href={`/projects/${encodeURIComponent(previousProject.id)}`} aria-label={`Open previous project: ${previousProject.title}`} className="inline-flex max-w-[42%] items-center gap-3 rounded-lg border border-border px-3 py-2 text-left transition-colors hover:border-primary">
                <ChevronLeft size={15} className="shrink-0" />
                <span className="min-w-0">
                  <span className="block font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Previous project</span>
                  <span className="mt-1 block truncate text-sm font-semibold text-foreground">{previousProject.title}</span>
                </span>
              </Link>
            ) : <span />}
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{projectIndex + 1} / {data?.projects.length ?? 0}</span>
            {nextProject ? (
              <Link href={`/projects/${encodeURIComponent(nextProject.id)}`} aria-label={`Open next project: ${nextProject.title}`} className="inline-flex max-w-[42%] items-center gap-3 rounded-lg border border-border px-3 py-2 text-right transition-colors hover:border-primary">
                <span className="min-w-0">
                  <span className="block font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Next project</span>
                  <span className="mt-1 block truncate text-sm font-semibold text-foreground">{nextProject.title}</span>
                </span>
                <ChevronRight size={15} className="shrink-0" />
              </Link>
            ) : <span />}
          </nav>
        </article>
      </div>
    </main>
  );
}