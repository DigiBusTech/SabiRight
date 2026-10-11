import assert from "node:assert/strict";
import test from "node:test";
import {
  getBotLanguageChoices,
  getDailyBotIntroduction,
  getLanguageOnboardingMessage,
  getNigeriaLocalDate,
  getTypedLanguageSelection
} from "./onboarding.js";

test("offers language choices with automatic language matching", () => {
  assert.deepEqual(
    getBotLanguageChoices().map(choice => choice.payload),
    [
      "SET_LANG_AUTO",
      "SET_LANG_PIDGIN",
      "SET_LANG_HAUSA",
      "SET_LANG_YORUBA",
      "SET_LANG_IGBO",
      "SET_LANG_ENGLISH"
    ]
  );
});

test("accepts typed language names during first-contact onboarding", () => {
  assert.equal(getTypedLanguageSelection(" Igbo "), "SET_LANG_IGBO");
  assert.equal(getTypedLanguageSelection("Nigerian   Pidgin"), "SET_LANG_PIDGIN");
  assert.equal(getTypedLanguageSelection("auto-detect"), "SET_LANG_AUTO");
  assert.equal(getTypedLanguageSelection("How do I report an issue?"), undefined);
});

test("uses Nigeria's local calendar day for daily introductions", () => {
  assert.equal(getNigeriaLocalDate(new Date("2026-10-11T22:30:00.000Z")), "2026-10-11");
  assert.equal(getNigeriaLocalDate(new Date("2026-10-11T23:30:00.000Z")), "2026-10-12");
});

test("introduces Sabi and asks for the preferred language before the first chat", () => {
  const prompt = getLanguageOnboardingMessage("Ada", "Igbo", true);
  assert.match(prompt, /Abụ m SabiRight Agent/);
  assert.match(prompt, /họrọ asụsụ/);
  assert.match(prompt, /ziga ya ọzọ/);
  assert.doesNotMatch(getLanguageOnboardingMessage("Ada", "Igbo", false), /Abụ m SabiRight Agent/);
});

test("localizes the daily introduction and safely falls back to English", () => {
  assert.match(getDailyBotIntroduction("Ada", "Nigerian Pidgin"), /Na SabiRight Agent be this/);
  assert.match(getDailyBotIntroduction("Ada", "French"), /I'm SabiRight Agent/);
});
