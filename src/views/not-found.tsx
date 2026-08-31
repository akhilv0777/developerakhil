import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-12 text-foreground">
      <section className="bento-card w-full max-w-xl p-8 text-center md:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Compass size={30} />
        </div>
        <p className="mt-8 font-mono text-[11px] font-bold uppercase tracking-[.2em] text-primary">Error 404</p>
        <h1 className="display-title mt-3 text-4xl font-bold md:text-5xl">This page took a wrong turn.</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-muted-foreground">The page you are looking for does not exist or may have moved.</p>
        <Link href="/" className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-background transition-transform hover:-translate-y-0.5">
          <ArrowLeft size={14} /> Back home
        </Link>
      </section>
    </main>
  );
}
