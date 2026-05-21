import { v2 as cloudinary } from 'cloudinary';

let cloudinaryInitialized = false;

const normalizeEnvValue = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return '';
  }

  // Remove wrapping quotes to avoid accidental secret/key mismatch from copied .env values.
  return trimmed.replace(/^['"]|['"]$/g, '').trim();
};

const getCloudinaryEnv = () => ({
  cloudName: normalizeEnvValue(process.env.CLOUDINARY_CLOUD_NAME),
  apiKey: normalizeEnvValue(process.env.CLOUDINARY_API_KEY),
  apiSecret: normalizeEnvValue(process.env.CLOUDINARY_API_SECRET),
  cloudinaryUrl: normalizeEnvValue(process.env.CLOUDINARY_URL),
});

const isPlaceholderValue = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized.startsWith('replace_') || normalized.startsWith('your_');
};

const validateCloudinaryEnv = ({ cloudName, apiKey, apiSecret, cloudinaryUrl }) => {
  if (cloudinaryUrl) {
    return;
  }

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials are not configured on the server');
  }

  if (isPlaceholderValue(cloudName) || isPlaceholderValue(apiKey) || isPlaceholderValue(apiSecret)) {
    throw new Error('Cloudinary credentials are placeholders. Please set real values from Cloudinary Dashboard.');
  }

  if (apiKey === apiSecret) {
    throw new Error(
      'Invalid Cloudinary credentials: CLOUDINARY_API_SECRET is the same as CLOUDINARY_API_KEY. Please use the API Secret from Cloudinary Dashboard.',
    );
  }
};

export const hasCloudinaryConfig = () => {
  const { cloudName, apiKey, apiSecret, cloudinaryUrl } = getCloudinaryEnv();

  if (cloudinaryUrl) {
    return true;
  }

  return Boolean(
    cloudName
      && apiKey
      && apiSecret,
  );
};

export const initCloudinary = () => {
  if (cloudinaryInitialized) {
    return true;
  }

  const config = getCloudinaryEnv();

  validateCloudinaryEnv(config);

  if (config.cloudinaryUrl) {
    cloudinary.config(config.cloudinaryUrl);
  } else {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
    });
  }

  cloudinaryInitialized = true;
  return true;
};

export const uploadImageToCloudinary = async (imageData, options = {}) => {
  initCloudinary();

  return cloudinary.uploader.upload(imageData, {
    resource_type: 'image',
    folder: 'ca-platform/profile-images',
    ...options,
  });
};

export const uploadDocumentToCloudinary = async (file, options = {}) => {
  initCloudinary();

  if (!file?.buffer) {
    throw new Error('Document buffer is missing');
  }

  const dataUri = `data:${file.mimetype || 'application/octet-stream'};base64,${file.buffer.toString('base64')}`;

  return cloudinary.uploader.upload(dataUri, {
    resource_type: 'auto',
    folder: 'ca-platform/documents',
    ...options,
  });
};

export const deleteAssetFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) {
    return;
  }

  if (!hasCloudinaryConfig()) {
    return;
  }

  initCloudinary();

  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
};

export const deleteImageFromCloudinary = async (publicId) => {
  if (!publicId) {
    return;
  }

  if (!hasCloudinaryConfig()) {
    return;
  }

  initCloudinary();

  await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
  });
};
