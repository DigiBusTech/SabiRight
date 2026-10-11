import { LlmAgent, Gemini } from '@google/adk';
import { getMcpTools } from './mcpAdapter.js';
import { supabaseStorage as storage } from '../supabaseStorage.js';
import { generateAIResponse } from '../aiService.js';
import path from 'path';

/**
 * Initializes the legal agent with the appropriate API key and MCP tools.
 */
export async function getLegalAgent(targetLanguage: string = "English") {
  const providerSetting = await storage.getAdminSetting('ai_provider');
  const provider = providerSetting?.value || 'google';
  
  console.error(`[LegalAgent] System active provider is set to: ${provider}`);

  let apiKey: string | undefined;
  let modelName = 'gemini-2.0-flash';

  // IMPORTANT: The Google ADK framework and its Gemini connection wrapper (imported from '@google/adk')
  // are built exclusively for Google Gemini models and use Google's APIs. Passing non-Gemini keys (like Groq)
  // or non-Gemini model names to the Gemini class constructor will fail.
  // Therefore, the Civic Chat/Legal Agent must always run on a Google Gemini model.
  const geminiKeySetting = await storage.getAdminSetting('google_gemini_api_key');
  apiKey = geminiKeySetting?.value || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

  if (apiKey) {
    console.error(`[LegalAgent] Successfully loaded Google Gemini API key. Routing ADK to gemini-2.0-flash.`);
  } else {
    console.error(`[LegalAgent] Google Gemini API key not found. Trying active provider (${provider}) credentials as fallback...`);
    if (provider === 'google' || provider === 'gemini') {
      // already tried, but just in case
    } else if (provider === 'groq') {
      const apiKeySetting = await storage.getAdminSetting('groq_api_key');
      apiKey = apiKeySetting?.value || process.env.GROQ_API_KEY;
      modelName = 'llama3-70b-8192';
    } else if (provider === 'openai') {
      const apiKeySetting = await storage.getAdminSetting('openai_api_key');
      apiKey = apiKeySetting?.value || process.env.OPENAI_API_KEY;
      modelName = 'gpt-4o';
    } else if (provider === 'anthropic') {
      const apiKeySetting = await storage.getAdminSetting('anthropic_api_key');
      apiKey = apiKeySetting?.value || process.env.ANTHROPIC_API_KEY;
      modelName = 'claude-3-5-sonnet-20240620';
    }
  }

  if (!apiKey) {
    throw new Error(`Google Gemini API key is required for the SabiRight ADK Legal Agent. Please configure it in the Admin Dashboard.`);
  }

  const model = new Gemini({
    model: modelName,
    apiKey,
  });

  // Dynamically load tools via MCP Server
  const mcpServerPath = path.join(process.cwd(), 'server', 'agent', 'legalMcpServer.ts');
  const tools = await getMcpTools(mcpServerPath);

  let systemInstruction = `You are the SabiRight Agent, a general civic information responder for Nigerians. Provide clear, cautious information; you are not a substitute for advice from a qualified Nigerian lawyer.

STRICT OPERATING RULES:
1. DIRECT RESPONSE: Do not add an introduction or greeting unless the user greets you. Answer the user's question directly.
2. CIVIC GUIDE & DE-ESCALATION: For physical encounters, prioritize immediate safety and offer only general, non-confrontational steps. Do not guarantee safety or outcomes.
3. SOURCE-BASED LEGAL INFORMATION: Use relevant legal reference tools for legal questions. Cite the exact statute and section supported by the tool result; cite its page if no section is identifiable. Prefer a relevant Constitutional section when supported, but do not force one. Never guess or fabricate a citation, wording, legal right, or outcome. Reference entries and FAQs may be incomplete or inaccurate; do not describe them as independently verified.
4. CONTEXT AND SCOPE: Answer Nigerian civic and legal questions only when supported by the supplied legal reference tools/context. If the user asks an unrelated question or the tools provide no relevant material, briefly explain that SabiRight Agent is limited to Nigerian civic guidance grounded in its provided references, then invite a related question. Do not answer unsupported questions from general model knowledge.
5. UNCERTAINTY: If the tools return no relevant source, or the material does not support a clear answer, say that you cannot verify the legal point. Do not fill gaps from memory or present a guess as fact. Recommend checking a current authoritative source or consulting qualified Nigerian counsel.
6. CONVERSATION: Use the recent chat history to understand follow-ups. Keep a natural, focused back-and-forth. Do not append menus, unrelated suggestions, or routine professional referrals. Ask one short clarifying question only when needed.
7. PROFESSIONAL REFERRAL LOGIC: Do NOT immediately suggest a professional unless necessary. If one may help, ask the user first whether they want help finding one.
8. TRIGGERING CARDS: Only if the user explicitly confirms, end the response with the exact phrase "[SHOW_PROFESSIONALS]" to show directory results. Do not describe a professional as verified unless the returned directory record supports that status.
9. RESPONSE STYLE: Usually answer in 1–3 short sentences or up to 3 brief bullets, under 90 words. In an urgent or immediate-safety situation, use at most 2 short sentences and 50 words, and prioritize immediate safety.`;

  if (/^(?:auto(?:-detect)?|detect)$/i.test(targetLanguage.trim())) {
    systemInstruction += `\n\n10. AUTOMATIC LANGUAGE: Detect the primary language of each latest user message, supporting English, Nigerian Pidgin, Hausa, Yoruba, and Igbo. Reply entirely in that language; do not let a prior turn override the current message. Start with exactly one metadata line in this format, selecting the detected language: [[SABIRIGHT_LANGUAGE:English]]. The metadata is internal; never discuss it. If the message language is unclear, use the user's last saved language or English.`;
  } else {
    systemInstruction += `\n\n10. SELECTED LANGUAGE: Respond entirely in ${targetLanguage}, even if the latest user message uses another language. Start with exactly one metadata line: [[SABIRIGHT_LANGUAGE:${targetLanguage}]]. The marker is internal; never discuss it.`;
  }

  return new LlmAgent({
    name: 'SabiRight_First_Aid_Kit',
    model,
    description: 'Civic information assistant for Nigerian users; it does not provide legal advice or verify legal rights.',
    tools: tools, // Now using tools provided via MCP
    instruction: systemInstruction,
  });
}

