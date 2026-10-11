export const CHAT_RESPONSE_LANGUAGES = [
  "English",
  "Nigerian Pidgin",
  "Hausa",
  "Yoruba",
  "Igbo"
] as const;

export const AUTO_DETECT_LANGUAGE = "Auto-detect";

export type ChatResponseLanguage = typeof CHAT_RESPONSE_LANGUAGES[number];
export type ChatLanguagePreference = ChatResponseLanguage | typeof AUTO_DETECT_LANGUAGE;

export interface ChatAction {
  id: string;
  title: string;
  payload: string;
}

type ActionKey =
  | "help"
  | "urgent"
  | "lawyer"
  | "balance"
  | "link"
  | "account"
  | "language"
  | "professional"
  | "directory"
  | "bookings"
  | "topup"
  | "plans"
  | "start"
  | "unlink";

type CommandKey =
  | "start"
  | "help"
  | "balance"
  | "topup"
  | "plans"
  | "urgent"
  | "professional"
  | "lawyer"
  | "directory"
  | "bookings"
  | "language"
  | "link"
  | "unlink";

const COPY: Record<ChatResponseLanguage, {
  greeting: (name: string) => string;
  connected: string;
  guest: string;
  greetingPrompt: string;
  greetingPromptSelected: string;
  helpNudge: string;
  firstQueryGuide: string;
  languageBeforeFirstQuery: string;
  languagePrompt: string;
  languageAuto: string;
  autoDetectLabel: string;
  menuButton: string;
  menuSection: string;
  languageSaved: (language: string) => string;
  languageAutoSaved: string;
  helpTitle: string;
  helpPrompt: string;
  helpFooter: string;
  commands: Record<CommandKey, string>;
  actions: Record<ActionKey, string>;
}> = {
  "English": {
    greeting: name => `👋 Hello ${name}! I'm SabiRight Agent, your Nigerian civic and legal first-aid assistant.`,
    connected: "✅ Your SabiRight account is connected.",
    guest: "You are using guest chat. Choose Account to connect your SabiRight account.",
    greetingPrompt: "Send a Nigerian civic or legal question. I automatically follow the language you use.",
    greetingPromptSelected: "Send a Nigerian civic or legal question. I’ll reply in your selected language.",
    helpNudge: "Send /help to see all available options.",
    firstQueryGuide: "Choose Language to set the reply language you prefer, or send /help to see all options. Until you choose a language, I’ll keep following the language you use.",
    languageBeforeFirstQuery: "I’ll detect your language on your first civic question. After I answer, you can choose a reply language with /language.",
    languagePrompt: "Choose a reply language. Your selection stays active until you change it. Choose Auto-detect to follow the language of each message.",
    languageAuto: "🌐 Automatic language matching is on. I’ll follow the language you use in each message.",
    autoDetectLabel: "Auto-detect",
    menuButton: "Options",
    menuSection: "Choose",
    languageSaved: language => `✅ ${language} is saved as your reply language until you change it.`,
    languageAutoSaved: "✅ Auto-detect is on. I’ll follow the language you use in each message.",
    helpTitle: "⚖️ SabiRight Agent help",
    helpPrompt: "Choose an option below or send a command:",
    helpFooter: "You can also type a Nigerian civic or legal question naturally.",
    commands: {
      start: "Show the welcome message",
      help: "Show all commands and options",
      balance: "Check credits and current plan",
      topup: "Buy credits",
      plans: "View subscription plans",
      urgent: "Get concise emergency guidance",
      professional: "Find a professional for your issue",
      lawyer: "Search specifically for a lawyer",
      directory: "Browse professional categories",
      bookings: "View bookings and case status",
      language: "Choose a reply language",
      link: "Connect your account: link CODE",
      unlink: "Disconnect your linked account"
    },
    actions: {
      help: "❔ Help",
      urgent: "🚨 Urgent",
      lawyer: "👨‍⚖️ Find Lawyer",
      balance: "💳 Credits",
      link: "🔗 Account",
      account: "🔗 Account Info",
      language: "🌐 Language",
      professional: "Find Professional",
      directory: "📂 Directory",
      bookings: "📋 Bookings",
      topup: "💳 Top Up",
      plans: "👑 Plans",
      start: "🏠 Main Menu",
      unlink: "Unlink Account"
    }
  },
  "Nigerian Pidgin": {
    greeting: name => `👋 How far ${name}! Na SabiRight Agent be this, your Nigerian civic and legal first-aid assistant.`,
    connected: "✅ Your SabiRight account don connect.",
    guest: "You dey use guest chat. Choose Account to connect your SabiRight account.",
    greetingPrompt: "Send your Nigerian civic or legal question. I go follow the language wey you use.",
    greetingPromptSelected: "Send your Nigerian civic or legal question. I go reply for the language wey you choose.",
    helpNudge: "Send /help to see all the options wey dey available.",
    firstQueryGuide: "Choose Language make you set the language wey you want, or send /help to see all options. Until you choose, I go follow the language wey you use.",
    languageBeforeFirstQuery: "I go detect your language for your first civic question. After I answer, you fit choose reply language with /language.",
    languagePrompt: "Choose the language wey you want make I use. E go remain until you change am. Choose Auto-detect make I follow the language wey you use for each message.",
    languageAuto: "🌐 Automatic language matching dey on. I go follow the language wey you use for each message.",
    autoDetectLabel: "Auto-detect",
    menuButton: "Options",
    menuSection: "Choose",
    languageSaved: language => `✅ I don save ${language} as your reply language until you change am.`,
    languageAutoSaved: "✅ Auto-detect dey on. I go follow the language wey you use for each message.",
    helpTitle: "⚖️ SabiRight Agent help",
    helpPrompt: "Choose option below or send command:",
    helpFooter: "You fit also type your Nigerian civic or legal question naturally.",
    commands: {
      start: "Show welcome message",
      help: "Show all commands and options",
      balance: "Check credits and current plan",
      topup: "Buy credits",
      plans: "See subscription plans",
      urgent: "Get short help for emergency",
      professional: "Find professional for your matter",
      lawyer: "Search lawyer only",
      directory: "Browse professional categories",
      bookings: "Check bookings and case status",
      language: "Choose reply language",
      link: "Connect your account: link CODE",
      unlink: "Disconnect your linked account"
    },
    actions: {
      help: "❔ Help",
      urgent: "🚨 Urgent",
      lawyer: "👨‍⚖️ Find Lawyer",
      balance: "💳 Credits",
      link: "🔗 Account",
      account: "🔗 Account Info",
      language: "🌐 Language",
      professional: "Find Professional",
      directory: "📂 Directory",
      bookings: "📋 Bookings",
      topup: "💳 Top Up",
      plans: "👑 Plans",
      start: "🏠 Main Menu",
      unlink: "Unlink Account"
    }
  },
  "Hausa": {
    greeting: name => `👋 Sannu ${name}! Ni ne SabiRight Agent, mai taimaka maka kan al'amuran jama'a da dokokin Najeriya.`,
    connected: "✅ An haɗa asusunka na SabiRight.",
    guest: "Kana amfani da tattaunawar baƙo. Zaɓi Asusu don haɗa asusunka na SabiRight.",
    greetingPrompt: "Aiko da tambayarka kan al'amuran jama'a ko doka a Najeriya. Zan bi harshen da kake amfani da shi.",
    greetingPromptSelected: "Aiko da tambayarka kan al'amuran jama'a ko doka a Najeriya. Zan amsa da harshen da ka zaɓa.",
    helpNudge: "Aika /help don ganin duk zaɓuɓɓukan da ake da su.",
    firstQueryGuide: "Zaɓi Harshe don saita harshen amsarka, ko aika /help don ganin duk zaɓuɓɓuka. Zan ci gaba da bin harshen da kake amfani da shi har sai ka zaɓi wani.",
    languageBeforeFirstQuery: "Zan gano harshenka a tambayarka ta farko kan al'amuran jama'a. Bayan na amsa, zaka iya zaɓar harshen amsa da /language.",
    languagePrompt: "Zaɓi harshen amsa. Zaɓinka zai ci gaba har sai ka canza shi. Zaɓi Gano ta atomatik don bin harshen kowane saƙo.",
    languageAuto: "🌐 Ana gano harshe ta atomatik. Zan bi harshen da kake amfani da shi a kowane saƙo.",
    autoDetectLabel: "Gano ta atomatik",
    menuButton: "Zaɓuɓɓuka",
    menuSection: "Zaɓi",
    languageSaved: language => `✅ An saita ${language} a matsayin harshen amsarka har sai ka canza shi.`,
    languageAutoSaved: "✅ An kunna gano harshe ta atomatik. Zan bi harshen da kake amfani da shi a kowane saƙo.",
    helpTitle: "⚖️ Taimakon SabiRight Agent",
    helpPrompt: "Zaɓi abu a ƙasa ko aika umarni:",
    helpFooter: "Haka kuma zaka iya rubuta tambayarka kan al'amuran jama'a ko doka a Najeriya.",
    commands: {
      start: "Nuna saƙon maraba",
      help: "Nuna duk umarni da zaɓuɓɓuka",
      balance: "Duba kuɗin amfani da tsarin yanzu",
      topup: "Sayi ƙarin kuɗin amfani",
      plans: "Duba tsarin biyan kuɗi",
      urgent: "Samun gajeriyar taimako cikin gaggawa",
      professional: "Nemi ƙwararre kan matsalarka",
      lawyer: "Nemi lauya kawai",
      directory: "Duba rukunin ƙwararru",
      bookings: "Duba alƙawura da halin shari'a",
      language: "Zaɓi harshen amsa",
      link: "Haɗa asusu: link CODE",
      unlink: "Cire haɗin asusunka"
    },
    actions: {
      help: "❔ Taimako",
      urgent: "🚨 Gaggawa",
      lawyer: "Nemi Lauya",
      balance: "💳 Kuɗi",
      link: "🔗 Asusu",
      account: "🔗 Bayanin Asusu",
      language: "🌐 Harshe",
      professional: "Nemi Ƙwararre",
      directory: "📂 Rukunin Ƙwararru",
      bookings: "📋 Alƙawura",
      topup: "Cika Kuɗi",
      plans: "👑 Tsare-tsare",
      start: "🏠 Babban Menu",
      unlink: "Cire Haɗi"
    }
  },
  "Yoruba": {
    greeting: name => `👋 Ẹ káàbọ̀ ${name}! Èmi ni SabiRight Agent, olùrànlọ́wọ́ àkọ́kọ́ fún ẹ̀tọ́ aráàlú àti òfin Nàìjíríà.`,
    connected: "✅ A ti so àkọọlẹ SabiRight rẹ pọ̀.",
    guest: "O n lo iwiregbe alejo. Yan Àkọọlẹ lati so àkọọlẹ SabiRight rẹ pọ̀.",
    greetingPrompt: "Fi ìbéèrè rẹ nípa ẹ̀tọ́ aráàlú tàbí òfin Nàìjíríà ránṣẹ́. Màá tẹ̀lé èdè tí o bá lò.",
    greetingPromptSelected: "Fi ìbéèrè rẹ nípa ẹ̀tọ́ aráàlú tàbí òfin Nàìjíríà ránṣẹ́. Màá dáhùn ní èdè tí o yàn.",
    helpNudge: "Fi /help ránṣẹ́ láti rí gbogbo àṣàyàn tó wà.",
    firstQueryGuide: "Yan Èdè láti ṣètò èdè ìdáhùn tí o fẹ́, tàbí fi /help ránṣẹ́ láti rí gbogbo àṣàyàn. Màá tẹ̀lé èdè tí o bá lò títí tí o fi yan èdè mìíràn.",
    languageBeforeFirstQuery: "Màá ṣàwárí èdè rẹ nínú ìbéèrè àkọ́kọ́ rẹ. Lẹ́yìn ìdáhùn mi, o lè yan èdè ìdáhùn pẹ̀lú /language.",
    languagePrompt: "Yan èdè ìdáhùn. Yíyan rẹ yóò dúró títí tí o fi yí i padà. Yan Ìdáhùn aládàáṣiṣẹ́ kí n lè tẹ̀lé èdè ìfiránṣẹ́ kọ̀ọ̀kan.",
    languageAuto: "🌐 Ìdáhùn aládàáṣiṣẹ́ ti ṣiṣẹ́. Màá tẹ̀lé èdè tí o bá lò nínú gbogbo ìfiránṣẹ́.",
    autoDetectLabel: "Ìdáhùn aládàáṣiṣẹ́",
    menuButton: "Àṣàyàn",
    menuSection: "Yan",
    languageSaved: language => `✅ A ti fi ${language} pamọ́ gẹ́gẹ́ bí èdè ìdáhùn rẹ títí tí o fi yí i padà.`,
    languageAutoSaved: "✅ Ìdáhùn aládàáṣiṣẹ́ ti ṣiṣẹ́. Màá tẹ̀lé èdè tí o bá lò nínú gbogbo ìfiránṣẹ́.",
    helpTitle: "⚖️ Ìrànlọ́wọ́ SabiRight Agent",
    helpPrompt: "Yan ohun kan ní ìsàlẹ̀ tàbí fi àṣẹ ránṣẹ́:",
    helpFooter: "O tún lè kọ ìbéèrè rẹ nípa ẹ̀tọ́ aráàlú tàbí òfin Nàìjíríà.",
    commands: {
      start: "Fi ìkíni hàn",
      help: "Fi gbogbo àṣẹ àti àṣàyàn hàn",
      balance: "Ṣàyẹ̀wò kírẹ́ẹ̀dì àti ètò rẹ",
      topup: "Ra kírẹ́ẹ̀dì",
      plans: "Wo àwọn ètò ìsanwó",
      urgent: "Gba ìtọ́sọ́nà pajawiri kúkúrú",
      professional: "Wa amòye tó bá ọ̀ràn rẹ mu",
      lawyer: "Wa amòfin nìkan",
      directory: "Wo àwọn ẹ̀ka amòye",
      bookings: "Wo àwọn ìforúkọsílẹ̀ àti ipò ọ̀ràn",
      language: "Yan èdè ìdáhùn",
      link: "So àkọọlẹ pọ̀: link CODE",
      unlink: "Yọ asopọ àkọọlẹ rẹ"
    },
    actions: {
      help: "❔ Ìrànlọ́wọ́",
      urgent: "🚨 Pajawiri",
      lawyer: "Wa Amòfin",
      balance: "💳 Kírẹ́ẹ̀dì",
      link: "🔗 Àkọọlẹ",
      account: "🔗 Àlàyé Àkọọlẹ",
      language: "🌐 Èdè",
      professional: "Wa Amòye",
      directory: "📂 Àkójọ Amòye",
      bookings: "📋 Ìforúkọsílẹ̀",
      topup: "Fi Kírẹ́ẹ̀dì Kún",
      plans: "👑 Ètò",
      start: "🏠 Àkójú",
      unlink: "Yọ Asopọ"
    }
  },
  "Igbo": {
    greeting: name => `👋 Ndewo ${name}! Abụ m SabiRight Agent, onye na-enyere gị aka mbụ gbasara ikike obodo na iwu Naịjirịa.`,
    connected: "✅ Ejikọtala akaụntụ SabiRight gị.",
    guest: "Ị na-eji nkata ọbịa. Họrọ Akaụntụ iji jikọọ akaụntụ SabiRight gị.",
    greetingPrompt: "Zipu ajụjụ gbasara ikike obodo ma ọ bụ iwu Naịjirịa. Aga m eso asụsụ i ji dee ozi.",
    greetingPromptSelected: "Zipu ajụjụ gbasara ikike obodo ma ọ bụ iwu Naịjirịa. Aga m azaghachi n'asụsụ ị họọrọ.",
    helpNudge: "Zipu /help ka ị hụ nhọrọ niile dị.",
    firstQueryGuide: "Họrọ Asụsụ iji họrọ asụsụ azịza, ma ọ bụ zipu /help ka ị hụ nhọrọ niile. Aga m eso asụsụ i ji dee ozi ruo mgbe ị họọrọ asụsụ ọzọ.",
    languageBeforeFirstQuery: "Aga m achọpụta asụsụ gị n'ajụjụ mbụ gbasara ikike obodo. Mgbe m zara, ị nwere ike ịhọrọ asụsụ azịza site na /language.",
    languagePrompt: "Họrọ asụsụ azịza. Nhọrọ gị ga-adịgide ruo mgbe ị gbanwere ya. Họrọ Nchọpụta akpaghị aka ka m soro asụsụ ozi ọ bụla.",
    languageAuto: "🌐 Nchọpụta asụsụ akpaghị aka amalitela. Aga m eso asụsụ i ji dee ozi ọ bụla.",
    autoDetectLabel: "Nchọpụta akpaghị aka",
    menuButton: "Nhọrọ",
    menuSection: "Họrọ",
    languageSaved: language => `✅ Echekwala ${language} dị ka asụsụ azịza gị ruo mgbe ị gbanwere ya.`,
    languageAutoSaved: "✅ Nchọpụta asụsụ akpaghị aka amalitela. Aga m eso asụsụ i ji dee ozi ọ bụla.",
    helpTitle: "⚖️ Enyemaka SabiRight Agent",
    helpPrompt: "Họrọ nhọrọ n'okpuru ma ọ bụ zipu iwu:",
    helpFooter: "Ị nwekwara ike dee ajụjụ gbasara ikike obodo ma ọ bụ iwu Naịjirịa.",
    commands: {
      start: "Gosi ozi nnabata",
      help: "Gosi iwu na nhọrọ niile",
      balance: "Lelee kredit na atụmatụ ugbu a",
      topup: "Zụta kredit",
      plans: "Lelee atụmatụ ndenye aha",
      urgent: "Nweta ndụmọdụ mberede dị mkpirikpi",
      professional: "Chọọ ọkachamara dabara n'okwu gị",
      lawyer: "Chọọ naanị ọkaiwu",
      directory: "Lelee ngalaba ndị ọkachamara",
      bookings: "Lelee ndokwa na ọnọdụ ikpe",
      language: "Họrọ asụsụ azịza",
      link: "Jikọọ akaụntụ: link CODE",
      unlink: "Kwụpụ njikọ akaụntụ gị"
    },
    actions: {
      help: "❔ Enyemaka",
      urgent: "🚨 Mberede",
      lawyer: "Chọọ Ọkaiwu",
      balance: "💳 Kredit",
      link: "🔗 Akaụntụ",
      account: "🔗 Nkọwa Akaụntụ",
      language: "🌐 Asụsụ",
      professional: "Chọọ Ọkachamara",
      directory: "📂 Ndepụta Ndị Ọkachamara",
      bookings: "📋 Ndokwa",
      topup: "Tinye Kredit",
      plans: "👑 Atụmatụ",
      start: "🏠 Nchịkọta",
      unlink: "Kwụpụ Njikọ"
    }
  }
};

