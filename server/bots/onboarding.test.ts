import assert from "node:assert/strict";
import test from "node:test";
import {
  getChatWelcomeText,
  getFirstQueryGuide,
  getHelpResponse,
  getLanguagePicker
} from "../../shared/chatExperience.js";
import { getDailyBotIntroduction, getNigeriaLocalDate } from "./onboarding.js";

test("welcome copy includes the first-contact greeting, connection status, and auto-detect prompt", () => {
  const welcome = getChatWelcomeText("Ada", "English", true);
  assert.match(welcome, /Hello Ada! I'm SabiRight Agent/);
  assert.match(welcome, /Your SabiRight account is connected/);
  assert.match(welcome, /automatically follow the language you use/);
});

test("first-query guide offers language choice and help after the answer", () => {
  const guide = getFirstQueryGuide("Igbo");
  assert.match(guide, /Asụsụ/);
  assert.match(guide, /\/help/);
});

test("language picker provides auto-detect and all supported explicit choices", () => {
  const picker = getLanguagePicker("Yoruba");
  assert.match(picker.text, /Yan èdè ìdáhùn/);
  assert.deepEqual(
    picker.actions.map(action => action.payload),
    ["SET_LANG_AUTO", "SET_LANG_ENGLISH", "SET_LANG_PIDGIN", "SET_LANG_HAUSA", "SET_LANG_YORUBA", "SET_LANG_IGBO"]
  );
});

test("help lists all commands and supplies selectable menu actions", () => {
  const help = getHelpResponse("Hausa");
  assert.match(help.text, /\/help/);
  assert.match(help.text, /\/language/);
  assert.match(help.text, /link CODE/);
  assert.equal(help.actions.length, 10);
  assert.equal(help.actions.find(action => action.payload === "ACTION_LANG")?.title, "🌐 Harshe");
});

test("uses Nigeria's local calendar day for daily introductions", () => {
  assert.equal(getNigeriaLocalDate(new Date("2026-10-11T22:30:00.000Z")), "2026-10-11");
  assert.equal(getNigeriaLocalDate(new Date("2026-10-11T23:30:00.000Z")), "2026-10-12");
});

test("localizes the daily introduction and safely falls back to English", () => {
  assert.match(getDailyBotIntroduction("Ada", "Nigerian Pidgin"), /Na SabiRight Agent be this/);
  assert.match(getDailyBotIntroduction("Ada", "French"), /I'm SabiRight Agent/);
});
