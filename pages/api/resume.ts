import type { NextApiRequest, NextApiResponse } from "next";
import { get } from "@vercel/blob";
import { Readable } from "node:stream";

type ResumeRequest = {
  url?: string;
  filename?: string;
};

function isBlobUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

function safeFilename(value: string | undefined): string {
  const filename = (value || "resume.pdf").replace(/[\\/\r\n"]/g, "").trim();
  return filename || "resume.pdf";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = (req.body || {}) as ResumeRequest;
  if (!body.url || !isBlobUrl(body.url)) {
    return res.status(400).json({ error: "Invalid resume reference" });
  }

  try {
    const result = await get(body.url, { access: "public" });
    if (!result) return res.status(404).json({ error: "Resume not found" });

    const filename = safeFilename(body.filename);
    res.setHeader(
      "Content-Type",
      result.headers.get("content-type") || "application/octet-stream",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    res.setHeader("Cache-Control", "private, no-store");

    Readable.fromWeb(
      result.stream as unknown as import("node:stream/web").ReadableStream,
    ).pipe(res);
  } catch (error) {
    console.error("Resume download error:", error);
    return res.status(500).json({ error: "Unable to download resume" });
  }
}
