import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { PDFParse } from 'pdf-parse';

const SOURCE_DIRECTORY = process.env.LEGAL_PDF_DIR || 'C:\\Users\\ekpou\\Downloads';
const POLICE_OCR_PATH = path.join(process.cwd(), 'Police-Act-2020.txt');
const CHUNK_SIZE = 2400;
const CHUNK_OVERLAP = 180;
const UPLOAD_BATCH_SIZE = 100;

const documents = [
  {
    filename: 'constitution.pdf',
    title: 'Constitution of the Federal Republic of Nigeria, 1999',
    minimumCharacters: 250_000
  },
  {
    filename: 'Police-Act-2020.pdf',
    title: 'Nigeria Police Act, 2020',
    minimumCharacters: 100_000,
    ocr: true
  },
  {
    filename: 'Tenancy-Law-2011.pdf',
    title: 'Lagos State Tenancy Law, 2011',
    minimumCharacters: 20_000
  },
  {
    filename: 'COMPANIES AND ALLIED MATTERS ACT.pdf',
    title: 'Companies and Allied Matters Act',
    minimumCharacters: 500_000
  },
  {
    filename: 'Nigeria-Tax-Act-2025.pdf',
    title: 'Nigeria Tax Administration Act, 2025',
    minimumCharacters: 150_000
  }
] as const;

export function splitIntoChunks(text: string, maxLength = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const normalized = text.replace(/\r\n?/g, '\n').trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const limit = Math.min(start + maxLength, normalized.length);
    let end = limit;
    if (limit < normalized.length) {
      const minimumBoundary = start + Math.floor(maxLength * 0.6);
      const lineBreak = normalized.lastIndexOf('\n', limit);
      const sentenceBreak = normalized.lastIndexOf('. ', limit);
      const boundary = Math.max(lineBreak, sentenceBreak);
      if (boundary >= minimumBoundary) end = boundary + (boundary === sentenceBreak ? 1 : 0);
    }

    const chunk = normalized.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= normalized.length) break;

    const nextStart = Math.max(start + 1, end - overlap);
    const nextWord = normalized.indexOf(' ', nextStart);
    start = nextWord >= 0 && nextWord < end ? nextWord + 1 : nextStart;
  }
  return chunks;
}

function extractPoliceOcrPages(text: string): Array<{ pageNumber: number; printedPage?: string; text: string }> {
  if (!/NIGERIA POLICE ACT, 2020/i.test(text)) {
    throw new Error('Police Act OCR text does not identify itself as the Nigeria Police Act, 2020.');
  }
  const markers = [...text.matchAll(/^\s*--\s*(\d+)\s+of\s+\d+\s*--\s*$/gm)];
  if (markers.length < 50) {
    throw new Error(`Police Act OCR text has only ${markers.length} page markers; refusing incomplete text.`);
  }

  return markers.map((marker, index) => {
    const start = marker.index! + marker[0].length;
    const end = markers[index + 1]?.index ?? text.length;
    const pageText = text.slice(start, end).trim();
    const printedNumber = pageText.match(/\bA\s*(\d{2,3})\b/);
    return {
      pageNumber: Number(marker[1]),
      printedPage: printedNumber ? `A${printedNumber[1]}` : undefined,
      text: pageText
    };
  }).filter(page => page.text.length > 0);
}

async function extractPdfPages(filePath: string): Promise<Array<{ pageNumber: number; text: string }>> {
  const parser = new PDFParse({ data: await readFile(filePath) });
  try {
    const result = await parser.getText();
    return result.pages.map(page => ({ pageNumber: page.num, text: page.text }));
  } finally {
    await parser.destroy();
  }
}

