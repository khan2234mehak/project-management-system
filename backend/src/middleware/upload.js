const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

// Ensure target folders exist (defensive — repo ships them, but just in case)
['avatars', 'attachments'].forEach((dir) => {
  const full = path.join(UPLOAD_ROOT, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

function makeStorage(folder) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(UPLOAD_ROOT, folder)),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
  'application/zip',
];

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const MAX_FILE_SIZE = (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;

function fileFilterFactory(allowedTypes) {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  };
}

const uploadAvatar = multer({
  storage: makeStorage('avatars'),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilterFactory(ALLOWED_AVATAR_TYPES),
});

const uploadAttachment = multer({
  storage: makeStorage('attachments'),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilterFactory(ALLOWED_ATTACHMENT_TYPES),
});

module.exports = { uploadAvatar, uploadAttachment };
