import type { BotQuickAction } from "./types.js";

const LANGUAGE_CHOICES: BotQuickAction[] = [
  { id: "auto", title: "Auto-detect 🌐", payload: "SET_LANG_AUTO" },
  { id: "pidgin", title: "Nigerian Pidgin 🇳🇬", payload: "SET_LANG_PIDGIN" },
  { id: "hausa", title: "Hausa 🇳🇬", payload: "SET_LANG_HAUSA" },
  { id: "yoruba", title: "Yoruba 🇳🇬", payload: "SET_LANG_YORUBA" },
  { id: "igbo", title: "Igbo 🇳🇬", payload: "SET_LANG_IGBO" },
  { id: "english", title: "English", payload: "SET_LANG_ENGLISH" }
];

const DAILY_INTRODUCTIONS: Record<string, (name: string) => string> = {
  "English": name => `👋 Hello, ${name}! I'm SabiRight Agent, your Nigerian civic and legal first-aid assistant.`,
  "Nigerian Pidgin": name => `👋 How far, ${name}! Na SabiRight Agent be this, your Nigerian civic and legal first-aid assistant.`,
  "Hausa": name => `👋 Sannu, ${name}! Ni ne SabiRight Agent, mai taimaka kan haƙƙoƙin jama'a da dokokin Najeriya.`,
  "Yoruba": name => `👋 Ẹ káàbọ̀, ${name}! Èmi ni SabiRight Agent, olùrànlọ́wọ́ rẹ fún ẹ̀tọ́ aráàlú àti òfin Nàìjíríà.`,
  "Igbo": name => `👋 Ndewo, ${name}! Abụ m SabiRight Agent, onye enyemaka gị gbasara ikike na iwu Naịjirịa.`
};

const LANGUAGE_PROMPTS: Record<string, string> = {
  "English": "Before we begin, choose your preferred language below. Auto-detect makes Sabi follow the language you use in each message. I haven't answered your first message yet, so please send it again after choosing.",
  "Nigerian Pidgin": "Before we start, choose the language wey you prefer below. Auto-detect go make Sabi follow the language wey you use for each message. I never answer your first message yet, abeg send am again after you choose.",
  "Hausa": "Kafin mu fara, zaɓi harshen da ka fi so a ƙasa. Gano ta atomatik zai sa Sabi ta bi harshen da kake amfani da shi a kowane saƙo. Ban amsa saƙonka na farko ba tukuna; ka sake aikowa bayan zaɓi.",
  "Yoruba": "Kí a tó bẹ̀rẹ̀, yan èdè tí o fẹ́ lólù ní ìsàlẹ̀. Ìdáhùn aládàáṣiṣẹ́ yóò jẹ́ kí Sabi tẹ̀lé èdè tí o bá lò nínú gbogbo ìfiránṣẹ́. Mi ò tíì dáhùn ìbéèrè àkọ́kọ́ rẹ; jọ̀wọ́ tún rán an lẹ́yìn yíyan èdè.",
  "Igbo": "Tupu anyị amalite, họrọ asụsụ ịchọrọ n'okpuru. Nchọpụta akpaghị aka ga-eme ka Sabi jiri asụsụ i ji dee ozi ọ bụla zaa gị. Azaghị m ajụjụ mbụ gị; biko ziga ya ọzọ ma ịhọrọchaa asụsụ."
};

export function getBotLanguageChoices(): BotQuickAction[] {
  return LANGUAGE_CHOICES.map(choice => ({ ...choice }));
}

export function getTypedLanguageSelection(text: string): string | undefined {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, " ");
  const choices: Record<string, string> = {
    "auto": "SET_LANG_AUTO",
    "auto-detect": "SET_LANG_AUTO",
    "automatic": "SET_LANG_AUTO",
    "english": "SET_LANG_ENGLISH",
    "nigerian pidgin": "SET_LANG_PIDGIN",
    "pidgin": "SET_LANG_PIDGIN",
    "hausa": "SET_LANG_HAUSA",
    "yoruba": "SET_LANG_YORUBA",
    "igbo": "SET_LANG_IGBO"
  };
  return choices[normalized];
}

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
  const intro = DAILY_INTRODUCTIONS[language || "English"] || DAILY_INTRODUCTIONS.English;
  return intro(name.trim() || "Citizen");
}

export function getLanguageOnboardingMessage(name: string, language: string, includeIntro: boolean): string {
  const prompt = LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS.English;
  return [
    includeIntro ? getDailyBotIntroduction(name, language) : undefined,
    `🌐 *Choose your preferred language*\n\n${prompt}`
  ].filter(Boolean).join("\n\n");
}
