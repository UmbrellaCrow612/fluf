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
}
