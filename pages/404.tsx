import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found | Developer Akhil</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className="notFound">
        <section className="card">
          <div className="icon" aria-hidden="true">
            <Compass size={30} />
          </div>
          <p className="eyebrow">Error 404</p>
          <h1>This page took a wrong turn.</h1>
          <p className="message">
            The page you are looking for does not exist or may have moved.
          </p>
          <Link className="homeLink" href="/">
            <ArrowLeft size={15} aria-hidden="true" />
            Back home
          </Link>
        </section>
      </main>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body,
        #__next {
          min-height: 100%;
          margin: 0;
        }

        .notFound {
          align-items: center;
          background: #090b10;
          color: #f8fafc;
          display: flex;
          font-family: system-ui, sans-serif;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
        }

        .card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 28px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
          max-width: 560px;
          padding: 48px 32px;
          text-align: center;
          width: 100%;
        }

        .icon {
          align-items: center;
          background: rgba(16, 185, 129, 0.12);
          border-radius: 18px;
          color: #34d399;
          display: flex;
          height: 64px;
          justify-content: center;
          margin: 0 auto;
          width: 64px;
        }

        .eyebrow {
          color: #34d399;
          font: 700 11px/1.5 ui-monospace, monospace;
          letter-spacing: 0.2em;
          margin: 32px 0 0;
          text-transform: uppercase;
        }

        h1 {
          font-size: clamp(32px, 7vw, 48px);
          letter-spacing: -0.04em;
          line-height: 1.08;
          margin: 12px 0 0;
        }

        .message {
          color: #a1a1aa;
          font-size: 14px;
          line-height: 1.8;
          margin: 20px auto 0;
          max-width: 360px;
        }

        .homeLink {
          align-items: center;
          background: #10b981;
          border-radius: 999px;
          color: #07110e;
          display: inline-flex;
          font: 700 11px/1 ui-monospace, monospace;
          gap: 8px;
          letter-spacing: 0.08em;
          margin-top: 32px;
          padding: 14px 20px;
          text-decoration: none;
          text-transform: uppercase;
          transition: transform 160ms ease;
        }

        .homeLink:hover {
          transform: translateY(-2px);
        }

        @media (max-width: 480px) {
          .card {
            padding: 40px 24px;
          }
        }
      `}</style>
    </>
  );
}
