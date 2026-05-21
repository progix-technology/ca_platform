import { normalizeCategory } from '../constants/serviceCategories';

const CATEGORY_ICONS = {
  'Company Incorporation': '🏢',
  'Compliance Services': '💼',
  'Business Services': '🧾',
  'Accounting Services': '📊',
  Consulting: '🧠',
  'Licenses & Registration': '📝',
  'Miscellaneous Services': '📋',
};

export const normalizeService = (service = {}) => {
  const category = normalizeCategory(service.category);
  const documents = Array.isArray(service.documents)
    ? service.documents
    : Array.isArray(service.documentsRequired)
      ? service.documentsRequired
      : [];

  return {
    ...service,
    id: service.id || service._id,
    icon: service.icon || CATEGORY_ICONS[category] || '📋',
    duration: service.duration || '2-5 days',
    popular: Boolean(service.popular),
    fullDescription: service.fullDescription || service.description || 'No description available.',
    documents,
  };
};