async function buildChunks() {
  const output: Array<Record<string, unknown>> = [];
  const counts: Array<{ title: string; pages: number; characters: number; chunks: number }> = [];

  for (const document of documents) {
    const pdfPath = path.join(SOURCE_DIRECTORY, document.filename);
    const pdf = await readFile(pdfPath);
    const pdfHash = createHash('sha256').update(pdf).digest('hex');
    const pages = document.ocr
      ? extractPoliceOcrPages(await readFile(POLICE_OCR_PATH, 'utf8'))
      : await extractPdfPages(pdfPath);
    const characterCount = pages.reduce((total, page) => total + page.text.length, 0);
    if (characterCount < document.minimumCharacters) {
      throw new Error(`${document.filename} yielded only ${characterCount} text characters; refusing incomplete ingestion.`);
    }

    let chunkIndex = 0;
    for (const page of pages) {
      const chunks = splitIntoChunks(page.text);
      for (let pageChunkIndex = 0; pageChunkIndex < chunks.length; pageChunkIndex++) {
        const content = chunks[pageChunkIndex];
        chunkIndex++;
        const pageReference = document.ocr
          ? `OCR text page ${page.pageNumber}${page.printedPage ? `, Gazette page ${page.printedPage}` : ''}`
          : `PDF page ${page.pageNumber}`;
        const source = document.ocr
          ? `${document.title} — ${pageReference}; scan-page mapping unavailable`
          : `${document.title} — ${pageReference}`;
        output.push({
          id: `legal-${document.filename.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-p${page.pageNumber}-c${pageChunkIndex + 1}`,
          title: `${document.title} — ${pageReference}`,
          content,
          category: 'legal_reference',
          source,
          metadata: {
            documentTitle: document.title,
            sourceFilename: document.filename,
            sourcePdfSha256: pdfHash,
            pdfPage: document.ocr ? null : page.pageNumber,
            ocrTextPage: document.ocr ? page.pageNumber : null,
            printedGazettePage: document.ocr ? page.printedPage || null : null,
            extraction: document.ocr ? 'local OCR sidecar' : 'pdf-parse text layer',
            chunkIndex,
            chunkCount: null
          }
        });
      }
    }
    counts.push({ title: document.title, pages: pages.length, characters: characterCount, chunks: chunkIndex });
  }

  for (const item of output) {
    const metadata = item.metadata as Record<string, unknown>;
    const document = counts.find(entry => entry.title === metadata.documentTitle);
    metadata.chunkCount = document?.chunks;
  }
  return { rows: output, counts };
}

async function uploadRows(rows: Array<Record<string, unknown>>) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for upload.');
  }
  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  for (let offset = 0; offset < rows.length; offset += UPLOAD_BATCH_SIZE) {
    const batch = rows.slice(offset, offset + UPLOAD_BATCH_SIZE);
    const { error } = await client.from('moat_data').upsert(batch, { onConflict: 'id' });
    if (error) throw new Error(`MOAT upload failed at row ${offset + 1}: ${error.message}`);
    console.log(`Uploaded ${Math.min(offset + batch.length, rows.length)} / ${rows.length} chunks`);
  }

  let verified = 0;
  for (let offset = 0; offset < rows.length; offset += UPLOAD_BATCH_SIZE) {
    const ids = rows.slice(offset, offset + UPLOAD_BATCH_SIZE).map(row => row.id as string);
    const { data, error } = await client.from('moat_data').select('id').in('id', ids);
    if (error) throw new Error(`MOAT verification failed at row ${offset + 1}: ${error.message}`);
    verified += data?.length || 0;
  }
  if (verified !== rows.length) {
    throw new Error(`MOAT verification found ${verified} of ${rows.length} uploaded chunks.`);
  }
  console.log(`Verified ${verified} MOAT chunks in Supabase.`);
}

async function main() {
  const { rows, counts } = await buildChunks();
  for (const count of counts) console.log(JSON.stringify(count));
  console.log(`Total chunks: ${rows.length}`);
  if (process.argv.includes('--upload')) await uploadRows(rows);
  else console.log('Dry run only. Pass --upload to upsert these chunks into Supabase.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('[legal-moat-ingestion] Failed:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
