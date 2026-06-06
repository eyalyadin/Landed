import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";

// Pinned by the build spec. Do not substitute.
const MODEL = "gemini-3.5-flash";

const BASE_SYSTEM_INSTRUCTION =
  "You help an Israeli landlord reply to a tenant. Detect the language of the " +
  "tenant's most recent message (likely Hebrew or English) and write a concise, " +
  "polite suggested reply in that SAME language. Reply with only the message text " +
  "itself — no quotes, labels, or explanations.";

export type SuggestMessage = {
  direction: "inbound" | "outbound";
  body: string;
};

/**
 * Reads LandlordPreferences from the DB and builds a personalised Gemini
 * system instruction. Falls back to the base instruction if no preferences exist.
 *
 * This is the core of the learning loop: the more the landlord accepts/edits
 * suggestions, the richer the preferences become, and the more targeted the
 * prompt becomes — without fine-tuning the model.
 */
export async function buildSystemInstruction(landlordId: number): Promise<string> {
  const prefs = await prisma.landlordPreferences
    .findUnique({ where: { landlordId } })
    .catch(() => null);

  if (!prefs) return BASE_SYSTEM_INSTRUCTION;

  const parts: string[] = [BASE_SYSTEM_INSTRUCTION];

  if (prefs.preferredTone === "formal") {
    parts.push("Use formal, professional language.");
  } else if (prefs.preferredTone === "casual") {
    parts.push("Use a warm, informal, and friendly tone.");
  }

  if (prefs.preferredLanguage === "he") {
    parts.push("Unless the tenant writes in English, reply in Hebrew.");
  } else if (prefs.preferredLanguage === "en") {
    parts.push("Unless the tenant writes in Hebrew, reply in English.");
  }

  if (prefs.avgReplyLength > 0) {
    parts.push(`Keep replies around ${prefs.avgReplyLength} words.`);
  }

  const patterns = prefs.editPatterns as string[];
  if (Array.isArray(patterns) && patterns.length > 0) {
    parts.push(`This landlord tends to: ${patterns.join(", ")}.`);
  }

  return parts.join(" ");
}

export async function suggestReply(
  messages: SuggestMessage[],
  landlordId?: number,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = landlordId
    ? await buildSystemInstruction(landlordId)
    : BASE_SYSTEM_INSTRUCTION;

  const transcript = messages
    .map((m) => `${m.direction === "inbound" ? "Tenant" : "Landlord"}: ${m.body}`)
    .join("\n");

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Conversation so far:\n${transcript}\n\nWrite the landlord's next reply.`,
    config: { systemInstruction },
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
        if (currentStatus === undefined) return false;
        if (!VALID_STATUSES.has(suggestedStatus)) return false;
        if (suggestedStatus === currentStatus) return false;
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

// ─── Repair request enrichment (webhook photo → AI-inferred job details) ──────

export type RepairEnrichment = {
  title: string;
  description: string;
  category: string;
  priority: string;
};

const VALID_CATEGORIES = new Set([
  "repair", "payment_followup", "contract_renewal",
  "tenant_issue", "inspection", "maintenance",
]);
const VALID_PRIORITIES = new Set(["low", "medium", "high", "urgent"]);

const REPAIR_ENRICHMENT_INSTRUCTION =
  "You help an Israeli property manager create structured maintenance requests. " +
  "Given a tenant's photo caption (may be empty) and recent chat context, produce a concise repair request. " +
  "Output strict JSON with these exact keys: " +
  '{"title": string, "description": string, "category": string, "priority": string}. ' +
  "title: short (≤8 words), plain text description of the problem. " +
  "description: 1-2 sentences describing the likely issue and relevant details from the chat. " +
  "category: EXACTLY one of: repair, payment_followup, contract_renewal, tenant_issue, inspection, maintenance. " +
  "priority: EXACTLY one of: low, medium, high, urgent. " +
  "If the caption is thin, infer from chat context. Output ONLY the JSON object, no commentary.";

/**
 * Given a photo caption and recent chat messages, returns AI-enriched job fields.
 * Returns null on any error — callers fall back to bare "Maintenance request".
 */
export async function enrichRepairRequest(
  caption: string | null,
  messages: SuggestMessage[],
): Promise<RepairEnrichment | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });

    const parts: string[] = [];
    if (caption) parts.push(`Photo caption: "${caption}"`);
    if (messages.length > 0) {
      const transcript = messages
        .map((m) => `${m.direction === "inbound" ? "Tenant" : "Landlord"}: ${m.body}`)
        .join("\n");
      parts.push(`Recent conversation:\n${transcript}`);
    }
    if (parts.length === 0) return null;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: parts.join("\n\n"),
      config: {
        systemInstruction: REPAIR_ENRICHMENT_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const raw = (response.text ?? "")
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "");

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed !== "object" || parsed === null) return null;

    const title = typeof parsed.title === "string" && parsed.title.trim()
      ? parsed.title.trim()
      : (caption?.trim() || "Maintenance request");

    const description = typeof parsed.description === "string"
      ? parsed.description.trim()
      : "";

    const category = typeof parsed.category === "string" && VALID_CATEGORIES.has(parsed.category)
      ? parsed.category
      : "repair";

    const priority = typeof parsed.priority === "string" && VALID_PRIORITIES.has(parsed.priority)
      ? parsed.priority
      : "medium";

    return { title, description, category, priority };
  } catch {
    return null;
  }
}

// ─── Draft a vendor notification message for the tenant ───────────────────────

const VENDOR_NOTICE_INSTRUCTION =
  "You help an Israeli property manager communicate with tenants. " +
  "Write a short, polite message from the landlord telling the tenant which repair professional " +
  "will handle their maintenance request, including the vendor's name and phone number, and " +
  "suggesting they may coordinate timing directly. " +
  "Detect the tenant's language from the recent messages (Hebrew or English) and write in THAT language. " +
  "Plain text only — no markdown, no subject line, no signature. Keep it under 5 sentences.";

/**
 * Drafts a Telegram message to notify the tenant that a vendor has been assigned.
 * Throws on error — the caller falls back to a bilingual template.
 */
export async function draftVendorNotice(args: {
  tenantName: string;
  vendorName: string;
  vendorPhone: string;
  jobTitle: string;
  recentMessages: SuggestMessage[];
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const ai = new GoogleGenAI({ apiKey });

  const transcript = args.recentMessages.length > 0
    ? args.recentMessages
        .map((m) => `${m.direction === "inbound" ? "Tenant" : "Landlord"}: ${m.body}`)
        .join("\n")
    : "(no recent messages — write in both Hebrew and English)";

  const contents =
    `Tenant name: ${args.tenantName}\n` +
    `Job: ${args.jobTitle}\n` +
    `Assigned vendor: ${args.vendorName}\n` +
    `Vendor phone: ${args.vendorPhone}\n\n` +
    `Recent conversation:\n${transcript}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: { systemInstruction: VENDOR_NOTICE_INSTRUCTION },
  });

  const text = response.text?.trim();
  if (!text) throw new Error("empty draft from model");
  return text;
}
