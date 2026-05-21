import Service from '../models/Service.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import { normalizeCategory, getCategoryQueryValues } from '../utils/serviceCategories.js';

export const getServices = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const search = req.query.search?.trim() || '';
  const category = req.query.category?.trim() || '';

  const query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) {
    const categoryValues = getCategoryQueryValues(category);
    query.category = { $in: categoryValues };
  }

  const skip = (page - 1) * limit;

  const [services, totalItems] = await Promise.all([
    Service.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Service.countDocuments(query),
  ]);

  return sendResponse(res, 200, true, 'Services fetched successfully', {
    items: services,
    pagination: {
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      pageSize: limit,
      hasNextPage: page * limit < totalItems,
      hasPreviousPage: page > 1,
    },
  });
});

export const getServiceById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    throw new ApiError(404, 'Service not found');
  }

  return sendResponse(res, 200, true, 'Service fetched successfully', {
    service,
  });
});

export const createService = asyncHandler(async (req, res) => {
  const { title, description, price, category, documentsRequired, formSchema, planTier } = req.body;

  const service = await Service.create({
    title,
    description,
    price,
    category: normalizeCategory(category),
    documentsRequired: Array.isArray(documentsRequired) ? documentsRequired : [],
    formSchema: formSchema || {},
    planTier: planTier || 'basic',
  });

  return sendResponse(res, 201, true, 'Service created successfully', {
    service,
  });
});

export const updateService = asyncHandler(async (req, res) => {
  const { title, description, price, category, documentsRequired, formSchema, planTier } = req.body;

  const service = await Service.findById(req.params.id);
  if (!service) {
    throw new ApiError(404, 'Service not found');
  }

  service.title = title ?? service.title;
  service.description = description ?? service.description;
  service.price = price ?? service.price;
  service.planTier = planTier ?? service.planTier;
  if (category !== undefined) {
    service.category = normalizeCategory(category);
  }

  if (documentsRequired !== undefined) {
    service.documentsRequired = Array.isArray(documentsRequired) ? documentsRequired : service.documentsRequired;
  }

  if (formSchema !== undefined) {
    service.formSchema = formSchema || service.formSchema;
  }

  const updated = await service.save();

  return sendResponse(res, 200, true, 'Service updated successfully', {
    service: updated,
  });
});

export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    throw new ApiError(404, 'Service not found');
  }

  await service.deleteOne();

  return sendResponse(res, 200, true, 'Service deleted successfully', {});
});
