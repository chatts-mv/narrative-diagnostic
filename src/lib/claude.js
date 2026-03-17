const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const API = "https://api.anthropic.com/v1/messages";

export async function claude(system, user, max_tokens = 1800) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error("API " + res.status + ": " + err.slice(0, 300));
  }
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const text = (data.content || []).find((b) => b.type === "text")?.text || "";
  if (!text) throw new Error("Empty API response");
  return text;
}

/**
 * Multimodal Claude API call — supports text + image content blocks.
 * @param {string} system - System prompt
 * @param {Array} contentBlocks - Array of content blocks:
 *   { type: "text", text: "..." }
 *   { type: "image", source: { type: "base64", media_type: "image/png", data: "..." } }
 * @param {number} max_tokens
 */
export async function claudeMultimodal(system, contentBlocks, max_tokens = 1800) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens,
      system,
      messages: [{ role: "user", content: contentBlocks }],
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error("API " + res.status + ": " + err.slice(0, 300));
  }
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const text = (data.content || []).find((b) => b.type === "text")?.text || "";
  if (!text) throw new Error("Empty API response");
  return text;
}

export function parseJSON(text) {
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean);
}
