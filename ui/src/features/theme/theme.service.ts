import { Injectable } from '@angular/core';

/**
 * Used to change, create or edit the applications theme throughg chaning it's css vars defined globally
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  /**
   * Globally set css var values
   * @param object The object which contains the css var as a field then its value
   */
  set(object: Record<string, string>): void {
    // Get the document root element (usually :root or html)
    const root = document.documentElement;

    // Iterate through each property in the object
    Object.entries(object).forEach(([key, value]) => {
      // Set the CSS variable with -- prefix
      root.style.setProperty(`--${key}`, value);
    });
  }
}
