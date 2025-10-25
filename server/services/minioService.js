const { Client } = require('minio');
const crypto = require('crypto');
const config = require('../config/env');

// MinIO client configuration - Use Direct IP to bypass Kong/SSL issues
const minioClient = new Client({
  endPoint: config.minio.endpoint,
  port: config.minio.port,
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
});

const bucketName = config.minio.bucketName;

console.log(`🔗 MinIO Config: ${config.minio.endpoint}:${config.minio.port} (SSL: ${config.minio.useSSL})`);
console.log(`📦 Bucket: ${bucketName}`);

/**
 * Initialize MinIO bucket
 */
async function ensureBucket() {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`✅ Created MinIO bucket: ${bucketName}`);
      
      // Set bucket policy to public read
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    } else {
      console.log(`✅ MinIO bucket already exists: ${bucketName}`);
    }
  } catch (error) {
    // Ignore "BucketAlreadyOwnedByYou" error
    if (error.code === 'BucketAlreadyOwnedByYou' || error.message.includes('already own it')) {
      console.log(`✅ MinIO bucket already exists: ${bucketName}`);
      return;
    }
    console.error('❌ MinIO bucket initialization failed:', error.message);
    // Don't throw, just log - allow service to continue
  }
}

/**
 * Generate unique filename
 */
function generateFileName(originalName, metadata = {}) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const ext = originalName.split('.').pop() || 'jpg';
  const prefix = metadata.type || 'image';
  return `${prefix}/${timestamp}-${random}.${ext}`;
}

/**
 * Upload image from buffer to MinIO
 */
async function uploadImageFromBuffer(buffer, fileName, metadata = {}) {
  try {
    await ensureBucket();

    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Invalid image buffer');
    }

    const objectName = generateFileName(fileName, metadata);
    const metaData = {
      'Content-Type': metadata.contentType || 'image/jpeg',
      'X-Upload-Type': metadata.type || 'image',
      'X-Store-Id': metadata.storeId || 'default',
    };

    await minioClient.putObject(bucketName, objectName, buffer, buffer.length, metaData);

    // Use Kong domain for public URLs (for display/download)
    // Direct IP is only for upload/delete operations
    const url = `https://s3.mee-warp.com/${bucketName}/${objectName}`;

    return {
      id: objectName,
      url,
      bucket: bucketName,
      size: buffer.length,
    };
  } catch (error) {
    console.error('❌ MinIO upload failed:', error.message);
    throw new Error(`MinIO upload failed: ${error.message}`);
  }
}

/**
 * Upload image from Multer file
 */
async function uploadImageFromMulterFile(file, metadata = {}) {
  if (!file || !file.buffer) {
    throw new Error('Missing uploaded file');
  }

  return uploadImageFromBuffer(file.buffer, file.originalname, {
    ...metadata,
    contentType: file.mimetype,
  });
}

/**
 * Upload image from Base64 string
 */
async function uploadImageFromBase64(base64String, fileName = 'image.jpg', metadata = {}) {
  try {
    // Remove data:image/xxx;base64, prefix if exists
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    return uploadImageFromBuffer(buffer, fileName, metadata);
  } catch (error) {
    console.error('❌ Base64 to MinIO upload failed:', error.message);
    throw new Error(`Base64 upload failed: ${error.message}`);
  }
}

/**
 * Extract object name from URL
 */
function extractObjectNameFromUrl(imageUrl) {
  if (!imageUrl) return null;
  
  try {
    const url = new URL(imageUrl);
    // Extract path after bucket name
    // Format: https://s3.mee-warp.com/mee-warp/prefix/filename.ext
    // Or: http://43.249.35.14:29000/mee-warp/prefix/filename.ext
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    if (pathParts.length >= 2 && pathParts[0] === bucketName) {
      // Remove bucket name and join the rest
      return pathParts.slice(1).join('/');
    }
    
    // Fallback: assume everything after first slash is object name
    return url.pathname.substring(1);
  } catch (error) {
    console.error('Failed to extract object name:', error.message);
    return null;
  }
}

/**
 * Delete image by object name
 */
async function deleteImageByObjectName(objectName) {
  if (!objectName) return;

  try {
    await minioClient.removeObject(bucketName, objectName);
    console.log(`🗑️  Deleted MinIO object: ${objectName}`);
  } catch (error) {
    // Ignore errors (object might not exist)
    if (error.code !== 'NoSuchKey') {
      console.error('Failed to delete MinIO object:', error.message);
    }
  }
}

/**
 * Delete image by URL
 */
async function deleteImageByUrl(imageUrl) {
  const objectName = extractObjectNameFromUrl(imageUrl);
  if (!objectName) {
    console.warn('Could not extract object name from URL:', imageUrl);
    return;
  }
  await deleteImageByObjectName(objectName);
}

/**
 * Delete image by ID (alias for object name)
 */
async function deleteImageById(objectName) {
  await deleteImageByObjectName(objectName);
}

/**
 * Get presigned URL for private objects (optional)
 */
async function getPresignedUrl(objectName, expirySeconds = 3600) {
  try {
    return await minioClient.presignedGetObject(bucketName, objectName, expirySeconds);
  } catch (error) {
    console.error('Failed to generate presigned URL:', error.message);
    return null;
  }
}

// Initialize bucket on module load
ensureBucket().catch((error) => {
  console.error('Failed to initialize MinIO bucket:', error.message);
});

module.exports = {
  uploadImageFromBuffer,
  uploadImageFromMulterFile,
  uploadImageFromBase64,
  deleteImageById,
  deleteImageByUrl,
  deleteImageByObjectName,
  getPresignedUrl,
  minioClient,
  bucketName,
};

