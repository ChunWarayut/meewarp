const axios = require('axios');
const FormData = require('form-data');
const config = require('../config/env');

const { accountId, apiToken, deliveryUrl, defaultVariant } = config.cloudflareImages;

function ensureConfigured() {
  if (!accountId || !apiToken) {
    throw new Error('Cloudflare Images credentials are not configured');
  }
}

function buildDeliveryUrl(result) {
  if (!result) {
    return null;
  }

  const variants = Array.isArray(result.variants) ? result.variants : [];
  if (deliveryUrl && result.id) {
    const variant = defaultVariant || (variants[0] ? variants[0].split('/').pop() : 'public');
    return `${deliveryUrl.replace(/\/$/, '')}/${result.id}/${variant}`;
  }

  if (variants.length > 0) {
    if (defaultVariant) {
      const preferred = variants.find((variantUrl) => variantUrl.endsWith(`/${defaultVariant}`));
      if (preferred) {
        return preferred;
      }
    }
    return variants[0];
  }

  return null;
}

async function uploadImageFromBuffer(buffer, fileName, metadata = {}) {
  ensureConfigured();
  if (!buffer) {
    throw new Error('Missing image buffer');
  }

  const form = new FormData();
  form.append('file', buffer, fileName || 'upload.jpg');
  if (metadata && Object.keys(metadata).length > 0) {
    form.append('metadata', JSON.stringify(metadata));
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;

  let response;
  try {
    response = await axios.post(endpoint, form, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        ...form.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
  } catch (error) {
    const detail = error.response?.data?.errors?.[0]?.message || error.message;
    throw new Error(`Cloudflare Images upload failed: ${detail}`);
  }

  if (!response.data?.success) {
    const detail = response.data?.errors?.[0]?.message;
    throw new Error(`Cloudflare Images upload failed${detail ? `: ${detail}` : ''}`);
  }

  const { result } = response.data;
  return {
    id: result.id,
    url: buildDeliveryUrl(result),
    variants: result.variants,
  };
}

async function uploadImageFromMulterFile(file, metadata = {}) {
  if (!file) {
    throw new Error('Missing uploaded file');
  }
  return uploadImageFromBuffer(file.buffer, file.originalname, metadata);
}

function extractImageIdFromUrl(imageUrl) {
  if (!imageUrl) return null;
  try {
    const url = new URL(imageUrl, 'http://dummy.local');
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length >= 2) {
      return segments[segments.length - 2];
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function deleteImageById(imageId) {
  ensureConfigured();
  if (!imageId) return;

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${imageId}`;
  try {
    await axios.delete(endpoint, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });
  } catch (error) {
    // Swallow 404s or auth errors silently but log others
    if (error.response?.status && error.response.status !== 404) {
      console.error('Failed to delete Cloudflare image', error.response?.data || error.message);
    }
  }
}

async function deleteImageByUrl(imageUrl) {
  const imageId = extractImageIdFromUrl(imageUrl);
  if (!imageId) {
    return;
  }
  await deleteImageById(imageId);
}

module.exports = {
  uploadImageFromBuffer,
  uploadImageFromMulterFile,
  deleteImageById,
  deleteImageByUrl,
};
