import { spawn } from "node:child_process";
import ffmpegPackage from "ffmpeg-static";
import { supabaseStorage as storage } from "./supabaseStorage.js";
import { selectNAtlasAsrModel } from "./natlasAsrModels.js";

const NATLAS_REQUEST_TIMEOUT_MS = 25_000;
const NATLAS_ASR_REQUEST_TIMEOUT_MS = 50_000;
const NATLAS_ASR_TRANSCODE_TIMEOUT_MS = 15_000;
const AI_PROVIDER_TIMEOUT_MS = 20_000;
const GROQ_MODEL_TIMEOUT_MS = 8_000;
const FAST_BOT_AI_BUDGET_MS = 7_000;
const FAST_BOT_NATLAS_BUDGET_MS = 3_000;
const FAST_BOT_MAX_OUTPUT_TOKENS = 768;
const DEFAULT_NATLAS_ENDPOINT = 'https://router.huggingface.co/v1/chat/completions';
const DEFAULT_NATLAS_ASR_ENDPOINT = 'https://router.huggingface.co/hf-inference/models';
export const MAX_TRANSCRIPTION_AUDIO_BYTES = 8 * 1024 * 1024;
const ffmpegPath: string | null = typeof ffmpegPackage === 'string'
  ? ffmpegPackage
  : ffmpegPackage.default;

function createTranscriptionError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}

