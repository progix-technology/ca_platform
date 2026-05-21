export const SERVICE_CATEGORIES = [
  'Company Incorporation',
  'Compliance Services',
  'Business Services',
  'Accounting Services',
  'Consulting',
  'Licenses & Registration',
  'Miscellaneous Services',
];

const CATEGORY_NORMALIZATION_MAP = {
  tax: 'Accounting Services',
  gst: 'Business Services',
  company: 'Company Incorporation',
  audit: 'Compliance Services',
  compliance: 'Compliance Services',
  'company incorporation': 'Company Incorporation',
  'compliance services': 'Compliance Services',
  'business services': 'Business Services',
  'accounting services': 'Accounting Services',
  consulting: 'Consulting',
  'licenses & registration': 'Licenses & Registration',
  'miscellaneous services': 'Miscellaneous Services',
};

const CATEGORY_SYNONYMS = {
  'Company Incorporation': ['Company', 'Company Incorporation'],
  'Compliance Services': ['Compliance', 'Audit', 'Compliance Services'],
  'Business Services': ['GST', 'Business Services'],
  'Accounting Services': ['Tax', 'Accounting Services'],
  Consulting: ['Consulting'],
  'Licenses & Registration': ['Licenses & Registration'],
  'Miscellaneous Services': ['Miscellaneous Services'],
};

export const normalizeCategory = (category) => {
  const value = String(category || '').trim();
  if (!value) {
    return 'Miscellaneous Services';
  }

  if (SERVICE_CATEGORIES.includes(value)) {
    return value;
  }

  const normalizedKey = value.toLowerCase();
  return CATEGORY_NORMALIZATION_MAP[normalizedKey] || 'Miscellaneous Services';
};

export const getCategoryQueryValues = (category) => {
  const normalized = normalizeCategory(category);
  return CATEGORY_SYNONYMS[normalized] || [normalized];
};
