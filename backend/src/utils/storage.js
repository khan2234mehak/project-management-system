// Storage adapter — abstracts "where do uploaded files live".
// Default: local disk under src/uploads/.
// Set STORAGE_PROVIDER=cloudinary in .env (+ credentials) to switch.
//
// Both branches expose the same shape so controllers never need to know
// which provider is active: { url, publicId, provider }.

const path = require('path');
const fs = require('fs');

const PROVIDER = process.env.STORAGE_PROVIDER || 'local';

let cloudinary = null;
if (PROVIDER === 'cloudinary') {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

/**
 * Persist a file already written to a temp/local path by multer.
 * Returns { url, publicId, provider }.
 */
async function saveFile(localFilePath, { folder = 'attachments', originalName } = {}) {
  if (PROVIDER === 'cloudinary') {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: `pms/${folder}`,
      resource_type: 'auto',
    });
    // Clean up the temp file multer left behind locally
    fs.unlink(localFilePath, () => {});
    return { url: result.secure_url, publicId: result.public_id, provider: 'cloudinary' };
  }

  // Local provider: multer already wrote the file under uploads/<folder>/.
  // Build a relative URL the frontend can hit via /uploads/...
  const fileName = path.basename(localFilePath);
  const relativeUrl = `/uploads/${folder}/${fileName}`;
  return { url: relativeUrl, publicId: fileName, provider: 'local' };
}

/**
 * Delete a previously stored file.
 */
async function deleteFile(publicIdOrPath, { folder = 'attachments' } = {}) {
  if (PROVIDER === 'cloudinary') {
    await cloudinary.uploader.destroy(publicIdOrPath, { resource_type: 'auto' });
    return true;
  }

  const filePath = path.join(UPLOAD_ROOT, folder, publicIdOrPath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  return true;
}

module.exports = { saveFile, deleteFile, PROVIDER };