function transcodeAudioToNAtlasWav(audio: Buffer): Promise<Buffer> {
  if (!ffmpegPath) {
    return Promise.reject(createTranscriptionError(
      'N-ATLAS audio conversion is unavailable on this server.',
      503
    ));
  }

  return new Promise((resolve, reject) => {
    const converter = spawn(ffmpegPath, [
      '-hide_banner',
      '-loglevel', 'error',
      '-i', 'pipe:0',
      '-vn',
      '-ac', '1',
      '-ar', '16000',
      '-acodec', 'pcm_s16le',
      '-f', 's16le',
      'pipe:1'
    ], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'] as const
    });
    const chunks: Buffer[] = [];
    let outputBytes = 0;
    let stderr = '';
    let settled = false;

    const timeout = setTimeout(() => {
      fail(createTranscriptionError('Audio conversion timed out.', 504));
    }, NATLAS_ASR_TRANSCODE_TIMEOUT_MS);

    function fail(error: Error & { statusCode?: number }) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (converter.exitCode === null) converter.kill();
      reject(error);
    }

    converter.once('error', (error) => {
      console.error('[Transcribe] FFmpeg could not start:', error.message);
      fail(createTranscriptionError('Audio conversion is unavailable on the server.', 503));
    });
    converter.stderr.on('data', (chunk: Buffer) => {
      if (stderr.length < 1000) stderr += chunk.toString().slice(0, 1000 - stderr.length);
    });
    converter.stdout.on('data', (chunk: Buffer) => {
      outputBytes += chunk.length;
      if (outputBytes + 44 > MAX_TRANSCRIPTION_AUDIO_BYTES) {
        fail(createTranscriptionError('Converted audio exceeds the 8 MB transcription limit.', 413));
        return;
      }
      chunks.push(chunk);
    });
    converter.stdin.once('error', (error) => {
      if (!settled && error.message !== 'write EPIPE') {
        fail(createTranscriptionError('Audio input could not be read.', 422));
      }
    });
    converter.once('close', (code) => {
      if (settled) return;
      clearTimeout(timeout);
      if (code !== 0 || outputBytes === 0) {
        settled = true;
        console.error('[Transcribe] FFmpeg could not normalize audio:', stderr.trim() || `exit code ${code}`);
        reject(createTranscriptionError('This recording could not be decoded. Please record it again and retry.', 422));
        return;
      }

      const pcm = Buffer.concat(chunks, outputBytes);
      const wav = Buffer.alloc(44);
      wav.write('RIFF', 0);
      wav.writeUInt32LE(pcm.length + 36, 4);
      wav.write('WAVE', 8);
      wav.write('fmt ', 12);
      wav.writeUInt32LE(16, 16);
      wav.writeUInt16LE(1, 20);
      wav.writeUInt16LE(1, 22);
      wav.writeUInt32LE(16000, 24);
      wav.writeUInt32LE(32000, 28);
      wav.writeUInt16LE(2, 32);
      wav.writeUInt16LE(16, 34);
      wav.write('data', 36);
      wav.writeUInt32LE(pcm.length, 40);
      settled = true;
      resolve(Buffer.concat([wav, pcm]));
    });
    converter.stdin.end(audio);
  });
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, stage: string): Promise<T> {
  if (timeoutMs <= 0) throw new Error(`AI response budget exhausted before ${stage}`);

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`${stage} exceeded ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function fetchAIProvider(
  url: string,
  init: RequestInit,
  timeoutMs = AI_PROVIDER_TIMEOUT_MS
): Promise<Response> {
  const startedAt = Date.now();
  try {
    return await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    const errorType = error instanceof Error ? error.name : 'UnknownError';
    console.warn(`[aiService] Provider request failed after ${Date.now() - startedAt}ms (type=${errorType})`);
    throw error;
  }
}

async function generateGroqResponse(
  prompt: string,
  apiKey: string,
  timeoutMs = AI_PROVIDER_TIMEOUT_MS,
  maxOutputTokens = 2048
): Promise<string | null> {
  const candidateModels = timeoutMs < AI_PROVIDER_TIMEOUT_MS
    ? ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'llama-3.3-70b-versatile']
    : ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile'];
  const deadline = Date.now() + timeoutMs;
  let lastError = '';

  for (const model of candidateModels) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) break;

    try {
      const response = await fetchAIProvider(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.6,
            max_tokens: maxOutputTokens
          })
        },
        Math.min(GROQ_MODEL_TIMEOUT_MS, remainingMs)
      );

      if (response.ok) {
        const data = await response.json() as any;
        const text = data?.choices?.[0]?.message?.content;
        if (typeof text === 'string' && text.trim()) return text;
        lastError = `${model} returned no text`;
      } else {
        lastError = `${model} returned ${response.status}: ${(await response.text()).slice(0, 300)}`;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  if (lastError) throw new Error(`Groq error across candidate models: ${lastError}`);
  return null;
}

export async function isNAtlasSovereignMode(): Promise<boolean> {
  const setting = await storage.getAdminSetting('ai_mode');
  return (setting?.value || 'natlas_sovereign').trim().toLowerCase() === 'natlas_sovereign';
}

/**
 * Retrieves and formats relevant admin-managed MOAT entries for the given user prompt.
 */
export async function getRelevantMoatContext(userPrompt: string): Promise<string> {
  try {
    const moatData = await storage.getMoatData();
    if (!moatData || moatData.length === 0) return '';

    const cleanTokens = userPrompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['what', 'when', 'where', 'which', 'who', 'how', 'the', 'and', 'for', 'with', 'that', 'this'].includes(w));

    const scored = moatData.map(item => {
      const corpus = `${item.title || ''} ${item.category || ''} ${item.content || ''}`.toLowerCase();
      let matchCount = 0;
      for (const token of cleanTokens) {
        if (corpus.includes(token)) matchCount++;
      }
      return { item, score: matchCount };
    });

    const relevant = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(s => s.item);

    const chosen = relevant;
    if (chosen.length === 0) return '';

    let context = "\n\n[ADMIN-MANAGED LEGAL REFERENCE MATERIAL]\n";
    context += "These entries are administrator-managed and have not been independently verified by this application. Use only relevant entries. Do not treat them as conclusive legal authority, infer missing details, or invent statutes, section numbers, quotations, or citations. Cite a legal source only when the entry itself provides enough information to support it. If the material does not support an answer, say that you cannot verify the point and recommend checking an authoritative source or consulting qualified counsel.\n\n";
    for (const entry of chosen) {
      context += `• **${entry.title}** (${entry.category || 'Reference'}):\n  ${entry.content}\n  Source field: ${entry.source || 'Not specified'}\n\n`;
    }
    context += "[END ADMINISTRATIVE MOAT CONTEXT]\n\n";
    return context;
  } catch (err) {
    console.warn('[aiService] Failed to retrieve MOAT context:', err);
    return '';
  }
}

/**
 * Calls Nigeria's Sovereign LLM: N-ATLAS (NCAIR1/N-ATLaS fine-tuned on Llama-3 8B)
 * Supports the Hugging Face chat-completion API and custom OpenAI-compatible endpoints.
 */
export async function generateNAtlasResponse(
  prompt: string,
  timeoutMs = NATLAS_REQUEST_TIMEOUT_MS
): Promise<string | null> {
  const [tokenSetting, huggingFaceSetting, endpointSetting, modelIdSetting] = await Promise.all([
    storage.getAdminSetting('natlas_api_token'),
    storage.getAdminSetting('huggingface_api_key'),
    storage.getAdminSetting('natlas_api_endpoint'),
    storage.getAdminSetting('natlas_model_id')
  ]);
  const effectiveTokenSetting = tokenSetting || huggingFaceSetting;
  const token = effectiveTokenSetting?.value || process.env.NATLAS_API_TOKEN || process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;

  const endpoint = endpointSetting?.value?.trim() || DEFAULT_NATLAS_ENDPOINT;
  const modelId = modelIdSetting?.value?.trim() || 'NCAIR1/N-ATLaS';
  const requestTimeoutMs = Math.max(1, Math.min(timeoutMs, NATLAS_REQUEST_TIMEOUT_MS));
  const maxOutputTokens = timeoutMs < NATLAS_REQUEST_TIMEOUT_MS ? FAST_BOT_MAX_OUTPUT_TOKENS : 1024;

  if (!token) {
    throw new Error('N-ATLAS API token not configured. Please set natlas_api_token in Admin Settings or provide HuggingFace token.');
  }

  // Handle Hugging Face's router and custom OpenAI-compatible endpoints.
  if (endpoint.includes('/v1/chat/completions') || endpoint.includes('/chat/completions')) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: 'system',
            content: 'You are N-ATLAS, a multilingual language model powering SabiRight. Respond in the requested language. Legal reference material may be incomplete or unverified; do not invent legal citations, statutory wording, or legal conclusions. State uncertainty when reliable support is not provided, and recommend checking current authoritative sources or consulting qualified counsel.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: maxOutputTokens
      }),
      signal: AbortSignal.timeout(requestTimeoutMs)
    });
    if (!res.ok) {
      const errText = (await res.text()).slice(0, 500);
      throw new Error(`N-ATLAS custom endpoint error (${res.status}): ${errText}`);
    }
    const data = await res.json() as any;
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('N-ATLAS chat endpoint returned no text content');
    }
    return content.trim();
  }

  // Keep the model ID setting authoritative for Hugging Face's legacy model endpoint.
  const inferenceUrl = new URL(endpoint);
  if (inferenceUrl.hostname === 'api-inference.huggingface.co' && inferenceUrl.pathname.startsWith('/models/')) {
    inferenceUrl.pathname = `/models/${modelId.split('/').map(encodeURIComponent).join('/')}`;
  }

  // Hugging Face model inference endpoint
  const response = await fetch(inferenceUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: maxOutputTokens,
        return_full_text: false,
        temperature: 0.6,
        top_p: 0.9
      },
      options: {
        wait_for_model: true
      }
    }),
    signal: AbortSignal.timeout(requestTimeoutMs)
  });

  if (!response.ok) {
    const errorBody = (await response.text()).slice(0, 500);
    throw new Error(`N-ATLAS HF error (${response.status}): ${errorBody}`);
  }

  const data = await response.json() as any;
  const generatedText = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
  if (typeof generatedText === 'string' && generatedText.trim()) {
    return generatedText.trim();
  }
  throw new Error('N-ATLAS inference endpoint returned no generated text');
}

export async function transcribeAudio(
  audio: Buffer,
  mimeType = 'audio/mp4',
  language?: string
): Promise<{ text: string; engine: string }> {
  if (!Buffer.isBuffer(audio) || audio.length === 0) {
    throw new Error('Audio data is empty or invalid');
  }
  if (audio.length > MAX_TRANSCRIPTION_AUDIO_BYTES) {
    const error = new Error('Audio exceeds the 8 MB transcription limit');
    Object.assign(error, { statusCode: 413 });
    throw error;
  }

  const contentType = mimeType.split(';', 1)[0].trim().toLowerCase();
  if (!contentType.startsWith('audio/')) {
    const error = new Error('Unsupported audio content type');
    Object.assign(error, { statusCode: 415 });
    throw error;
  }

  const sovereignMode = await isNAtlasSovereignMode();
  if (sovereignMode) {
    const modelId = selectNAtlasAsrModel(language);
    const tokenSetting = await storage.getAdminSetting('natlas_api_token')
      || await storage.getAdminSetting('huggingface_api_key');
    const token = tokenSetting?.value
      || process.env.NATLAS_API_TOKEN
      || process.env.HUGGINGFACE_API_KEY
      || process.env.HF_TOKEN;
    if (!token) {
      const error = new Error(
        'N-ATLAS transcription requires a Hugging Face access token. Configure natlas_api_token in Admin Settings or set HF_TOKEN.'
      );
      Object.assign(error, { statusCode: 503 });
      throw error;
    }

    const normalizedAudio = await transcodeAudioToNAtlasWav(audio);
    const asrSetting = await storage.getAdminSetting('natlas_asr_endpoint');
    const configuredEndpoint = asrSetting?.value?.trim();
    const endpoint = configuredEndpoint
      ? configuredEndpoint.replaceAll('{model}', modelId)
      : `${DEFAULT_NATLAS_ASR_ENDPOINT}/${modelId.split('/').map(encodeURIComponent).join('/')}`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'audio/wav'
        },
        body: normalizedAudio,
        signal: AbortSignal.timeout(NATLAS_ASR_REQUEST_TIMEOUT_MS)
      });
    } catch (requestError: any) {
      console.error('[Transcribe] N-ATLAS ASR request failed:', requestError.message || requestError);
      const error = new Error('N-ATLAS speech recognition could not be reached. Please try again.');
      Object.assign(error, { statusCode: 502 });
      throw error;
    }

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      console.error(`[Transcribe] N-ATLAS ASR ${modelId} returned ${response.status}: ${detail}`);
      const message = response.status === 401 || response.status === 403
        ? `N-ATLAS ASR access was denied for ${modelId}. Check the Hugging Face token and accept the model's access terms.`
        : response.status === 503
          ? `N-ATLAS ASR model ${modelId} is loading or unavailable. Please retry shortly.`
          : `N-ATLAS speech recognition failed (${response.status}). Please try again.`;
      const error = new Error(message);
      Object.assign(error, { statusCode: response.status === 401 || response.status === 403 ? 503 : 502 });
      throw error;
    }

    const data = await response.json() as any;
    const transcript = data?.text ?? data?.transcript ?? (Array.isArray(data) ? data[0]?.text : undefined);
    if (typeof transcript !== 'string') {
      const error = new Error('N-ATLAS ASR returned no transcript. Check the configured speech endpoint response format.');
      Object.assign(error, { statusCode: 502 });
      throw error;
    }
    return { text: transcript.trim(), engine: modelId };
  }

  const asrSetting = sovereignMode ? await storage.getAdminSetting('natlas_asr_endpoint') : null;
  const tokenSetting = sovereignMode
    ? await storage.getAdminSetting('natlas_api_token') || await storage.getAdminSetting('huggingface_api_key')
    : null;
  const asrEndpoint = asrSetting?.value?.trim();
  const asrToken = tokenSetting?.value
    || process.env.NATLAS_API_TOKEN
    || process.env.HUGGINGFACE_API_KEY
    || process.env.HF_TOKEN;
  let configuredServiceFailed = false;

  if (sovereignMode && asrEndpoint && asrToken) {
    try {
      const response = await fetch(asrEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${asrToken}`,
          'Content-Type': contentType
        },
        body: audio,
        signal: AbortSignal.timeout(NATLAS_REQUEST_TIMEOUT_MS)
      });

      if (response.ok) {
        const data = await response.json() as any;
        const transcript = data?.text ?? data?.transcript ?? (Array.isArray(data) ? data[0]?.text : undefined);
        if (typeof transcript === 'string') {
          return { text: transcript.trim(), engine: 'Configured Speech-to-Text' };
        }
        configuredServiceFailed = true;
        console.warn('[Transcribe] Configured speech-to-text endpoint returned no transcript field');
      } else {
        configuredServiceFailed = true;
        const detail = (await response.text()).slice(0, 300);
        console.warn(`[Transcribe] Configured speech-to-text endpoint returned ${response.status}: ${detail}`);
      }
    } catch (error: any) {
      configuredServiceFailed = true;
      console.warn('[Transcribe] Configured speech-to-text request failed:', error.message || error);
    }
  }

  const geminiKeySetting = await storage.getAdminSetting('google_gemini_api_key');
  const geminiKey = geminiKeySetting?.value
    || process.env.GEMINI_API_KEY
    || process.env.GOOGLE_GENAI_API_KEY;
  if (!geminiKey) {
    const error = new Error(configuredServiceFailed
      ? 'Configured speech-to-text failed and Multi-Model mode has no valid Gemini fallback.'
      : 'Multi-Model voice transcription requires a valid Gemini API key.');
    Object.assign(error, { statusCode: configuredServiceFailed ? 502 : 503 });
    throw error;
  }

  const requestedLanguage = language?.trim().slice(0, 80);
  const languageInstruction = requestedLanguage && requestedLanguage.toLowerCase() !== 'english'
    ? ` The speaker may be speaking ${requestedLanguage}; preserve the language spoken.`
    : '';
  const audioBase64 = audio.toString('base64');
  const payload = JSON.stringify({
    contents: [{
      parts: [
        {
          text: `Transcribe this audio exactly as spoken. Nigerian accents and Nigerian languages are common.${languageInstruction} Detect the language from the audio when possible. Return only the transcript text, nothing else. If there is no speech, return an empty string.`
        },
        { inline_data: { mime_type: contentType, data: audioBase64 } }
      ]
    }]
  });

  let response: Response | null = null;
  let lastError = '';
  for (const model of ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']) {
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          signal: AbortSignal.timeout(NATLAS_REQUEST_TIMEOUT_MS)
        }
      );
      if (response.ok) break;
      lastError = (await response.text()).slice(0, 300);
      console.warn(`[Transcribe] Gemini ${model} returned ${response.status}: ${lastError}`);
      if (/API_KEY_INVALID|API key not valid|invalid api key/i.test(lastError)) break;
      if (response.status !== 404 && response.status !== 400) break;
    } catch (error: any) {
      lastError = error.message || String(error);
      console.warn(`[Transcribe] Gemini ${model} request failed:`, lastError);
      break;
    }
  }

  if (!response?.ok) {
    const invalidKey = /API_KEY_INVALID|API key not valid|invalid api key/i.test(lastError);
    const error = new Error(invalidKey
      ? 'Gemini rejected the configured API key. Check google_gemini_api_key in Admin Settings.'
      : `Gemini speech transcription failed${lastError ? `: ${lastError}` : ''}`);
    Object.assign(error, { statusCode: invalidKey ? 503 : 502 });
    throw error;
  }

  const result = await response.json() as any;
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') {
    const error = new Error('Speech provider returned an invalid transcript');
    Object.assign(error, { statusCode: 502 });
    throw error;
  }
  return { text: text.trim(), engine: 'Gemini Flash Multilingual' };
}

/**
 * Unified multi-provider AI text generation service for SabiRight.
 * Supports:
 * - Mode 1: Sovereign N-ATLAS (NAIC Challenge Mode - primary N-ATLAS with automatic resilience fallbacks)
 * - Mode 2: Multi-Model Enterprise Grid (Standard production mode with admin provider selection)
 */
export async function generateAIResponse(
  prompt: string,
  skipMoatGrounding = false,
  options: { maxLatencyMs?: number } = {}
): Promise<string | null> {
  const deadline = options.maxLatencyMs
    ? Date.now() + Math.min(options.maxLatencyMs, FAST_BOT_AI_BUDGET_MS)
    : undefined;
  const remainingMs = (stage: string): number => {
    if (deadline === undefined) return AI_PROVIDER_TIMEOUT_MS;
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error(`AI response budget exhausted before ${stage}`);
    return remaining;
  };
  const getAISetting = (key: string) => {
    const setting = storage.getAdminSetting(key);
    return deadline === undefined
      ? setting
      : withTimeout(setting, remainingMs(`loading ${key}`), `Loading ${key}`);
  };

  let effectivePrompt = prompt;
  if (!skipMoatGrounding) {
    let moatContext = '';
    if (deadline === undefined) {
      moatContext = await getRelevantMoatContext(prompt);
    } else {
      try {
        moatContext = await withTimeout(
          getRelevantMoatContext(prompt),
          Math.min(1_000, remainingMs('MOAT context')),
          'MOAT context lookup'
        );
      } catch (error) {
        console.warn('[aiService] Skipping slow MOAT context lookup for time-bounded bot response:', error);
      }
    }
    if (moatContext && !prompt.includes('[ADMIN-MANAGED LEGAL REFERENCE MATERIAL]')) {
      effectivePrompt = `${moatContext}\n${prompt}`;
    }
  }

  // Check if system is set to Sovereign N-ATLAS Mode (NITDA NAIC Challenge)
  let sovereignMode: boolean;
  let configuredProvider: string;
  if (deadline === undefined) {
    sovereignMode = await isNAtlasSovereignMode();
    configuredProvider = '';
  } else {
    const [modeSetting, primaryAISetting] = await withTimeout(
      Promise.all([
        storage.getAdminSetting('ai_mode'),
        storage.getAdminSetting('ai_provider')
      ]),
      remainingMs('AI provider settings'),
      'AI provider settings lookup'
    );
    sovereignMode = (modeSetting?.value || 'natlas_sovereign').trim().toLowerCase() === 'natlas_sovereign';
    configuredProvider = (primaryAISetting?.value || 'google').toLowerCase();
  }

  if (sovereignMode) {
    try {
      console.log('[aiService] 🇳🇬 Sovereign Mode Active: Routing prompt to N-ATLAS (NCAIR1/N-ATLaS)...');
      const natlasTimeoutMs = deadline === undefined
        ? NATLAS_REQUEST_TIMEOUT_MS
        : Math.min(FAST_BOT_NATLAS_BUDGET_MS, remainingMs('N-ATLAS request'));
      const natlasResponse = await withTimeout(
        generateNAtlasResponse(effectivePrompt, natlasTimeoutMs),
        natlasTimeoutMs,
        'N-ATLAS response'
      );
      if (natlasResponse && natlasResponse.trim()) {
        return natlasResponse;
      }
    } catch (natlasErr: any) {
      console.warn(`[aiService] ⚠️ N-ATLAS notice (${natlasErr.message}). Automatically invoking resilient fallback...`);
    }
    // If N-ATLAS encountered cold-start or error, proceed seamlessly to fallback provider below
  }
  if (deadline === undefined) {
    const primaryAISetting = await storage.getAdminSetting('ai_provider');
    configuredProvider = (primaryAISetting?.value || 'google').toLowerCase();
  }
  const provider = configuredProvider === 'natlas' && sovereignMode ? 'google' : configuredProvider;

  if (provider === 'natlas') {
    const natlasTimeoutMs = deadline === undefined
      ? NATLAS_REQUEST_TIMEOUT_MS
      : remainingMs('N-ATLAS provider request');
    return await withTimeout(
      generateNAtlasResponse(effectivePrompt, natlasTimeoutMs),
      natlasTimeoutMs,
      'N-ATLAS provider response'
    );
  } else if (provider === 'openai') {
    const apiKeySetting = await getAISetting('openai_api_key');
    const apiKey = apiKeySetting?.value || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetchAIProvider('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: effectivePrompt }],
        temperature: 0.7,
        ...(deadline === undefined ? {} : { max_tokens: FAST_BOT_MAX_OUTPUT_TOKENS })
      })
    }, remainingMs('OpenAI request'));

    if (!response.ok) {
      if (response.status === 429) {
        const err = new Error('AI service is temporarily busy (rate limit exceeded). Please try again in a few moments.');
        (err as any).status = 429;
        throw err;
      }
      const errorBody = await response.text();
      throw new Error(`OpenAI error: ${response.status} ${errorBody}`);
    }

    const data = await response.json() as any;
    return data?.choices?.[0]?.message?.content || null;
  } else if (provider === 'anthropic') {
    const apiKeySetting = await getAISetting('anthropic_api_key');
    const apiKey = apiKeySetting?.value || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetchAIProvider('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: deadline === undefined ? 2048 : FAST_BOT_MAX_OUTPUT_TOKENS,
        messages: [{ role: 'user', content: effectivePrompt }]
      })
    }, remainingMs('Anthropic request'));

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Anthropic error: ${response.status} ${errorBody}`);
    }

    const data = await response.json() as any;
    return data?.content?.[0]?.text || null;
  } else if (provider === 'groq') {
    const apiKeySetting = await getAISetting('groq_api_key');
    const apiKey = apiKeySetting?.value || process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    return await generateGroqResponse(
      effectivePrompt,
      apiKey,
      remainingMs('Groq request'),
      deadline === undefined ? 2048 : FAST_BOT_MAX_OUTPUT_TOKENS
    );
  } else if (provider === 'deepseek') {
    const apiKeySetting = await getAISetting('deepseek_api_key');
    const apiKey = apiKeySetting?.value || process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const response = await fetchAIProvider('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: effectivePrompt }],
        temperature: 0.7,
        ...(deadline === undefined ? {} : { max_tokens: FAST_BOT_MAX_OUTPUT_TOKENS })
      })
    }, remainingMs('DeepSeek request'));

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`DeepSeek error: ${response.status} ${errorBody}`);
    }

    const data = await response.json() as any;
    return data?.choices?.[0]?.message?.content || null;
  } else if (provider === 'openrouter') {
    const apiKeySetting = await getAISetting('openrouter_api_key');
    const apiKey = apiKeySetting?.value || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetchAIProvider('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://sabiright.com',
        'X-Title': 'SabiRight AI'
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [{ role: 'user', content: effectivePrompt }],
        ...(deadline === undefined ? {} : { max_tokens: FAST_BOT_MAX_OUTPUT_TOKENS })
      })
    }, remainingMs('OpenRouter request'));

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenRouter error: ${response.status} ${errorBody}`);
    }

    const data = await response.json() as any;
    return data?.choices?.[0]?.message?.content || null;
  } else if (provider === 'perplexity') {
    const apiKeySetting = await getAISetting('perplexity_api_key');
    const apiKey = apiKeySetting?.value || process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const response = await fetchAIProvider('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: effectivePrompt }],
        ...(deadline === undefined ? {} : { max_tokens: FAST_BOT_MAX_OUTPUT_TOKENS })
      })
    }, remainingMs('Perplexity request'));

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Perplexity error: ${response.status} ${errorBody}`);
    }

    const data = await response.json() as any;
    return data?.choices?.[0]?.message?.content || null;
  } else if (provider === 'mistral') {
    const apiKeySetting = await getAISetting('mistral_api_key');
    const apiKey = apiKeySetting?.value || process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      throw new Error('Mistral API key not configured');
    }

    const response = await fetchAIProvider('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-tiny',
        messages: [{ role: 'user', content: effectivePrompt }],
        ...(deadline === undefined ? {} : { max_tokens: FAST_BOT_MAX_OUTPUT_TOKENS })
      })
    }, remainingMs('Mistral request'));

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Mistral error: ${response.status} ${errorBody}`);
    }

    const data = await response.json() as any;
    return data?.choices?.[0]?.message?.content || null;
  } else if (provider === 'huggingface') {
    const apiKeySetting = await getAISetting('huggingface_api_key');
    const apiKey = apiKeySetting?.value || process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
      throw new Error('HuggingFace API key not configured');
    }

    const response = await fetchAIProvider('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        inputs: effectivePrompt,
        parameters: {
          max_new_tokens: deadline === undefined ? 1024 : FAST_BOT_MAX_OUTPUT_TOKENS,
          return_full_text: false,
          temperature: 0.7
        }
      })
    }, remainingMs('Hugging Face request'));

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HuggingFace error: ${response.status} ${errorBody}`);
    }

    const data = await response.json() as any;
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text;
    }
    return typeof data === 'string' ? data : JSON.stringify(data);
  } else {
    // Default to Gemini (google) if key exists
    const apiKeySetting = await getAISetting('google_gemini_api_key');
    const apiKey = apiKeySetting?.value || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

    // If Gemini is not configured, check if Groq key is present as automatic smart fallback
    if (!apiKey) {
      const groqSetting = await getAISetting('groq_api_key');
      const groqKey = groqSetting?.value || process.env.GROQ_API_KEY;
      if (groqKey) {
        return await generateGroqResponse(
          effectivePrompt,
          groqKey,
          remainingMs('Groq fallback request'),
          deadline === undefined ? 2048 : FAST_BOT_MAX_OUTPUT_TOKENS
        );
      }
      throw new Error('Gemini API key not configured, and no fallback AI provider available');
    }

    // Use gemini-2.0-flash with v1beta endpoint for stability and modern features
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const response = await fetchAIProvider(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: effectivePrompt }]
        }],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: deadline === undefined ? 2048 : FAST_BOT_MAX_OUTPUT_TOKENS,
        }
      })
    }, remainingMs('Gemini request'));

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn(`Gemini API Error (${response.status}): ${errorBody}. Attempting fallback to Groq...`);

      const groqSetting = await getAISetting('groq_api_key');
      const groqKey = groqSetting?.value || process.env.GROQ_API_KEY;
      if (groqKey) {
        try {
          const groqResponse = await generateGroqResponse(
            effectivePrompt,
            groqKey,
            remainingMs('Groq fallback request'),
            deadline === undefined ? 2048 : FAST_BOT_MAX_OUTPUT_TOKENS
          );
          if (groqResponse) return groqResponse;
        } catch (groqError) {
          console.warn('[aiService] Groq fallback failed after Gemini returned an error:', groqError);
        }
      }
      
      if (response.status === 429) {
        const err = new Error('AI Service Busy. Please try again in a moment.');
        (err as any).status = 429;
        throw err;
      }
      if (response.status === 503) {
        const err = new Error('AI service is temporarily unavailable. Please try again in a few moments.');
        (err as any).status = 503;
        throw err;
      }
      throw new Error(`Gemini error: ${response.status} ${errorBody}`);
    }

    const data = await response.json() as any;
    
    // Handle the case where the response might be blocked or empty
    if (data.promptFeedback?.blockReason) {
      return "⚠️ My response was blocked by safety filters.";
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.warn('Empty Gemini response data:', JSON.stringify(data));
      return "I couldn't generate a response. Please try again.";
    }
    
    return text;
  }
}
