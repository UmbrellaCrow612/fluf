import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from "@angular/core";
import { provideRouter, withHashLocation } from "@angular/router";

import { routes } from "./app.routes";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { EditorHydrationService } from "../windows/editor/core/hydration/editor-hydration.service";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withFetch()),
    provideAppInitializer(() => {
      const editorHydrationService = inject(EditorHydrationService);
      return editorHydrationService.hydrate();
    }),
  ],
};
