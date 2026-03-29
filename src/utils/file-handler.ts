import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MultipartFile } from '@fastify/multipart';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);

export interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
}

/**
 * Ensure the upload directory exists
 */
export async function ensureUploadDirectory(): Promise<void> {
  const uploadDir = path.resolve(UPLOAD_DIR);

  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  // Create subdirectories for different content types
  const subdirs = ['payam', 'quran', 'raahbar', path.join('raahbar', 'thumbnails')];
  for (const subdir of subdirs) {
    const subdirPath = path.join(uploadDir, subdir);
    try {
      await fs.access(subdirPath);
    } catch {
      await fs.mkdir(subdirPath, { recursive: true });
    }
  }
}

/**
 * Validate that the file is a PDF
 */
export function isPdfFile(mimeType: string, filename: string): boolean {
  return mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf');
}

/**
 * Generate a safe filename with UUID to prevent collisions
 */
function generateSafeFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename).toLowerCase();
  const uuid = uuidv4();
  const timestamp = Date.now();
  return `${timestamp}-${uuid}${ext}`;
}

/**
 * Save an uploaded file to the appropriate directory
 */
export async function saveUploadedFile(
  file: MultipartFile,
  contentType: 'payam' | 'quran' | 'raahbar'
): Promise<UploadedFile> {
  const originalFilename = file.filename;
  const mimeType = file.mimetype;

  // Validate PDF
  if (!isPdfFile(mimeType, originalFilename)) {
    throw new Error('Only PDF files are allowed');
  }

  const safeFilename = generateSafeFilename(originalFilename);
  const uploadDir = path.resolve(UPLOAD_DIR);
  const targetDir = path.join(uploadDir, contentType);
  const targetPath = path.join(targetDir, safeFilename);

  // Get file buffer and save
  const buffer = await file.toBuffer();
  await fs.writeFile(targetPath, buffer);

  // Get file stats for size
  const stats = await fs.stat(targetPath);

  return {
    filename: safeFilename,
    originalName: originalFilename,
    path: targetPath,
    mimeType,
    size: stats.size,
  };
}

const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function isImageFile(mimeType: string, filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  if (IMAGE_MIME.has(mimeType)) return true;
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
}

/**
 * Save an uploaded thumbnail image (Raahbar books) under uploads/raahbar/thumbnails/
 */
export async function saveUploadedThumbnail(file: MultipartFile): Promise<UploadedFile> {
  const originalFilename = file.filename;
  const mimeType = file.mimetype;

  if (!isImageFile(mimeType, originalFilename)) {
    throw new Error('Only JPEG, PNG, WebP, or GIF images are allowed for thumbnails');
  }

  const safeFilename = generateSafeFilename(originalFilename);
  const uploadDir = path.resolve(UPLOAD_DIR);
  const targetDir = path.join(uploadDir, 'raahbar', 'thumbnails');
  const targetPath = path.join(targetDir, safeFilename);

  const buffer = await file.toBuffer();
  await fs.writeFile(targetPath, buffer);
  const stats = await fs.stat(targetPath);

  return {
    filename: safeFilename,
    originalName: originalFilename,
    path: targetPath,
    mimeType,
    size: stats.size,
  };
}

/**
 * Delete an uploaded file
 */
export async function deleteUploadedFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File might not exist, which is okay
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Get the relative path from uploads directory
 */
export function getRelativePath(absolutePath: string): string {
  const uploadDir = path.resolve(UPLOAD_DIR);
  return path.relative(uploadDir, absolutePath);
}
