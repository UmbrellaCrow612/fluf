import { Injectable } from '@angular/core';

/**
 * Used to fetch images from local diskl using custom protocol defined
 */
@Injectable({
  providedIn: 'root',
})
export class ImageService {
  /**
   * Custom backend protocol defined for image transfers
   */
  private readonly basePath = `image://`;

  /**
   * Get a local img by it's absoloute path
   * @param filePath The absoloute file path to the local img to fetch
   */
  async getLocalImg(filePath: string): Promise<Response> {
    let path = this.basePath + filePath;

    return await fetch(path);
  }
}
