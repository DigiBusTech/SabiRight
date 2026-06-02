import { GEMINI_API_KEY, state, renderApp } from './shared.js';

// --- STATE ---
export const agentData = {
    chatHistory: [],
    isAgentLoading: false,
    isChatUrgent: false
};

// --- ACTIONS ---

export function toggleUrgency() {
    agentData.isChatUrgent = !agentData.isChatUrgent;
    renderApp();
}

export async function handleAgentSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('agent-input');
    const text = input.value.trim();
    if (!text) return;

    agentData.chatHistory.push({ role: 'user', text });
    input.value = '';
    agentData.isAgentLoading = true;
    renderApp();

    setTimeout(() => {
        const c = document.getElementById('chat-container');
        if (c) c.scrollTop = c.scrollHeight;
    }, 50);

    let assistantResponseText = "I couldn't generate a response. Please try again.";
    let sources = [];

    try {
        const city = state.userProfile?.city || 'Nigeria';

        const systemPrompt = agentData.isChatUrgent
            ? `URGENT EMERGENCY MODE. User Location: ${city}.
    1. Provide extremely concise, bullet-point instructions ONLY.
    2. Cite specific sections of the 1999 Constitution or Police Act in brackets [e.g., Sec 34].
    3. Tell the user exactly what to say or do.
    4. Do not waste time with greetings.`
            : `You are a helpful Legal Assistant for Nigeria. User Location: ${city}.
    1. Explain the law clearly using the 1999 Constitution and Police Act 2020.
    2. Provide detailed advice.
    3. Your name is Right-To-Know Agent.
    4. Use Markdown for headings and bold text.`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        const payload = {
            contents: [{
                role: "user",
                parts: [{ text: text }]
            }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            tools: [{ "google_search": {} }],
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
            ]
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];

        if (data.promptFeedback?.blockReason || !candidate) {
            assistantResponseText = `⚠️ My response was blocked by safety filters.`;
        } else {
            assistantResponseText = candidate.content.parts[0].text || "No response generated.";
            const groundingMetadata = candidate.groundingMetadata;
            if (groundingMetadata?.groundingAttributions) {
                sources = groundingMetadata.groundingAttributions
                    .map(attribution => ({
                        uri: attribution.web?.uri,
                        title: attribution.web?.title,
                    }))
                    .filter(source => source.uri && source.title);
            }
        }

    } catch (error) {
        console.error("Gemini API call failed:", error);
        assistantResponseText = "Connection Error. Please check your internet connection.";
    }

    agentData.chatHistory.push({ role: 'ai', text: assistantResponseText, sources: sources });
    agentData.isAgentLoading = false;
    renderApp();

    setTimeout(() => {
        const c = document.getElementById('chat-container');
        if (c) c.scrollTop = c.scrollHeight;
    }, 50);
}

// --- RENDER ---
export function renderAgent() {
    const inputBorder = agentData.isChatUrgent ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white';
    const toggleBtn = agentData.isChatUrgent ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300';

    return `
    <div class="flex flex-col h-full bg-white pb-safe">
        <header class="bg-white shadow-sm p-3 flex-shrink-0 flex justify-between items-center z-10">
            <button onclick="setAppView('dashboard')" class="text-gray-600 text-sm font-medium"><i class="fas fa-arrow-left"></i> Back</button>
            <h2 class="font-bold text-gray-800">Legal Assistant</h2>
            <div class="w-10"></div>
        </header>

        <div id="chat-container" class="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 pb-4">
            ${agentData.chatHistory.length === 0 ? `
                            <div class="text-center text-gray-400 mt-20">
                                <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="fas fa-scale-balanced text-3xl text-gray-500"></i>
                                </div>
                                <p class="text-sm">Ask a legal question below.</p>
                            </div>` : ''}

            ${agentData.chatHistory.map(msg => `
                            <div class="flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}">
                                <div class="max-w-[85%] p-3 rounded-2xl text-sm prose ${msg.role === 'user' ? 'bg-gray-800 text-white rounded-br-none' : 'bg-white border rounded-bl-none shadow-sm'}">
                                    ${msg.role === 'ai' && typeof marked !== 'undefined' ? marked.parse(msg.text) : msg.text}
                                </div>
                            </div>`).join('')}

            ${agentData.isAgentLoading ? `
                            <div class="flex justify-start">
                                <div class="bg-white border px-4 py-2 rounded-full text-xs text-gray-500 shadow-sm animate-pulse">
                                    Thinking...
                                </div>
                            </div>` : ''}
        </div>

        <div class="p-3 bg-white border-t flex-shrink-0">
            <form onsubmit="handleAgentSubmit(event)" class="relative max-w-4xl mx-auto">
                <div class="flex items-end gap-2 p-2 rounded-2xl border transition-all duration-300 ${inputBorder}">

                    <button type="button" onclick="toggleUrgency()" class="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300 ${toggleBtn}" title="${agentData.isChatUrgent ? 'Switch to Detailed' : 'Switch to Urgent'}">
                        <i class="fas ${agentData.isChatUrgent ? 'fa-exclamation' : 'fa-book'}"></i>
                    </button>

                    <textarea id="agent-input" rows="1" class="flex-grow bg-transparent border-none focus:ring-0 p-2 text-sm resize-none max-h-32 text-gray-800 placeholder-gray-500" placeholder="${agentData.isChatUrgent ? 'Describe emergency situation...' : 'Ask a legal question...'}" oninput="this.style.height='';this.style.height=this.scrollHeight+'px'"></textarea>

                    <button type="submit" class="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
                        <i class="fas fa-paper-plane text-sm"></i>
                    </button>
                </div>
                <div class="text-center mt-1">
                    <span class="text-[10px] font-bold uppercase tracking-wider ${agentData.isChatUrgent ? 'text-red-600' : 'text-blue-600'}">
                        ${agentData.isChatUrgent ? '🚨 Urgent Mode Active' : '📘 Detailed Mode Active'}
                    </span>
                </div>
            </form>
        </div>
    </div>`;
}