/**
 * Summarizes the latest chat history into a preliminary intake summary.
 * Tries the Gemini REST API directly first (fastest when configured), then falls
 * back to the unified generateAIResponse() which honours whichever provider the
 * admin has set as active (OpenAI, Groq, Anthropic, etc.).
 */
export async function summarizeCaseForProfessional(chatHistory: any[], userId: string) {
  const historyText = chatHistory.map(msg => `${(msg.role || 'USER').toUpperCase()}: ${msg.content || msg.text || ''}`).join('\n');

  const prompt = `You are the SabiRight Case Summarizer.
Extract only facts, statutory references, and user goals explicitly present in the conversation into the following preliminary intake format EXACTLY. Do not add legal conclusions, citations, facts, or urgency assessments that the conversation does not support:

[SabiRight Preliminary Intake Summary]
1. Case Reference
Case ID: [Use a supplied reference if present; otherwise write "Not assigned"]
Timestamp: ${new Date().toISOString()}
User Alias: ${userId}

2. Executive Summary
The Issue: [One-sentence description of the core legal/civic issue]
Urgency: [Record only an urgency explicitly stated by the user; otherwise write "Not assessed"]

3. Fact Sheet (Key Details)
Relevant Statutory References: [List only the provisions or Acts explicitly mentioned in the chat; mark them as unverified]
Key Timeline/Facts:
- [Fact 1]
- [Fact 2]
- [Fact 3]
Evidence Mentioned: [List any documents, media, or specific files the user referenced during the session]

4. Goal/Desired Outcome
Primary Objective: [e.g., "Legal representation for bail application", "Consultation for next steps"]

5. Intake Notes
Intake Notes: [Concise summary of concerns or follow-up questions explicitly supported by the conversation. Do not add legal analysis or procedural requirements.]

Here is the chat history:
${historyText}`;

  // Path 1: Direct Gemini REST call — fastest when the Gemini API key is configured
  try {
    const geminiKeySetting = await storage.getAdminSetting('google_gemini_api_key');
    const apiKey = geminiKeySetting?.value || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

    if (apiKey) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
    }
  } catch (err) {
    console.error('[LegalAgent] Direct Gemini summarization failed, falling back to active provider:', err);
  }

  // Path 2: Unified provider fallback — uses whichever AI provider the admin has active
  try {
    const summary = await generateAIResponse(prompt, true /* skipMoatGrounding — this is a structured task, not a citizen query */);
    if (summary) return summary;
  } catch (err) {
    console.error('[LegalAgent] Fallback generateAIResponse summarization also failed:', err);
  }

  return 'Unable to generate summary.';
}
