import { Routes } from '@angular/router';
import { EditorComponent } from '../editor/editor/editor.component';
import { FileXComponent } from '../FileX/file-x.component';

export const routes: Routes = [
  {
    path: '', // Deafult / route will render the editor for the window it is opened in
    component: EditorComponent,
  },
  {
    path: 'file-x', // For routes of file-x it will render out custom file explorer
    component: FileXComponent,
  },
];
