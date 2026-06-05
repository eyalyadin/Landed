// Cheap language hint for stored messages. The AI suggestion (Phase 4) does its
// own detection; this is just metadata for the thread view.
export function detectLanguage(text: string): "he" | "en" {
  // Any Hebrew character (U+0590–U+05FF) → treat as Hebrew.
  return /[֐-׿]/.test(text) ? "he" : "en";
}
