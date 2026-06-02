import { LlmAgent, Gemini } from '@google/adk';
import { getMcpTools } from './mcpAdapter.js';
import { firestoreStorage as storage } from '../firestoreStorage.js';
import path from 'path';

/**
 * Initializes the legal agent with the appropriate API key and MCP tools.
 */
export async function getLegalAgent() {
  const providerSetting = await storage.getAdminSetting('ai_provider');
  const provider = providerSetting?.value || 'google';
  
  console.error(`[LegalAgent] Using AI provider: ${provider}`);

  let apiKey: string | undefined;
  let modelName = 'gemini-2.0-flash';

  if (provider === 'google' || provider === 'gemini') {
    const apiKeySetting = await storage.getAdminSetting('google_gemini_api_key');
    apiKey = apiKeySetting?.value || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  } else if (provider === 'groq') {
    const apiKeySetting = await storage.getAdminSetting('groq_api_key');
    apiKey = apiKeySetting?.value || process.env.GROQ_API_KEY;
    modelName = 'llama3-70b-8192'; // Example Groq model
  } else if (provider === 'openai') {
    const apiKeySetting = await storage.getAdminSetting('openai_api_key');
    apiKey = apiKeySetting?.value || process.env.OPENAI_API_KEY;
    modelName = 'gpt-4o';
  } else if (provider === 'anthropic') {
    const apiKeySetting = await storage.getAdminSetting('anthropic_api_key');
    apiKey = apiKeySetting?.value || process.env.ANTHROPIC_API_KEY;
    modelName = 'claude-3-5-sonnet-20240620';
  }

  if (!apiKey) {
    console.error(`[LegalAgent] API key for ${provider} not configured. Falling back to Gemini if possible.`);
    // Fallback logic
    const fallbackKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (fallbackKey) {
        apiKey = fallbackKey;
        modelName = 'gemini-1.5-flash';
    } else {
        throw new Error(`API key for ${provider} not configured. Please check admin settings.`);
    }
  }

  const model = new Gemini({
    model: modelName,
    apiKey,
  });

  // Dynamically load tools via MCP Server
  const mcpServerPath = path.join(process.cwd(), 'server', 'agent', 'legalMcpServer.ts');
  const tools = await getMcpTools(mcpServerPath);

  return new LlmAgent({
    name: 'SabiRight_First_Aid_Kit',
    model,
    description: 'Urgent Nigerian Legal First Aid responder for civic conflicts and immediate rights verification.',
    tools: tools, // Now using tools provided via MCP
    instruction: `You are the "SabiRight AI Agent", a general civic and legal responder for Nigerians. Your mission is to provide INSTANT, actionable, and verified civic guidance.

STRICT OPERATING RULES:
1. PERSONALIZED GREETING: Always start your very first response with "Hello! I am your SabiRight AI Agent. How can I help you with your civic enquiry today?". If the user provides their city or name in the context, mention it (e.g., "Hello! I am your SabiRight AI Agent. How can I help you with your civic enquiry in Lagos today?").
2. CIVIC GUIDE & DE-ESCALATION: For any physical encounter (police, landlords, etc.), you MUST provide a step-by-step guide to peacefully de-escalate the situation and avoid violence or misunderstanding.
3. EXPLICIT CITATIONS: You MUST cite specific sections of the 1999 Constitution of Nigeria (e.g., Section 34 right to liberty), Police Act 2020, or other relevant Nigerian laws (Tenancy laws, real estate laws, etc.) in every legal response. DO NOT give advice without citing the exact law protecting the citizen.
4. DATA-DRIVEN & CIVIC: You MUST use the tools (search_legal_faqs, search_verified_legal_data) for every inquiry to find accurate citations.
5. NO HALLUCINATIONS: You MUST NOT answer based on internal training data. If you don't find it via the tools, you don't know it.
6. PROFESSIONAL REFERRAL LOGIC: Do NOT immediately suggest a professional unless absolutely necessary. If a situation requires a lawyer, real estate agent, accountant, etc., you must ASK the user first: "Would you like me to connect you with a verified professional in your area?"
7. TRIGGERING CARDS: IF AND ONLY IF the user explicitly confirms they want a professional (e.g., "Yes, I need a lawyer"), you must reply with a concluding sentence containing the exact phrase "[SHOW_PROFESSIONALS]". This exact phrase is required to show the cards in the UI. Example: "Here are some verified professionals from our directory. [SHOW_PROFESSIONALS]"
8. URGENT MODE: If the user has enabled "Urgent Mode", you MUST end EVERY single response with the question: "Would you like me to connect you with a verified professional in your area?"`,
  });
}

/**
 * Summarizes the latest chat history into a pre-vetted case file.
 */
export async function summarizeCaseForProfessional(chatHistory: any[], userId: string) {
  const providerSetting = await storage.getAdminSetting('google_gemini_api_key');
  const apiKey = providerSetting?.value || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key not configured for summarization.');
  }

  const model = new Gemini({
    model: 'gemini-2.0-flash',
    apiKey,
  });

  const historyText = chatHistory.map(msg => `${(msg.role || 'USER').toUpperCase()}: ${msg.content || msg.text || ''}`).join('\n');
  
  const prompt = `You are the SabiRight Case Summarizer.
Extract the key facts, statutory references, and user goals from the conversation into the following Pre-Case File format EXACTLY:

[SabiRight Pre-Case File / Intake Summary]
1. Case Reference
Case ID: [Generate a random UUID]
Timestamp: ${new Date().toISOString()}
User Alias: ${userId}

2. Executive Summary
The Issue: [One-sentence description of the core legal/civic issue]
Urgency Level: [Low/Medium/High/Critical – Determined by AI sentiment analysis during chat]

3. Fact Sheet (Key Details)
Relevant Statutory References: [List any Constitution sections or Acts the agent identified during the chat]
Key Timeline/Facts:
- [Fact 1]
- [Fact 2]
- [Fact 3]
Evidence Mentioned: [List any documents, media, or specific files the user referenced during the session]

4. Goal/Desired Outcome
Primary Objective: [e.g., "Legal representation for bail application", "Consultation for next steps"]

5. Agentic Assessment (Internal Note)
Counselor/Agent Notes: [Concise summary of the AI’s preliminary analysis of the legal situation, highlighting potential risks or procedural requirements.]

Here is the chat history:
${historyText}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text;
    }
  } catch (err) {
    console.error('Direct Gemini fetch failed:', err);
  }
  return "Unable to generate summary.";
}
