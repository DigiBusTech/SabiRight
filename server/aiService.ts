import { supabaseStorage as storage } from "./supabaseStorage.js";

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

    // If no direct matches, include the top 2 general/fundamental items if available
    const chosen = relevant.length > 0 ? relevant : moatData.slice(0, 2);
    if (chosen.length === 0) return '';

    let context = "\n\n[ADMINISTRATIVE STATUTORY MOAT - GROUND TRUTH LEGAL CONTEXT]\n";
    context += "Use the following verified statutory provisions curated by administrators to answer the enquiry authoritatively:\n\n";
    for (const entry of chosen) {
      context += `• **${entry.title}** (${entry.category || 'Statute'}):\n  ${entry.content}\n  Source: ${entry.source || 'Admin Curated'}\n\n`;
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
 * Supports Yoruba, Hausa, Igbo, Nigerian English, and Pidgin.
 * Can connect to HuggingFace Serverless Inference, Dedicated HuggingFace Endpoint, or custom vLLM/OpenAI-compatible URL.
 */
export async function generateNAtlasResponse(prompt: string): Promise<string | null> {
  const tokenSetting = await storage.getAdminSetting('natlas_api_token') 
    || await storage.getAdminSetting('huggingface_api_key');
  const token = tokenSetting?.value || process.env.NATLAS_API_TOKEN || process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;

  const endpointSetting = await storage.getAdminSetting('natlas_api_endpoint');
  const endpoint = endpointSetting?.value?.trim() || 'https://api-inference.huggingface.co/models/NCAIR1/N-ATLaS';

  const modelIdSetting = await storage.getAdminSetting('natlas_model_id');
  const modelId = modelIdSetting?.value?.trim() || 'NCAIR1/N-ATLaS';

  if (!token) {
    throw new Error('N-ATLAS API token not configured. Please set natlas_api_token in Admin Settings or provide HuggingFace token.');
  }

  // Handle OpenAI-compatible endpoints (such as vLLM or Hugging Face Dedicated Endpoints running TGI/vLLM)
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
            content: 'You are N-ATLAS, Nigeria\'s Sovereign Multilingual LLM, powering SabiRight. You communicate accurately in English, Nigerian Pidgin, Yoruba, Hausa, and Igbo with deep comprehension of Nigerian laws and civic reality.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 1024
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`N-ATLAS custom endpoint error (${res.status}): ${errText}`);
    }
    const data = await res.json() as any;
    return data?.choices?.[0]?.message?.content || null;
  }

  // HuggingFace standard model inference endpoint
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 1024,
        return_full_text: false,
        temperature: 0.6,
        top_p: 0.9
      },
      options: {
        wait_for_model: true
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`N-ATLAS HF error (${response.status}): ${errorBody}`);
  }

  const data = await response.json() as any;
  if (Array.isArray(data) && data[0]?.generated_text) {
    return data[0].generated_text;
  }
  if (data?.generated_text) {
    return data.generated_text;
  }
  return typeof data === 'string' ? data : JSON.stringify(data);
}

/**
 * Unified multi-provider AI text generation service for SabiRight.
 * Supports:
 * - Mode 1: Sovereign N-ATLAS (NAIC Challenge Mode - primary N-ATLAS with automatic resilience fallbacks)
 * - Mode 2: Multi-Model Enterprise Grid (Standard production mode with admin provider selection)
 */
