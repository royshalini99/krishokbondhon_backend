const path = require('path');
const { Storage } = require('@google-cloud/storage');

/**
 * Handles uploading post images to Google Cloud Storage instead of local
 * disk. This matters specifically because Cloud Run containers are
 * stateless — anything written to local disk disappears when the
 * container restarts (which happens often, sometimes seconds after a
 * request), and a second container instance won't see files the first
 * one saved. GCS is a permanent, shared place for files that any
 * instance can read/write.
 *
 * Authentication: on Cloud Run, this works automatically — no key file
 * needed — as long as the Cloud Run service account has the
 * "Storage Object Admin" role on the bucket (see README's deployment
 * walkthrough). For local development, set GOOGLE_APPLICATION_CREDENTIALS
 * in your .env to point at a downloaded service account JSON key.
 */
const storage = new Storage();

function getBucket() {
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('GCS_BUCKET_NAME is not set — see .env.example');
  }
  return storage.bucket(bucketName);
}

/**
 * Uploads a single in-memory file buffer (from multer's memoryStorage)
 * and returns its public URL. The bucket must be configured for public
 * read access — see README for the exact gcloud command — since this is
 * simplest for a farmer-facing app showing publicly viewable post photos.
 */
async function uploadImage(buffer, originalName, mimeType) {
  const bucket = getBucket();
  const objectName = `posts/${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(originalName)}`;
  const file = bucket.file(objectName);

  await file.save(buffer, {
    contentType: mimeType,
    metadata: { cacheControl: 'public, max-age=31536000' },
  });

  return `https://storage.googleapis.com/${bucket.name}/${objectName}`;
}

module.exports = { uploadImage };
