import assert from "node:assert/strict";
import test from "node:test";
import { selectNAtlasAsrModel } from "./natlasAsrModels.js";

test("selects language-specific N-ATLAS ASR models", () => {
  assert.equal(selectNAtlasAsrModel("Yorùbá"), "NCAIR1/Yoruba-ASR");
  assert.equal(selectNAtlasAsrModel("ig"), "NCAIR1/Igbo-ASR");
  assert.equal(selectNAtlasAsrModel("Hausa"), "NCAIR1/Hausa-ASR");
  assert.equal(selectNAtlasAsrModel("English"), "NCAIR1/NigerianAccentedEnglish");
  assert.equal(selectNAtlasAsrModel("Nigerian Pidgin"), "NCAIR1/NigerianAccentedEnglish");
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