export async function generateAIResponse(prompt: string, skipMoatGrounding = false): Promise<string | null> {
  let effectivePrompt = prompt;
  if (!skipMoatGrounding) {
    const moatContext = await getRelevantMoatContext(prompt);
    if (moatContext && !prompt.includes('[ADMINISTRATIVE STATUTORY MOAT')) {
      effectivePrompt = `${moatContext}\n${prompt}`;
    }
  }

  // Check if system is set to Sovereign N-ATLAS Mode (NITDA NAIC Challenge)
  const aiModeSetting = await storage.getAdminSetting('ai_mode');
  const aiMode = (aiModeSetting?.value || 'natlas_sovereign').toLowerCase();

  if (aiMode === 'natlas_sovereign') {
    try {
      console.log('[aiService] 🇳🇬 Sovereign Mode Active: Routing prompt to N-ATLAS (NCAIR1/N-ATLaS)...');
      const natlasResponse = await generateNAtlasResponse(effectivePrompt);
      if (natlasResponse && natlasResponse.trim()) {
        return natlasResponse;
      }
    } catch (natlasErr: any) {
      console.warn(`[aiService] ⚠️ N-ATLAS notice (${natlasErr.message}). Automatically invoking resilient fallback...`);
    }
    // If N-ATLAS encountered cold-start or error, proceed seamlessly to fallback provider below
  }

  const primaryAISetting = await storage.getAdminSetting('ai_provider');
  const provider = (primaryAISetting?.value || 'google').toLowerCase();

  if (provider === 'natlas') {
    return await generateNAtlasResponse(effectivePrompt);
  } else if (provider === 'openai') {
    const apiKeySetting = await storage.getAdminSetting('openai_api_key');
    const apiKey = apiKeySetting?.value || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: effectivePrompt }],
        temperature: 0.7
      })
    });

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
    const apiKeySetting = await storage.getAdminSetting('anthropic_api_key');
    const apiKey = apiKeySetting?.value || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 2048,
        messages: [{ role: 'user', content: effectivePrompt }]
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Anthropic error: ${response.status} ${errorBody}`);
    }

    const data = await response.json() as any;
    return data?.content?.[0]?.text || null;
  } else if (provider === 'groq') {
    const apiKeySetting = await storage.getAdminSetting('groq_api_key');
    const apiKey = apiKeySetting?.value || process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    const candidateModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile'];
    let lastErr = '';
    for (const model of candidateModels) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: effectivePrompt }],
            temperature: 0.6
          })
        });

        if (response.ok) {
          const data = await response.json() as any;
          const text = data?.choices?.[0]?.message?.content;
          if (text) return text;
        } else {
          lastErr = await response.text();
        }
      } catch (mErr: any) {
        lastErr = mErr.message || String(mErr);
      }
    }

    throw new Error(`Groq error across candidate models: ${lastErr}`);
  } else if (provider === 'deepseek') {
    const apiKeySetting = await storage.getAdminSetting('deepseek_api_key');
    const apiKey = apiKeySetting?.value || process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: effectivePrompt }],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`DeepSeek error: ${response.status} ${errorBody}`);
    }

    const data = await response.json() as any;
    return data?.choices?.[0]?.message?.content || null;
  } else if (provider === 'openrouter') {
    const apiKeySetting = await storage.getAdminSetting('openrouter_api_key');
    const apiKey = apiKeySetting?.value || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://sabiright.com',
        'X-Title': 'SabiRight AI'
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [{ role: 'user', content: effectivePrompt }]
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenRouter error: ${response.status} ${errorBody}`);
    }

    const data = await response.json() as any;
    return data?.choices?.[0]?.message?.content || null;
  } else if (provider === 'perplexity') {
    const apiKeySetting = await storage.getAdminSetting('perplexity_api_key');
    const apiKey = apiKeySetting?.value || process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: effectivePrompt }]
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Perplexity error: ${response.status} ${errorBody}`);
    }

    const data = await response.json() as any;
    return data?.choices?.[0]?.message?.content || null;
  } else if (provider === 'mistral') {
    const apiKeySetting = await storage.getAdminSetting('mistral_api_key');
    const apiKey = apiKeySetting?.value || process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      throw new Error('Mistral API key not configured');
    }

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-tiny',
        messages: [{ role: 'user', content: effectivePrompt }]
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Mistral error: ${response.status} ${errorBody}`);
    }

    const data = await response.json() as any;
    return data?.choices?.[0]?.message?.content || null;
  } else if (provider === 'huggingface') {
    const apiKeySetting = await storage.getAdminSetting('huggingface_api_key');
    const apiKey = apiKeySetting?.value || process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
      throw new Error('HuggingFace API key not configured');
    }

    const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        inputs: effectivePrompt,
        parameters: { max_new_tokens: 1024, return_full_text: false, temperature: 0.7 }
      })
    });

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
    const apiKeySetting = await storage.getAdminSetting('google_gemini_api_key');
    const apiKey = apiKeySetting?.value || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

    // If Gemini is not configured, check if Groq key is present as automatic smart fallback
    if (!apiKey) {
      const groqSetting = await storage.getAdminSetting('groq_api_key');
      const groqKey = groqSetting?.value || process.env.GROQ_API_KEY;
      if (groqKey) {
        const candidateModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile'];
        for (const model of candidateModels) {
          try {
            const gResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`
              },
              body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: effectivePrompt }],
                temperature: 0.6
              })
            });
            if (gResponse.ok) {
              const gData = await gResponse.json() as any;
              const text = gData?.choices?.[0]?.message?.content;
              if (text) return text;
            }
          } catch (gErr) {}
        }
      }
      throw new Error('Gemini API key not configured, and no fallback AI provider available');
    }

    // Use gemini-2.0-flash with v1beta endpoint for stability and modern features
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
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
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn(`Gemini API Error (${response.status}): ${errorBody}. Attempting fallback to Groq...`);

      const groqSetting = await storage.getAdminSetting('groq_api_key');
      const groqKey = groqSetting?.value || process.env.GROQ_API_KEY;
      if (groqKey) {
        const candidateModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile'];
        for (const model of candidateModels) {
          try {
            const gResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`
              },
              body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: effectivePrompt }],
                temperature: 0.6
              })
            });
            if (gResponse.ok) {
              const gData = await gResponse.json() as any;
              const text = gData?.choices?.[0]?.message?.content;
              if (text) return text;
            }
          } catch (gErr) {}
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

