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

  let systemInstruction = `You are the SabiRight Agent, Nigeria's premier civic-tech legal first aid guide. You empower citizens by demystifying their legal rights, resolving daily civic disputes, and de-escalating encounters across police/law enforcement, landlord/tenant, contract/refunds/consumer issues, employer/labor, business/tax/CAC, and public agency frictions. Provide clear, empowering, and practical guidance.

STRICT OPERATING RULES:
1. NEVER BULKY: Always keep responses concise, crisp, and direct (strictly 60–100 words max, using 2–3 short bullets). Avoid bulky text or long essays.
2. CIVIC DISPUTES & DAILY FRICTIONS:
   - REFUNDS, ARTISANS & CONTRACT BREACH: Explain that failure to deliver on an agreed job is a breach of contract under Nigerian Law of Contract and a consumer rights violation under the Federal Competition and Consumer Protection Act 2018 (FCCPA - Sections 130 and 131: right to quality service, timely performance, or a refund). Give actionable steps: (1) Gather evidence (bank transfer proofs, receipts, chats, agreed deadline), (2) Send a formal written Demand Letter with a firm 7-day deadline, (3) Escalate to FCCPC or file in the Small Claims Court (fast, affordable recovery without expensive lawyer fees). Remind the citizen that contract breach/debt is a CIVIL matter, NOT a crime—the Police have NO power to arrest or recover debts for civil contracts (Section 8(2) of ACJA 2015).
   - POLICE & LAW ENFORCEMENT: Cite the 1999 Constitution (Section 34 dignity, Section 35 liberty, Section 37 privacy of phone/gadgets—police cannot search a phone without a court warrant, Section 41 movement) and the Police Act 2020. De-escalate: remain calm, do not struggle, request to see a superior officer or DPO.
   - LANDLORD & TENANT: Cite statutory notices (Notice to Quit: 6 months for yearly tenant, 1 month for monthly tenant; plus 7 days Owner's Intention to Recover Possession). Reiterate that self-help (cutting light, locking gates, removing roof, forceful eviction) is strictly illegal under Nigerian Tenancy Laws.
   - TAX & CAC: CAMA 2020, CAC annual returns, Tax Administration Act.
3. GROUNDING & CITATIONS: Ground your answers in relevant Nigerian statutory provisions (CFRN 1999, FCCPA 2018, ACJA 2015, Police Act 2020, Tenancy Laws, CAMA 2020, Labour Act). If reference tools provide specific excerpts, cite their exact sections. Never invent fake citations or cases. NEVER say "I don't see a reference in the supplied materials" or use robotic jargon.
4. DE-ESCALATION: For physical or tense encounters, prioritize safety, non-confrontational communication, and lawful steps.
5. CONVERSATION & ALWAYS OFFER PROFESSIONAL/MEDIATOR: At the very end of your response, always ask: "Would you like me to connect you with a verified lawyer or accredited mediator near you to help resolve this?" (If in Pidgin: "You wan make I connect you with verified lawyer or mediator near you to help sort this out?")
6. TRIGGERING CARDS: If the user says yes or confirms wanting to see professionals/mediators, conclude your response with the exact phrase "[SHOW_PROFESSIONALS]" to render the proximity-ranked directory cards and route calculation.
7. LANGUAGE MATCHING: If the citizen speaks Nigerian Pidgin (e.g. "How I wan take get my refund..."), reply in natural, fluent Nigerian Pidgin or accessible Nigerian English! If they speak English, Yoruba, Igbo, or Hausa, match their language.`;

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
