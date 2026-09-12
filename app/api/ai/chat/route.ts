import { NextResponse } from "next/server";
import { getContactSettings, insertAiQuestion } from "@/lib/api-server/db";

const requestLog = new Map<string, number>();
const REQUEST_WINDOW_MS = 10_000;
const MAX_MESSAGE_LENGTH = 600;

function cleanAnswer(value: string): string {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*[*-]\s+/gm, "- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getClientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
}

export async function POST(request: Request) {
  let adminSettings: Awaited<ReturnType<typeof getContactSettings>> | null = null;
  try {
    adminSettings = await getContactSettings();
  } catch {
    adminSettings = null;
  }
  const apiKey = (
    adminSettings?.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  )?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI assistant is not configured yet." },
      { status: 503 },
    );
  }

  const clientKey = getClientKey(request);
  const now = Date.now();
  const previousRequest = requestLog.get(clientKey) || 0;
  if (now - previousRequest < REQUEST_WINDOW_MS) {
    return NextResponse.json(
      { error: "Please wait a moment before asking another question." },
      { status: 429 },
    );
  }
  requestLog.set(clientKey, now);

  let questionForLog = "unknown question";
  try {
    const body = (await request.json()) as {
      question?: unknown;
      portfolio?: unknown;
      history?: unknown;
    };
    const question = typeof body.question === "string" ? body.question.trim() : "";
    questionForLog = question || questionForLog;
    if (!question || question.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Question must be between 1 and ${MAX_MESSAGE_LENGTH} characters.` },
        { status: 400 },
      );
    }

    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (item): item is { role: "user" | "assistant"; content: string } =>
              Boolean(item) &&
              typeof item === "object" &&
              (item as { role?: unknown }).role !== undefined &&
              ["user", "assistant"].includes(String((item as { role: unknown }).role)) &&
              typeof (item as { content?: unknown }).content === "string",
          )
          .slice(-6)
          .map((item) => ({ role: item.role, content: item.content.slice(0, MAX_MESSAGE_LENGTH) }))
      : [];

    const portfolioContext = JSON.stringify(body.portfolio ?? {}).slice(0, 18_000);
    const configuredModel = adminSettings?.geminiModel?.trim() || process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
    const models = Array.from(new Set([configuredModel, "gemini-3.6-flash", "gemini-3-flash-preview"]));
    const requestBody = JSON.stringify({
        systemInstruction: {
          parts: [{
            text: `You are the concise portfolio assistant for a developer's website. Answer using only the portfolio data below. You may share the public email, phone, GitHub, LinkedIn, and location fields when the visitor asks for contact details. Never invent skills, clients, prices, dates, or contact information. If a requested detail is empty or not in the data, say you do not have that detail and direct the visitor to the contact section. Keep answers friendly, professional, under 90 words, use plain text only, and always finish complete sentences. Do not use Markdown, asterisks, headings, or special formatting. Use short paragraphs or simple bullet points with a hyphen.\n\nPORTFOLIO DATA:\n${portfolioContext}`,
          }],
        },
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        },
        contents: [
          ...history.map((item) => ({
            role: item.role === "assistant" ? "model" : "user",
            parts: [{ text: item.content }],
          })),
          { role: "user", parts: [{ text: question }] },
        ],
    });
    let response = new Response(null, { status: 502 });
    for (const model of models) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestBody,
        },
      );
      if (response.status !== 404) break;
    }

    if (!response.ok) {
      console.error("AI provider error:", response.status);
      void insertAiQuestion({ question, status: "failed" }).catch(() => undefined);
      return NextResponse.json(
        { error: "The assistant is temporarily unavailable." },
        { status: 502 },
      );
    }

    const result = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawAnswer = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("");
    const answer = rawAnswer ? cleanAnswer(rawAnswer) : undefined;
    if (!answer) {
      void insertAiQuestion({ question, status: "failed" }).catch(() => undefined);
      return NextResponse.json(
        { error: "The assistant returned an empty answer." },
        { status: 502 },
      );
    }

    void insertAiQuestion({ question, answer, status: "answered" }).catch(() => undefined);
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("AI assistant error:", error);
    void insertAiQuestion({ question: questionForLog, status: "failed" }).catch(() => undefined);
    return NextResponse.json(
      { error: "Unable to answer right now. Please use the contact section instead." },
      { status: 500 },
    );
  }
}
