# SabiRight AI Agent Hackathon Demo Plan

## Project Overview
**SabiRight** is an AI legal assistant designed to provide accurate, law-based guidance to Nigerian citizens, solving the critical "access to justice" problem.

## Demo Video Script (2 Minutes)

### 0:00 - 0:30: The "Before" Story ( Hallucination Liability)
* **Screen:** Show the old chat interface (`/api/ai/civic/chat`).
* **Query:** "What are my rights if the police stop me at a checkpoint in Lagos?"
* **Action:** The old model provides a generic, sometimes inaccurate response without specific citations or verification against the latest Nigerian laws. It might even "hallucinate" procedures that don't exist in the 2020 Police Act.
* **Narration:** "Generic AI models often provide broad, unverified legal advice, which is a major liability in sensitive civic situations."

### 0:30 - 1:30: The "After" Story (Autonomous @google/adk Agent)
* **Screen:** Show the new Optimized Agent interface (`/api/agent`).
* **Query:** Same query as above.
* **Process:** Show (or describe) the agent using `search_verified_legal_data` and `search_legal_faqs` tools.
* **Output:** The agent returns a precise response citing **Section 35 of the 1999 Constitution** and the **Police Act 2020**, with localized terminology handling.
* **Narration:** "Using the @google/adk with Gemini 1.5 Pro, our new autonomous agent retrieves vetted data from Firestore before answering. It understands localized phrasing like 'wahala' and ensures every response is grounded in actual regional law."

### 1:30 - 2:00: Innovation & Impact
* **Screen:** Show the "Professional Handoff" in action.
* **Query:** "I need a lawyer for a tenancy dispute."
* **Action:** Agent uses `search_legal_professionals` to list verified local lawyers.
* **Narration:** "We don't just provide information; we provide a bridge to justice by connecting users with verified legal professionals. SabiRight is empowering Nigerian citizens, one query at a time."

## Key Technical Innovations
1. **Multi-step Reasoning:** The agent performs multiple tool calls to synthesize a complete legal answer.
2. **Data Normalization:** Localized legal terminology is mapped to formal legal statutes for better retrieval.
3. **Zero-Hallucination Policy:** The agent is strictly instructed to refuse answering if it cannot find data in the Firestore MOAT.

## Shared Hosting Compatibility
The solution is built using Express.js and Vite, ensuring a lightweight and compatible build that can be easily deployed to standard shared hosting environments like Replit, Heroku, or traditional cPanel-based hosts.