const COMMANDS: Array<{ key: CommandKey; command: string }> = [
  { key: "start", command: "/start" },
  { key: "help", command: "/help" },
  { key: "balance", command: "/balance" },
  { key: "topup", command: "/topup" },
  { key: "plans", command: "/plans" },
  { key: "urgent", command: "/urgent" },
  { key: "professional", command: "/professional" },
  { key: "lawyer", command: "/lawyer" },
  { key: "directory", command: "/directory" },
  { key: "bookings", command: "/bookings" },
  { key: "language", command: "/language" },
  { key: "link", command: "link CODE" },
  { key: "unlink", command: "/unlink" }
];

const LANGUAGE_PAYLOADS: Array<{ language: ChatLanguagePreference; payload: string }> = [
  { language: AUTO_DETECT_LANGUAGE, payload: "SET_LANG_AUTO" },
  { language: "English", payload: "SET_LANG_ENGLISH" },
  { language: "Nigerian Pidgin", payload: "SET_LANG_PIDGIN" },
  { language: "Hausa", payload: "SET_LANG_HAUSA" },
  { language: "Yoruba", payload: "SET_LANG_YORUBA" },
  { language: "Igbo", payload: "SET_LANG_IGBO" }
];

export function isChatResponseLanguage(language: string | undefined): language is ChatResponseLanguage {
  return CHAT_RESPONSE_LANGUAGES.includes(language as ChatResponseLanguage);
}

