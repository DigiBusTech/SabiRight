export async function runGemini(prompt: string): Promise<string | null> {
    try {
        const response = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            console.warn(`AI API Error (Status ${response.status})`);
            return null;
        }
        const data = await response.json();
        return data?.response || null;
    } catch (e) {
        console.error("AI Error:", e);
        return null;
    }
}
