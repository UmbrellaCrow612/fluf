import { Injectable } from '@angular/core';

/**
 * Used to construct the pdf URL from local disk using custom protocol defined
 */
@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private readonly basePath = 'pdf://';

  /**
   * Get the url to a local pdf over custom protocol to serve via a iframe
   * @param filePath The absoloute path to the file
   * @returns The full pdf:// URL string
   */
  getLocalPdfUrl(filePath: string): string {
    return this.basePath + filePath;
  }
}