export function getChatLanguageFromPayload(payload: string): ChatLanguagePreference | null {
  return LANGUAGE_PAYLOADS.find(option => option.payload === payload)?.language || null;
}

export function normalizeChatResponseLanguage(language: string | undefined): ChatResponseLanguage {
  return isChatResponseLanguage(language) ? language : "English";
}

export function getChatDailyIntroduction(name: string, language: string): string {
  return COPY[normalizeChatResponseLanguage(language)].greeting(name.trim() || "Citizen");
}

export function getBotListMenuLabels(language: string): { buttonText: string; sectionTitle: string } {
  const copy = COPY[normalizeChatResponseLanguage(language)];
  return { buttonText: copy.menuButton, sectionTitle: copy.menuSection };
}

export function getChatWelcomeText(
  name: string,
  language: string,
  isLinked: boolean,
  languageMode: "auto" | "selected" = "auto"
): string {
  const copy = COPY[normalizeChatResponseLanguage(language)];
  const safeName = name.trim() || "Citizen";
  return [
    copy.greeting(safeName),
    isLinked ? copy.connected : copy.guest,
    languageMode === "selected" ? copy.greetingPromptSelected : copy.greetingPrompt
  ].join("\n\n");
}

export function getChatHelpNudge(language: string): string {
  return COPY[normalizeChatResponseLanguage(language)].helpNudge;
}

