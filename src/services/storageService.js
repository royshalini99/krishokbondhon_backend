/**
 * Single entry point the rest of the app calls for image uploads. Which
 * actual driver runs underneath is controlled by one environment
 * variable, so switching from free local development to Google Cloud
 * Storage in production is a config change, not a code change.
 *
 *   STORAGE_DRIVER=local  (default) — saves to ./uploads, zero setup, zero cost.
 *   STORAGE_DRIVER=gcs             — saves to Google Cloud Storage (see
 *                                     README's "Deploying to Google Cloud
 *                                     Run" section for how to provision
 *                                     the bucket).
 *
 * The driver is required lazily (only the one you're actually using) so
 * local development never needs the @google-cloud/storage package to do
 * anything beyond sit in node_modules — no GCP credentials, no billing
 * account, nothing, until you actually flip the switch.
 */
function getDriver() {
  const driver = (process.env.STORAGE_DRIVER || 'local').toLowerCase();

  if (driver === 'gcs') {
    return require('./storage/gcsDriver');
  }
  if (driver === 'local') {
    return require('./storage/localDriver');
  }
  throw new Error(`Unknown STORAGE_DRIVER "${driver}" — expected "local" or "gcs".`);
}

async function uploadImage(buffer, originalName, mimeType) {
  return getDriver().uploadImage(buffer, originalName, mimeType);
}

module.exports = { uploadImage };
