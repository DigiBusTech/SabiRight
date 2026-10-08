// Shared formatting helpers for chat channels.

// Normalise LLM markdown into the light syntax both WhatsApp and Telegram (legacy Markdown) understand.
export function normalizeMarkdown(text: string): string {
  return (text || '')
    .replace(/\r\n/g, '\n')
    .replace(/^#{1,6}\s*(.+)$/gm, '*$1*')
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    .replace(/__(.+?)__/g, '_$1_')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '$1: $2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Split on paragraph/line boundaries so no chunk exceeds the channel limit.
export function chunkText(text: string, limit: number): string[] {
  const out: string[] = [];
  let rest = text;
  while (rest.length > limit) {
    let cut = rest.lastIndexOf('\n\n', limit);
    if (cut < limit * 0.4) cut = rest.lastIndexOf('\n', limit);
    if (cut < limit * 0.4) cut = rest.lastIndexOf(' ', limit);
    if (cut < limit * 0.4) cut = limit;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out;
}

// Short-lived de-duplication of provider message ids (webhooks are retried).
const seen = new Map<string, number>();
export function isDuplicate(id: string | undefined): boolean {
  if (!id) return false;
  const now = Date.now();
  if (seen.size > 5000) for (const [k, t] of seen) if (now - t > 600_000) seen.delete(k);
  if (seen.has(id)) return true;
  seen.set(id, now);
  return false;
}