export function getLocalizedActionTitle(language: string, action: ActionKey): string {
  return COPY[normalizeChatResponseLanguage(language)].actions[action];
}

export function getFirstQueryGuide(language: string): string {
  return COPY[normalizeChatResponseLanguage(language)].firstQueryGuide;
}

export function getLanguageBeforeFirstQueryNotice(language: string): string {
  return COPY[normalizeChatResponseLanguage(language)].languageBeforeFirstQuery;
}

export function getLanguagePicker(language: string): { text: string; actions: ChatAction[] } {
  const copy = COPY[normalizeChatResponseLanguage(language)];
  return {
    text: `${copy.languagePrompt}\n\n${copy.languageAuto}\n\n` +
      `Auto-detect · ${CHAT_RESPONSE_LANGUAGES.join(" · ")}`,
    actions: LANGUAGE_PAYLOADS.map(option => ({
      id: `language-${option.payload.toLowerCase()}`,
      title: option.language === AUTO_DETECT_LANGUAGE ? copy.autoDetectLabel : option.language,
      payload: option.payload
    }))
  };
}

export function getLanguagePreferenceConfirmation(language: string, autoDetect: boolean): string {
  const copy = COPY[normalizeChatResponseLanguage(language)];
  return autoDetect ? copy.languageAutoSaved : copy.languageSaved(language);
}

