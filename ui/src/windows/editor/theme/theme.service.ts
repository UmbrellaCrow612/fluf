import { inject, Injectable } from '@angular/core';
import { cssVar } from './type';
import { EditorContextService } from '../app-context/editor-context.service';

/**
 * Used to change, create or edit the applications theme throughg chaning it's css vars defined globally
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly contextService = inject(EditorContextService);

  /**
   * Globally set css var values and then persist it between sessions
   * @param object The object which contains the css var as a field then its value
   */
  set(object: cssVar[]): void {
    let first = object[0];

    if (!first || !first?.property || !first?.value) {
      console.error("Cannot set theme as it's invalid object of shape css var");
      return;
    }

    const root = document.documentElement;

    Object.entries(object).forEach(([_, value]) => {
      root.style.setProperty(`--${value.property}`, value.value);
    });

    this.contextService.editorTheme.set(JSON.stringify(object));
  }
}
