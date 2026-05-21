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
