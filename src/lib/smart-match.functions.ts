import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CandidateSchema = z.object({
  user_id: z.string(),
  name: z.string(),
  service_category: z.string(),
  neighborhood: z.string(),
  bio: z.string().nullable().optional(),
  is_available: z.boolean(),
});

const InputSchema = z.object({
  prompt: z.string().min(3).max(500),
  candidates: z.array(CandidateSchema).max(80),
});

export interface SmartMatchResult {
  summary: string;
  matches: { user_id: string; reason: string }[];
}

const SYSTEM_INSTRUCTION = `You are TrustFix Smart Match, an assistant for a Cameroonian local-services marketplace (Bamenda, Douala, Yaoundé).
You receive a customer's natural-language need and a JSON list of ID-verified artisans (with user_id, name, service_category, neighborhood, bio, is_available).
Pick the best 1-5 artisans for the need. Rules:
- Only use user_id values from the provided list. Never invent artisans.
- Match on trade relevance first, then availability, then location proximity if the customer mentioned a place.
- If nothing fits, return an empty matches array and explain that in the summary.
Reply with ONLY minified JSON of shape:
{"summary":"one short sentence to the customer","matches":[{"user_id":"...","reason":"one short sentence why this artisan fits"}]}`;

function extractJson(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("AI returned an unexpected response.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export const smartMatchWorkers = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<SmartMatchResult> => {
    if (data.candidates.length === 0) {
      return { summary: "No verified artisans are listed yet.", matches: [] };
    }

    const userContent = `Customer need: ${data.prompt}\n\nArtisans:\n${JSON.stringify(data.candidates)}`;

    const geminiKey = process.env["GEMINI_API_KEY"];
    const lovableKey = process.env["LOVABLE_API_KEY"];

    const callGemini = () =>
      fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": geminiKey! },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents: [{ role: "user", parts: [{ text: userContent }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
          }),
        },
      );

    const callLovable = () =>
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", "Lovable-API-Key": lovableKey! },
        body: JSON.stringify({
          model: "google/gemini-3.7-flash",
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            { role: "user", content: userContent },
          ],
        }),
      });

    let response: Response | undefined;

    if (geminiKey) {
      try {
        response = await callGemini();
        // Bad/unbound key or an egress block on Google's endpoint: fall back to Lovable AI.
        if (!response.ok && [400, 401, 403, 404].includes(response.status)) {
          console.error(
            `Gemini direct call failed [${response.status}]: ${await response.clone().text()}`,
          );
          response = lovableKey ? undefined : response;
        }
      } catch (error) {
        console.error("Gemini direct call threw (network/egress):", error);
        response = undefined;
      }
    }

    if (!response) {
      if (!lovableKey) {
        throw new Error(
          "AI is not configured on the server. Add a valid GEMINI_API_KEY (or enable Lovable AI) and redeploy.",
        );
      }
      response = await callLovable();
    }

    if (!response.ok) {
      const body = await response.text();
      console.error(`Smart Match AI failed [${response.status}]: ${body}`);
      if (response.status === 429) throw new Error("Smart Match is busy right now. Please try again in a moment.");
      if (response.status === 402) throw new Error("AI credits are exhausted. Please contact TrustFix support.");
      throw new Error(`Smart Match is unavailable right now (${response.status}).`);
    }

    const payload = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      choices?: { message?: { content?: string } }[];
    };

    const text =
      payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ??
      payload.choices?.[0]?.message?.content ??
      "";

    const parsed = z
      .object({
        summary: z.string().default(""),
        matches: z
          .array(z.object({ user_id: z.string(), reason: z.string().default("") }))
          .default([]),
      })
      .parse(extractJson(text));

    const allowed = new Set(data.candidates.map((c) => c.user_id));
    return {
      summary: parsed.summary,
      matches: parsed.matches.filter((m) => allowed.has(m.user_id)).slice(0, 5),
    };
  });
