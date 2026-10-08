import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeTelegramBotUrl,
  normalizeWhatsAppBotUrl
} from "./botPublicLinks.js";

test("normalizes Nigerian WhatsApp phone numbers and links", () => {
  assert.equal(normalizeWhatsAppBotUrl("08012345678"), "https://wa.me/2348012345678");
  assert.equal(normalizeWhatsAppBotUrl("+234 801 234 5678"), "https://wa.me/2348012345678");
  assert.equal(
    normalizeWhatsAppBotUrl("https://api.whatsapp.com/send?phone=2348012345678&text=Hello"),
    "https://wa.me/2348012345678?text=Hello"
  );
});

test("rejects invalid or untrusted WhatsApp destinations", () => {
  assert.equal(normalizeWhatsAppBotUrl(""), null);
  assert.equal(normalizeWhatsAppBotUrl("https://example.com/"), null);
  assert.equal(normalizeWhatsAppBotUrl("http://wa.me/2348012345678"), null);
  assert.equal(normalizeWhatsAppBotUrl("123"), null);
});

test("normalizes Telegram bot handles and links", () => {
  assert.equal(normalizeTelegramBotUrl("@SabiRightBot"), "https://t.me/SabiRightBot");
  assert.equal(
    normalizeTelegramBotUrl("https://telegram.me/SabiRightBot?start=help"),
    "https://t.me/SabiRightBot?start=help"
  );
});

test("rejects invalid or untrusted Telegram destinations", () => {
  assert.equal(normalizeTelegramBotUrl(""), null);
  assert.equal(normalizeTelegramBotUrl("@not-a-bot"), null);
  assert.equal(normalizeTelegramBotUrl("https://example.com/SabiRightBot"), null);
  assert.equal(normalizeTelegramBotUrl("http://t.me/SabiRightBot"), null);
});
