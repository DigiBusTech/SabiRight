import assert from 'node:assert/strict';
import test from 'node:test';
import { getProfessionalLabel, getRecommendedProfessionalRole } from './professionalRouting.js';

test('routes tax issues to tax professionals', () => {
  assert.equal(getRecommendedProfessionalRole('What penalty applies if I miss my tax payment?'), 'tax_agent');
  assert.equal(getRecommendedProfessionalRole('I need help filing VAT with FIRS'), 'tax_agent');
  assert.equal(getProfessionalLabel('tax_agent'), 'Tax Professional');
});

test('routes company registration and accounting issues to matching professionals', () => {
  assert.equal(getRecommendedProfessionalRole('How do I register my business with CAC?'), 'cac_agent');
  assert.equal(getRecommendedProfessionalRole('I need an accountant to audit my books'), 'accountant');
});

test('defaults legal disputes and unspecified enquiries to lawyers', () => {
  assert.equal(getRecommendedProfessionalRole('My landlord is threatening to evict me'), 'lawyer');
  assert.equal(getRecommendedProfessionalRole(''), 'lawyer');
});
