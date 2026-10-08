const ASR_MODELS = {
  yoruba: 'NCAIR1/Yoruba-ASR',
  igbo: 'NCAIR1/Igbo-ASR',
  hausa: 'NCAIR1/Hausa-ASR',
  nigerianEnglish: 'NCAIR1/NigerianAccentedEnglish'
} as const;

export function selectNAtlasAsrModel(language?: string): string {
  const normalized = (language || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  if (/^(yo|yor|yoruba)(-|$)/.test(normalized)) return ASR_MODELS.yoruba;
  if (/^(ig|ibo|igbo)(-|$)/.test(normalized)) return ASR_MODELS.igbo;
  if (/^(ha|hau|hausa)(-|$)/.test(normalized)) return ASR_MODELS.hausa;
  if (/^(en|eng|english|pcm|pidgin|nigerian pidgin|naija)(-|$)/.test(normalized)) {
    return ASR_MODELS.nigerianEnglish;
  }

  if (!normalized || /^(auto|detect|unknown)$/.test(normalized)) {
    return ASR_MODELS.nigerianEnglish;
  }

  const error = new Error(
    `N-ATLAS transcription does not have a configured ASR model for "${language}". Select Yoruba, Igbo, Hausa, English, or Nigerian Pidgin.`
  );
  Object.assign(error, { statusCode: 400 });
  throw error;
}
