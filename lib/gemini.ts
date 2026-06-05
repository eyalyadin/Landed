import { GoogleGenAI } from "@google/genai";

// Pinned by the build spec. Do not substitute.
const MODEL = "gemini-3.5-flash";

const SYSTEM_INSTRUCTION =
  "You help an Israeli landlord reply to a tenant. Detect the language of the " +
  "tenant's most recent message (likely Hebrew or English) and write a concise, " +
  "polite suggested reply in that SAME language. Reply with only the message text " +
  "itself — no quotes, labels, or explanations.";

export type SuggestMessage = {
  direction: "inbound" | "outbound";
  body: string;
};

// Builds a small labelled transcript and asks Gemini for the landlord's next reply.
// A single user turn (rather than a role-mapped history) avoids role-ordering
// constraints regardless of who sent the last message.
export async function suggestReply(messages: SuggestMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const ai = new GoogleGenAI({ apiKey });

  const transcript = messages
    .map((m) => `${m.direction === "inbound" ? "Tenant" : "Landlord"}: ${m.body}`)
    .join("\n");

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Conversation so far:\n${transcript}\n\nWrite the landlord's next reply.`,
    config: { systemInstruction: SYSTEM_INSTRUCTION },
  });

  const text = response.text?.trim();
  if (!text) throw new Error("empty suggestion from model");
  return text;
}
