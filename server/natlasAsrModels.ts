const ASR_MODELS = {
  yoruba: 'NCAIR1/Yoruba-ASR',
  igbo: 'NCAIR1/Igbo-ASR',
  hausa: 'NCAIR1/Hausa-ASR',
  nigerianEnglish: 'NCAIR1/NigerianAccentedEnglish'
} as const;

export const NATLAS_ASR_ENDPOINT_SETTINGS = {
  yoruba: 'natlas_asr_endpoint_yoruba',
  igbo: 'natlas_asr_endpoint_igbo',
  hausa: 'natlas_asr_endpoint_hausa',
  nigerianEnglish: 'natlas_asr_endpoint_english'
} as const;

export type NAtlasAsrLanguage = keyof typeof NATLAS_ASR_ENDPOINT_SETTINGS;

export function selectNAtlasAsrLanguage(language?: string): NAtlasAsrLanguage {
  const normalized = (language || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  if (/^(yo|yor|yoruba)(?:$|[-_\s(])/.test(normalized)) return 'yoruba';
  if (/^(ig|ibo|igbo)(?:$|[-_\s(])/.test(normalized)) return 'igbo';
  if (/^(ha|hau|hausa)(?:$|[-_\s(])/.test(normalized)) return 'hausa';
  if (/^(en|eng|english|pcm|pidgin|nigerian pidgin|naija)(?:$|[-_\s(])/.test(normalized)) {
    return 'nigerianEnglish';
  }

  if (!normalized || /^(auto(?:-detect)?|detect|unknown)$/.test(normalized)) {
    return 'nigerianEnglish';
  }

  const error = new Error(
    `N-ATLAS transcription does not have a configured ASR model for "${language}". Select Yoruba, Igbo, Hausa, English, or Nigerian Pidgin.`
  );
  Object.assign(error, { statusCode: 400 });
  throw error;
}

export function selectNAtlasAsrModel(language?: string): string {
  const asrLanguage = selectNAtlasAsrLanguage(language);
  return asrLanguage === 'nigerianEnglish' ? ASR_MODELS.nigerianEnglish : ASR_MODELS[asrLanguage];
}
