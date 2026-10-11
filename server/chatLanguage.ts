export const CHAT_RESPONSE_LANGUAGES = [
  "English",
  "Nigerian Pidgin",
  "Hausa",
  "Yoruba",
  "Igbo"
] as const;

export type ChatResponseLanguage = typeof CHAT_RESPONSE_LANGUAGES[number];

export function parseChatLanguageMarker(response: string): {
  language: ChatResponseLanguage | null;
  text: string;
} {
  const markerPattern = /\[\[SABIRIGHT_LANGUAGE:\s*(English|Nigerian Pidgin|Hausa|Yoruba|Igbo)\s*\]\]/i;
  const marker = response.match(markerPattern);
  const language = marker
    ? CHAT_RESPONSE_LANGUAGES.find(candidate => candidate.toLowerCase() === marker[1].trim().toLowerCase()) || null
    : null;

  return {
    language,
    text: response.replace(/\[\[SABIRIGHT_LANGUAGE:[^\]]+\]\]/gi, "").trim()
  };
}

export function isChatResponseLanguage(language: string): language is ChatResponseLanguage {
  return CHAT_RESPONSE_LANGUAGES.includes(language as ChatResponseLanguage);
}
