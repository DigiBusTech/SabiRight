export type DirectoryProfessionalRole = 'lawyer' | 'tax_agent' | 'cac_agent' | 'accountant';

export function getRecommendedProfessionalRole(query: string): DirectoryProfessionalRole {
  if (/\b(?:tax(?:es|ation)?|firs|vat|paye|tin|taxable|withholding tax|tax return)\b/i.test(query)) {
    return 'tax_agent';
  }
  if (/\b(?:cac|corporate affairs commission|company registration|business registration|business name registration|incorporat(?:e|ion|ing))\b/i.test(query)) {
    return 'cac_agent';
  }
  if (/\b(?:accountant|accounting|bookkeep(?:ing|er)?|audit(?:or|ing)?|financial statements?)\b/i.test(query)) {
    return 'accountant';
  }
  return 'lawyer';
}

export function getProfessionalLabel(role: DirectoryProfessionalRole): string {
  switch (role) {
    case 'tax_agent': return 'Tax Professional';
    case 'cac_agent': return 'CAC Agent';
    case 'accountant': return 'Accountant';
    default: return 'Lawyer';
  }
}
