import { MAX_TRANSCRIPTION_AUDIO_BYTES } from "../aiService.js";

export async function readLimitedAudioResponse(response: Response, source: string): Promise<Buffer> {
  if (!response.ok) {
    throw new Error(`${source} returned HTTP ${response.status}`);
  }

  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_TRANSCRIPTION_AUDIO_BYTES) {
    throw new Error('Audio exceeds the 8 MB transcription limit');
  }
  if (!response.body) {
    throw new Error(`${source} returned an empty response`);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalLength += value.byteLength;
    if (totalLength > MAX_TRANSCRIPTION_AUDIO_BYTES) {
      await reader.cancel();
      throw new Error('Audio exceeds the 8 MB transcription limit');
    }
    chunks.push(value);
  }

  if (totalLength === 0) {
    throw new Error(`${source} returned an empty audio file`);
  }
  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)), totalLength);
}