export function getWelcomeActions(language: string, isLinked: boolean): ChatAction[] {
  const labels = COPY[normalizeChatResponseLanguage(language)].actions;
  return [
    { id: "urgent", title: labels.urgent, payload: "ACTION_URGENT" },
    { id: "help", title: labels.help, payload: "ACTION_HELP" },
    { id: "lawyer", title: labels.lawyer, payload: "ACTION_LAWYER" },
    { id: "balance", title: labels.balance, payload: "ACTION_BALANCE" },
    { id: "account", title: isLinked ? labels.account : labels.link, payload: "ACTION_LINK" }
  ];
}

export function getHelpResponse(language: string): { text: string; actions: ChatAction[] } {
  const copy = COPY[normalizeChatResponseLanguage(language)];
  const text = `${copy.helpTitle}\n${copy.helpPrompt}\n\n` +
    `${COMMANDS.map(({ key, command }) => `• ${command} — ${copy.commands[key]}`).join("\n")}\n\n` +
    copy.helpFooter;
  const actionKeys: Array<{ key: ActionKey; payload: string }> = [
    { key: "urgent", payload: "ACTION_URGENT" },
    { key: "balance", payload: "ACTION_BALANCE" },
    { key: "topup", payload: "ACTION_TOPUP" },
    { key: "plans", payload: "ACTION_PLANS" },
    { key: "professional", payload: "ACTION_PROFESSIONAL" },
    { key: "lawyer", payload: "ACTION_LAWYER" },
    { key: "directory", payload: "ACTION_DIRECTORY" },
    { key: "bookings", payload: "ACTION_BOOKINGS" },
    { key: "language", payload: "ACTION_LANG" },
    { key: "link", payload: "ACTION_LINK" }
  ];
  return {
    text,
    actions: actionKeys.map(({ key, payload }) => ({
      id: key,
      title: copy.actions[key],
      payload
    }))
  };
}
