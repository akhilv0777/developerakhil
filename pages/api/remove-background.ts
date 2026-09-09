import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionUser } from "@/lib/api-server/auth";
import { getContactSettings } from "@/lib/api-server/db";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!(await getSessionUser(req))) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const settings = await getContactSettings();
    const apiKey = settings.removeBgApiKey?.trim();
    if (!apiKey) {
      return res.status(400).json({ error: "Add the Remove.bg API key in Admin Settings first." });
    }

    const { default: busboy } = await import("busboy");
    const parser = busboy({ headers: req.headers });
    const chunks: Buffer[] = [];
    let filename = "image.png";
    let mimeType = "image/png";

    await new Promise<void>((resolve, reject) => {
      parser.on("file", (_field: string, file: NodeJS.ReadableStream, info: { filename: string; mimeType: string }) => {
        filename = info.filename || filename;
        mimeType = info.mimeType || mimeType;
        file.on("data", (chunk: Buffer) => chunks.push(chunk));
        file.on("end", resolve);
        file.on("error", reject);
      });
      parser.on("error", reject);
      req.pipe(parser);
    });

    const input = Buffer.concat(chunks);
    if (!input.length) return res.status(400).json({ error: "No image provided." });

    const payload = new FormData();
    payload.append("image_file", new Blob([input], { type: mimeType }), filename);
    payload.append("size", "auto");
    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: payload,
    });
    if (!response.ok) {
      const message = await response.text();
      return res.status(response.status).json({ error: message || "Remove.bg could not process this image." });
    }
    const output = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(output);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Background removal failed." });
  }
}