import { Injectable } from '@angular/core';

/**
 * Handles editor logic related to audio files.
 */
@Injectable({
  providedIn: 'root',
})
export class EditorAudioService {
  /**
   * List of file extensions for audio formats supported by the audio editor.
   * Used to determine if a file can be opened in the audio editor.
   */
  public readonly supportedAudioExtensions = [
    '.mp3',
    '.wav',
    '.ogg',
    '.oga',
    '.aac',
    '.m4a',
    '.flac',
    '.wma',
    '.aiff',
    '.au',
    '.opus',
    '.weba',
    '.webm',
    '.3gp',
    '.3g2',
    '.mp2',
    '.mpga',
    '.mid',
    '.midi',
    '.kar',
  ];

  /**
   * Checks if a file extension is supported by the audio editor.
   * Comparison is case-insensitive.
   * @param extension - The file extension to check (e.g., '.mp3', '.WAV')
   * @returns True if the extension is supported, false otherwise
   */
  public isSupportedExtension(extension: string): boolean {
    const normalized = extension.toLowerCase();
    return this.supportedAudioExtensions.includes(normalized);
  }

  /**
   * Extracts extension from a filename and checks if it's supported.
   * @param filename - The filename to check (e.g., 'audio.mp3')
   * @returns True if the file's extension is supported, false otherwise
   */
  public isSupportedFilename(filename: string): boolean {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return false;
    const extension = filename.slice(lastDot).toLowerCase();
    return this.isSupportedExtension(extension);
  }
}
