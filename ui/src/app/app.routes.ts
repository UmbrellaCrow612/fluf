import { Routes } from '@angular/router';
import { EditorComponent } from '../features/editor/editor.component';
import { FileXComponent } from '../features/FileX/file-x.component';

export const routes: Routes = [
  {
    path: '',
    component: EditorComponent,
  },
  {
    path: 'file-x',
    component: FileXComponent,
  },
];
