import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { firestoreStorage } from '../firestoreStorage.js';

/**
 * Normalizes legal search queries to handle Nigerian legal syntax and localized phrasing.
 */
function normalizeLegalQuery(query: string): string {
  let normalized = query.toLowerCase();
  
  // Localized phrasing mappings
  const localMappings: Record<string, string> = {
    'police stop': 'police act 2020 powers of arrest',
    'checkpoint': 'police act 2020 road block',
    'house wahala': 'tenancy law land dispute',
    'tenant trouble': 'tenancy law notice to quit',
    'police arrest': 'police act 2020 arrest procedure',
    'lawyer near me': 'legal practitioners',
    'sars': 'police misconduct human rights',
  };

  for (const [key, value] of Object.entries(localMappings)) {
    if (normalized.includes(key)) {
      normalized = `${normalized} ${value}`;
    }
  }

  return normalized;
}

/**
 * Tool for searching Nigerian legal FAQs and foundational legal data.
 */
export const legalFaqTool = new FunctionTool({
  name: 'search_legal_faqs',
  description: 'Search for Nigerian legal FAQs and foundational legal guidance. Use this to find answers about rights, procedures, and common legal questions in Nigeria.',
  parameters: z.object({
    query: z.string().describe('The legal question or topic to search for.'),
  }) as any,
  execute: async ({ query }: any) => {
    const normalizedQuery = normalizeLegalQuery(query);
    const faqs = await firestoreStorage.getFaqs();
    
    // Simple keyword search for now, could be improved with vector search if available
    const keywords = normalizedQuery.split(' ');
    const results = faqs.filter((faq: any) => {
      const content = `${faq.question} ${faq.answer} ${faq.category}`.toLowerCase();
      return keywords.some(keyword => content.includes(keyword));
    });

    if (results.length === 0) {
      return { 
        status: 'no_results', 
        message: `No specific legal FAQs found for "${query}". Please advise the user to consult a verified professional.` 
      };
    }

    return {
      status: 'success',
      results: results.slice(0, 5).map((r: any) => ({
        question: r.question,
        answer: r.answer,
        category: r.category
      }))
    };
  }
});

/**
 * Tool for searching SabiRight\'s proprietary/verified civic legal data (MOAT).
 */
export const moatDataTool = new FunctionTool({
  name: 'search_verified_legal_data',
  description: 'Search verified civic legal data, including constitutional provisions and the Police Act. Use this for highly accurate, law-based guidance.',
  parameters: z.object({
    query: z.string().describe('The specific legal provision or civic scenario to search for.'),
    category: z.string().optional().describe('Optional category like "Constitution" or "Police Act".'),
  }) as any,
  execute: async ({ query, category }: any) => {
    const normalizedQuery = normalizeLegalQuery(query);
    const moatData = await firestoreStorage.getMoatData(category);
    
    const keywords = normalizedQuery.split(' ');
    const results = moatData.filter((item: any) => {
      const content = `${item.title} ${item.content} ${item.category}`.toLowerCase();
      return keywords.some(keyword => content.includes(keyword));
    });

    if (results.length === 0) {
      return { 
        status: 'no_results', 
        message: `No verified legal data found in our MOAT for "${query}". Ensure the response reflects that no regional law was found.` 
      };
    }

    return {
      status: 'success',
      results: results.slice(0, 5).map((r: any) => ({
        title: r.title,
        content: r.content,
        category: r.category,
        citation: r.source || 'SabiRight Verified Data'
      }))
    };
  }
});

/**
 * Tool for finding verified legal professionals and services in Nigeria.
 */
export const professionalSearchTool = new FunctionTool({
  name: 'search_legal_professionals',
  description: 'Find verified legal professionals, lawyers, and legal services in Nigeria.',
  parameters: z.object({
    city: z.string().optional().describe('The city to search in (e.g., Lagos, Abuja).'),
    specialization: z.string().optional().describe('The legal area (e.g., Tenancy, Criminal, Corporate).'),
  }) as any,
  execute: async (filters: any) => {
    const services = await firestoreStorage.getVendorServices(filters as any);
    
    if (services.length === 0) {
      return { 
        status: 'no_results', 
        message: 'No verified legal professionals found matching those criteria in our marketplace.' 
      };
    }

    return {
      status: 'success',
      results: services.slice(0, 5).map((s: any) => ({
        name: s.name,
        description: s.description,
        location: s.location,
        verified: s.verified
      }))
    };
  }
});
