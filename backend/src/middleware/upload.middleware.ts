import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE     = 5 * 1024 * 1024; // 5 MB

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WEBP'));
  }
};

const storage = multer.memoryStorage();

/** Single image field named "image" (for posts) */
export const uploadPostImage = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } })
  .single('image');

/** Two optional fields: "avatar" and "headerPhoto" (for profile updates) */
export const uploadProfileImages = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } })
  .fields([{ name: 'avatar', maxCount: 1 }, { name: 'headerPhoto', maxCount: 1 }]);
