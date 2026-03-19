import { Injectable } from '@angular/core';

/**
 * Used to fetch local files from system
 */
@Injectable({
  providedIn: 'root',
})
export class LocalFileUrlService {
  /**
   * Generates a fluf:// URL for use in img src attributes
   * @param filePath - Absolute path to the local file
   * @returns URL string formatted as fluf://path
   * 
   * @example
   * // In component template:
   * <img [src]="editorFileService.get('/Users/name/Pictures/photo.jpg')" />
   * 
   * // Or in component class:
   * imageUrl = this.editorFileService.get('C:\\Users\\name\\Pictures\\photo.jpg');
   */
  toUrl(filePath: string): string {
    return `fluf://${filePath}`;
  }
}