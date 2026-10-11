import { getChatDailyIntroduction } from "../../shared/chatExperience.js";

export function getNigeriaLocalDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function getDailyBotIntroduction(name: string, language?: string): string {
  return getChatDailyIntroduction(name, language || "English");
}
