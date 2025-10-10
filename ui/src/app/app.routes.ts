import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('../features/home/home.routes').then((m) => m.homeRoutes),
  },
  {
    path: 'editor',
    loadChildren: () =>
      import('../features/editor/editor.routes').then((m) => m.editorRoutes),
  },
];
