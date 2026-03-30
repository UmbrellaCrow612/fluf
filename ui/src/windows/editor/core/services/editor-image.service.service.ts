import { Injectable } from '@angular/core';

/**
 * Handles editor logic related to images.
 */
@Injectable({
  providedIn: 'root',
})
export class EditorImageService {
  /**
   * List of file extensions for image formats supported by the image editor.
   * Used to determine if a file can be opened in the image editor.
   */
  public readonly supportedImageExtensions = [
    '.apng',
    '.avif',
    '.bmp',
    '.gif',
    '.ico',
    '.jpg',
    '.jpeg',
    '.jfif',
    '.pjpeg',
    '.pjp',
    '.png',
    '.svg',
    '.tif',
    '.tiff',
    '.webp',
  ];

  /**
   * Checks if a file extension is supported by the image editor.
   * Comparison is case-insensitive.
   * @param extension - The file extension to check (e.g., '.png', '.JPG')
   * @returns True if the extension is supported, false otherwise
   */
  public isSupportedExtension(extension: string): boolean {
    const normalized = extension.toLowerCase();
    return this.supportedImageExtensions.includes(normalized);
  }

  /**
   * Extracts extension from a filename and checks if it's supported.
   * @param filename - The filename to check (e.g., 'image.png')
   * @returns True if the file's extension is supported, false otherwise
   */
  public isSupportedFilename(filename: string): boolean {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return false;
    const extension = filename.slice(lastDot).toLowerCase();
    return this.isSupportedExtension(extension);
  }
}
