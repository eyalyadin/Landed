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

// ─── Task transition inference ────────────────────────────────────────────────

export type TaskForInference = { id: number; title: string; status: string };
export type TaskTransition = {
  jobId: number;
  suggestedStatus: string;
  reason: string;
};

const VALID_STATUSES = new Set([
  "new",
  "in_progress",
  "waiting_on_tenant",
  "waiting_on_vendor",
  "completed",
]);

const TASK_TRANSITION_INSTRUCTION =
  "You are given a tenant↔landlord conversation and a list of property maintenance tasks " +
  "with their current status. Based ONLY on what the tenant explicitly said, decide which tasks " +
  "(if any) should change status. " +
  "Allowed status values: new, in_progress, waiting_on_tenant, waiting_on_vendor, completed. " +
  "Return a JSON array of objects with this exact shape: " +
  '[{"jobId": number, "suggestedStatus": string, "reason": string}] ' +
  "where reason is a short quote or paraphrase from the tenant message that justifies the change. " +
  "Return [] if no task changes are clearly implied. " +
  "Do NOT suggest changes based on landlord messages. Output only the JSON array, no commentary.";

/**
 * Given open tasks and recent conversation messages, returns AI-inferred status transitions.
 * Returns [] on any error (missing key, model failure, parse error) — callers treat this as
 * "no suggestions" and show nothing to the user.
 */
export async function inferTaskTransitions(
  tasks: TaskForInference[],
  messages: SuggestMessage[],
): Promise<TaskTransition[]> {
  if (tasks.length === 0 || messages.length === 0) return [];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  try {
    const ai = new GoogleGenAI({ apiKey });

    const transcript = messages
      .map((m) => `${m.direction === "inbound" ? "Tenant" : "Landlord"}: ${m.body}`)
      .join("\n");

    const taskList = tasks
      .map((t) => `- ID ${t.id}: "${t.title}" (current status: ${t.status})`)
      .join("\n");

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Tasks:\n${taskList}\n\nConversation:\n${transcript}`,
      config: {
        systemInstruction: TASK_TRANSITION_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const raw = (response.text ?? "")
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "");

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const knownIds = new Map(tasks.map((t) => [t.id, t.status]));

    return parsed
      .filter((item) => {
        if (typeof item !== "object" || item === null) return false;
        const { jobId, suggestedStatus, reason } = item as Record<string, unknown>;
        if (
          typeof jobId !== "number" ||
          typeof suggestedStatus !== "string" ||
          typeof reason !== "string"
        )
          return false;
        const currentStatus = knownIds.get(jobId);
        if (currentStatus === undefined) return false; // unknown job
        if (!VALID_STATUSES.has(suggestedStatus)) return false;
        if (suggestedStatus === currentStatus) return false; // no change
        return true;
      })
      .map((item) => {
        const { jobId, suggestedStatus, reason } = item as {
          jobId: number;
          suggestedStatus: string;
          reason: string;
        };
        return { jobId, suggestedStatus, reason };
      });
  } catch {
    return [];
  }
}
