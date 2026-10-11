import { CHAT_RESPONSE_LANGUAGES } from "../shared/chatExperience.js";
import type { ChatResponseLanguage } from "../shared/chatExperience.js";

export { CHAT_RESPONSE_LANGUAGES, isChatResponseLanguage } from "../shared/chatExperience.js";
export type { ChatResponseLanguage } from "../shared/chatExperience.js";

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
