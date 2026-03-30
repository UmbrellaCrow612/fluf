import { Injectable } from '@angular/core';

/**
 * Handles editor logic related to videos.
 */
@Injectable({
  providedIn: 'root',
})
export class EditorVideoService {
  /**
   * List of file extensions for video formats supported by the video editor.
   * Used to determine if a file can be opened in the video editor.
   */
  public readonly supportedVideoExtensions = [
    '.mp4',
    '.webm',
    '.ogg',
    '.ogv',
    '.mov',
    '.mkv',
    '.avi',
    '.flv',
    '.wmv',
    '.m4v',
    '.3gp',
    '.3g2',
    '.mpg',
    '.mpeg',
    '.m2v',
    '.m4p',
  ];

  /**
   * Checks if a file extension is supported by the video editor.
   * Comparison is case-insensitive.
   * @param extension - The file extension to check (e.g., '.mp4', '.MOV')
   * @returns True if the extension is supported, false otherwise
   */
  public isSupportedExtension(extension: string): boolean {
    const normalized = extension.toLowerCase();
    return this.supportedVideoExtensions.includes(normalized);
  }

  /**
   * Extracts extension from a filename and checks if it's supported.
   * @param filename - The filename to check (e.g., 'video.mp4')
   * @returns True if the file's extension is supported, false otherwise
   */
  public isSupportedFilename(filename: string): boolean {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return false;
    const extension = filename.slice(lastDot).toLowerCase();
    return this.isSupportedExtension(extension);
  }
}
