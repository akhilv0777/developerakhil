import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionUser } from "@/lib/api-server/auth";
import { getContactSettings } from "@/lib/api-server/db";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const imageUrl = typeof req.body?.imageUrl === "string" ? req.body.imageUrl.trim() : "";
  if (!imageUrl) {
    return res.status(400).json({ error: "Image URL is required." });
  }

  const settings = await getContactSettings().catch(() => null);
  const apiUrl = (settings?.removeBgApiUrl || process.env.REMOVE_BG_API_URL || "").trim();
  const apiKey = (settings?.removeBgApiKey || process.env.REMOVE_BG_API_KEY || "").trim();

  if (!apiUrl || !apiKey) {
    return res.status(500).json({
      error: "Background removal is not configured. Add REMOVE_BG_API_URL and REMOVE_BG_API_KEY, or save them in Admin > Settings.",
    });
  }

  const cleanApiKey = apiKey.replace(/^Bearer\s+/i, "").trim();
  const isRemoveBgProvider = /remove\.bg/i.test(apiUrl);
  const requestHeaders: Record<string, string> = {};
  let requestBody: string | FormData;

  if (isRemoveBgProvider) {
    requestHeaders["X-Api-Key"] = cleanApiKey;
    const formData = new FormData();
    formData.append("image_url", imageUrl);
    requestBody = formData;
  } else {
    requestHeaders.Authorization = `Bearer ${cleanApiKey}`;
    requestHeaders["Content-Type"] = "application/json";
    requestBody = JSON.stringify({ image_url: imageUrl });
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: requestHeaders,
      body: requestBody,
    });

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
      const text = await response.text();
      let message = text || `Background remover returned ${response.status}.`;

      try {
        const parsed = JSON.parse(text);
        const firstError = parsed?.errors?.[0];
        const apiMessage = firstError?.title || parsed?.detail || parsed?.message;
        if (apiMessage) message = apiMessage;
      } catch {
        // Ignore invalid JSON; keep raw text fallback.
      }

      throw new Error(message);
    }

    if (contentType.includes("application/json")) {
      const body = await response.json();
      if (body?.url) {
        return res.status(200).json({ url: body.url });
      }
      if (body?.data?.url) {
        return res.status(200).json({ url: body.data.url });
      }
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = `remove-bg-${Date.now()}.png`;
    const { put } = await import("@vercel/blob");
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
    const blobStoreId = process.env.BLOB_STORE_ID?.trim();

    const blob = await put(filename, buffer, {
      access: "public",
      contentType: "image/png",
      addRandomSuffix: false,
      ...(blobToken ? { token: blobToken } : { oidcToken, storeId: blobStoreId }),
    });

    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error("Remove background API error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Background removal failed.",
    });
  }
}
