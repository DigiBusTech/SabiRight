const MAX_LINK_LENGTH = 2048;
const TELEGRAM_BOT_USERNAME = /^[A-Za-z][A-Za-z0-9_]{1,28}bot$/i;

function normalizePhoneNumber(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\+?[\d\s().-]+$/.test(trimmed)) return null;

  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("00")) {
    digits = digits.slice(2);
  } else if (!trimmed.startsWith("+")) {
    if (digits.startsWith("0") && digits.length === 11) {
      digits = `234${digits.slice(1)}`;
    } else if (digits.length === 10) {
      digits = `234${digits}`;
    }
  }

  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

function parseHttpsUrl(value: string, allowedHosts: string[]): URL | null {
  if (value.length > MAX_LINK_LENGTH) return null;

  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !allowedHosts.includes(url.hostname.toLowerCase()) ||
      url.username ||
      url.password ||
      url.port
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export function normalizeWhatsAppBotUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  if (trimmed.length > MAX_LINK_LENGTH) return null;
  let phoneInput = trimmed;
  let message: string | null = null;

  if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)) {
    const url = parseHttpsUrl(trimmed, ["wa.me", "api.whatsapp.com"]);
    if (!url) return null;

    if (url.hostname.toLowerCase() === "wa.me") {
      const path = url.pathname.split("/").filter(Boolean);
      if (path.length !== 1) return null;
      phoneInput = path[0];
    } else {
      if (url.pathname.replace(/\/+$/, "") !== "/send") return null;
      phoneInput = url.searchParams.get("phone") || "";
    }
    message = url.searchParams.get("text");
  }

  const phone = normalizePhoneNumber(phoneInput);
  if (!phone || (message && message.length > 512)) return null;

  const normalizedUrl = new URL(`https://wa.me/${phone}`);
  if (message) normalizedUrl.searchParams.set("text", message);
  return normalizedUrl.toString();
}

export function normalizeTelegramBotUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim() || value.length > MAX_LINK_LENGTH) {
    return null;
  }

  const trimmed = value.trim();
  let username = trimmed.replace(/^@/, "");
  let startParameter: string | null = null;
  let startParameterName: "start" | "startgroup" = "start";

  if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)) {
    const url = parseHttpsUrl(trimmed, ["t.me", "telegram.me"]);
    if (!url) return null;

    const path = url.pathname.split("/").filter(Boolean);
    if (path.length !== 1) return null;
    username = path[0];
    if (url.searchParams.has("startgroup")) {
      startParameterName = "startgroup";
      startParameter = url.searchParams.get("startgroup");
    } else {
      startParameter = url.searchParams.get("start");
    }
  }

  if (!TELEGRAM_BOT_USERNAME.test(username)) return null;
  if (startParameter && startParameter.length > 64) return null;

  const normalizedUrl = new URL(`https://t.me/${username}`);
  if (startParameter) normalizedUrl.searchParams.set(startParameterName, startParameter);
  return normalizedUrl.toString();
}
