import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { firestoreStorage } from "../firestoreStorage.js";

// Initialize Firebase Admin for the MCP process
const serviceAccountPath = path.join(process.cwd(), 'legal-13d13-firebase-adminsdk-fbsvc-e736182a52.json');
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'legal-13d13'
    });
  }
}

/**
 * MCP Server for Nigerian Legal Data
 */
const server = new Server(
  {
    name: "sabiright-legal-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Localized phrasing mappings for Nigerian Civic Conflicts
const localMappings: Record<string, string> = {
  // Police & Law Enforcement
  'police stop': 'police act 2020 powers of arrest',
  'checkpoint': 'police act 2020 road block search',
  'police arrest': 'police act 2020 arrest procedure rights',
  'sars': 'police misconduct human rights violation',
  'bail': 'police act right to bail free administration of criminal justice act',
  'search my phone': '1999 constitution chapter iv right to privacy search without warrant',
  'slap me': 'assault fundamental human rights constitution',
  'bribe': 'extortion police misconduct corruption',
  'roger': 'extortion police misconduct corruption', // Slang for bribe
  'egunje': 'extortion police misconduct corruption', // Slang for bribe
  'efcc': 'financial crimes arrest procedure warrant',
  
  // Tenancy & Housing
  'house wahala': 'tenancy law land dispute',
  'tenant trouble': 'tenancy law notice to quit',
  'landlord lock': 'tenancy law forceful eviction illegal lockout',
  'quit notice': 'tenancy agreement statutory notice to quit',
  
  // General & Constitutional
  'my right': '1999 constitution fundamental human rights chapter iv',
  'lawyer near me': 'legal practitioners representation',
  'court wahala': 'litigation court proceedings civil matter'
};

function normalizeLegalQuery(query: string): string {
  let normalized = query.toLowerCase();
  for (const [key, value] of Object.entries(localMappings)) {
    if (normalized.includes(key)) {
      normalized = `${normalized} ${value}`;
    }
  }
  return normalized;
}

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_legal_faqs",
        description: "Search for Nigerian legal FAQs and foundational legal guidance.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "The legal question or topic to search for." },
          },
          required: ["query"],
        },
      },
      {
        name: "search_verified_legal_data",
        description: "Search verified civic legal data (Constitution, Police Act).",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Specific legal provision or scenario." },
            category: { type: "string", description: "Optional: 'Constitution' or 'Police Act'." },
          },
          required: ["query"],
        },
      },
      {
        name: "search_legal_professionals",
        description: "Find verified legal professionals in Nigeria.",
        inputSchema: {
          type: "object",
          properties: {
            city: { type: "string", description: "City to search in." },
            specialization: { type: "string", description: "Legal area (e.g., Tenancy)." },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "search_legal_faqs") {
      const query = String(args?.query || "");
      const normalizedQuery = normalizeLegalQuery(query);
      const faqs = await firestoreStorage.getFaqs();
      const keywords = normalizedQuery.split(' ');
      const results = faqs.filter(faq => {
        const content = `${faq.question} ${faq.answer} ${faq.category}`.toLowerCase();
        return keywords.some(keyword => content.includes(keyword));
      });

      return {
        content: [{ type: "text", text: JSON.stringify(results.slice(0, 5)) }],
      };
    }

    if (name === "search_verified_legal_data") {
      const query = String(args?.query || "");
      const category = args?.category as string | undefined;
      const normalizedQuery = normalizeLegalQuery(query);
      const moatData = await firestoreStorage.getMoatData(category);
      const keywords = normalizedQuery.split(' ');
      const results = moatData.filter(item => {
        const content = `${item.title} ${item.content} ${item.category}`.toLowerCase();
        return keywords.some(keyword => content.includes(keyword));
      });

      return {
        content: [{ type: "text", text: JSON.stringify(results.slice(0, 5)) }],
      };
    }

    if (name === "search_legal_professionals") {
      const services = await firestoreStorage.getVendorServices(args as any);
      return {
        content: [{ type: "text", text: JSON.stringify(services.slice(0, 5)) }],
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: "text", text: error.message }],
    };
  }
});

/**
 * Start the server
 */
const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);

export { server };
