const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'uploads');

/**
 * Saves an uploaded image straight to the local `uploads/` folder and
 * serves it back out via the static file route mounted in app.js.
 *
 * This is the right choice while developing for free on your own machine
 * — there's no Google Cloud Storage bucket, no billing account, nothing
 * to set up. It stops being the right choice the moment this app runs on
 * Cloud Run (or any platform with more than one instance / ephemeral
 * disk), because a file saved by one instance won't be visible to
 * another, and disappears when the instance restarts. See gcsDriver.js
 * for the production equivalent — switch to it via STORAGE_DRIVER=gcs.
 */
async function uploadImage(buffer, originalName) {
  await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });

  const objectName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(originalName)}`;
  await fs.promises.writeFile(path.join(UPLOADS_DIR, objectName), buffer);

  // Matches the static route: app.use('/uploads', express.static(...))
  return `/uploads/${objectName}`;
}

module.exports = { uploadImage };
