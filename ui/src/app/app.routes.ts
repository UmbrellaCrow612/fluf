import { Routes } from "@angular/router";
import { EditorMainComponent } from "../windows/editor/editor-main/editor-main.component";

export const routes: Routes = [
  {
    path: "", // Deafult / route will render the editor for the window it is opened in
    component: EditorMainComponent,
  },
];
