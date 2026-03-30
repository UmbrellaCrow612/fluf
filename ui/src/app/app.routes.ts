import { Routes } from '@angular/router';
import { FileXComponent } from '../windows/FileX/file-x.component';
import { EditorMainComponent } from '../windows/editor/editor-main/editor-main.component';

export const routes: Routes = [
  {
    path: '', // Deafult / route will render the editor for the window it is opened in
    component: EditorMainComponent,
  },
  {
    path: 'file-x', // For routes of file-x it will render out custom file explorer
    component: FileXComponent,
  },
];
