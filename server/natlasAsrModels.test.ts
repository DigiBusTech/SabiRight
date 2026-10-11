import assert from "node:assert/strict";
import test from "node:test";
import {
  NATLAS_ASR_ENDPOINT_SETTINGS,
  selectNAtlasAsrLanguage,
  selectNAtlasAsrModel
} from "./natlasAsrModels.js";

test("selects language-specific N-ATLAS ASR models", () => {
  assert.equal(selectNAtlasAsrModel("Yorùbá"), "NCAIR1/Yoruba-ASR");
  assert.equal(selectNAtlasAsrModel("ig"), "NCAIR1/Igbo-ASR");
  assert.equal(selectNAtlasAsrModel("Hausa"), "NCAIR1/Hausa-ASR");
  assert.equal(selectNAtlasAsrModel("English"), "NCAIR1/NigerianAccentedEnglish");
  assert.equal(selectNAtlasAsrModel("Nigerian Pidgin"), "NCAIR1/NigerianAccentedEnglish");
  assert.equal(selectNAtlasAsrModel("English GB"), "NCAIR1/NigerianAccentedEnglish");
  assert.equal(selectNAtlasAsrModel("Igbo (Nigeria)"), "NCAIR1/Igbo-ASR");
});

test("routes each ASR language to its dedicated endpoint setting", () => {
  assert.deepEqual(
    ["English", "Nigerian Pidgin", "Hausa", "Yoruba", "Igbo"].map(selectNAtlasAsrLanguage),
    ["nigerianEnglish", "nigerianEnglish", "hausa", "yoruba", "igbo"]
  );
  assert.deepEqual(NATLAS_ASR_ENDPOINT_SETTINGS, {
    yoruba: "natlas_asr_endpoint_yoruba",
    igbo: "natlas_asr_endpoint_igbo",
    hausa: "natlas_asr_endpoint_hausa",
    nigerianEnglish: "natlas_asr_endpoint_english"
  });
});

test("uses Nigerian-accented English ASR when the language is unspecified", () => {
  assert.equal(selectNAtlasAsrModel(), "NCAIR1/NigerianAccentedEnglish");
  assert.equal(selectNAtlasAsrModel("auto"), "NCAIR1/NigerianAccentedEnglish");
});

test("rejects languages without a configured N-ATLAS ASR model", () => {
  assert.throws(
    () => selectNAtlasAsrModel("French"),
    /does not have a configured ASR model/
  );
});
