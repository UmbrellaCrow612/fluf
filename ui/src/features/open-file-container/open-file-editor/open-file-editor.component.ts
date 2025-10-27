import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ContextService } from '../../app-context/app-context.service';
import { getElectronApi } from '../../../utils';

import * as monaco from 'monaco-editor'

@Component({
  selector: 'app-open-file-editor',
  templateUrl: './open-file-editor.component.html',
  styleUrls: ['./open-file-editor.component.css'],
})
export class OpenFileEditorComponent implements OnInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = getElectronApi();

  openFileNode: fileNode | null = null;
  error: string | null = null;
  isLoading = false;

  stringContent = '';

  private editor: monaco.editor.IStandaloneCodeEditor | null = null;

  async ngOnInit() {
    this.openFileNode = this.appContext.getSnapshot().currentOpenFileInEditor;
    if (this.openFileNode) {
      await this.displayFile();
    }

    this.appContext.autoSub(
      'currentOpenFileInEditor',
      async (ctx) => {
        this.openFileNode = ctx.currentOpenFileInEditor;
        if (this.openFileNode) {
          await this.displayFile();
        } else {
          this.disposeEditor();
        }
      },
      this.destroyRef
    );
  }

  private async displayFile() {
    this.error = null;
    this.isLoading = true;

    if (!this.openFileNode) {
      this.error = `Could not read file`;
      this.isLoading = false;
      return;
    }

    this.stringContent = await this.api.readFile(
      undefined,
      this.openFileNode.path
    );

    this.appContext.update('fileExplorerActiveFileOrFolder', this.openFileNode);

    this.isLoading = false;

    this.renderMonacoEditor();
  }

  private renderMonacoEditor() {

    const container = document.getElementById('editor_container');
    if (!container) {
      this.error = 'Could not find editor element';
      return;
    }

    container.style.width = '100%';
    container.style.height = '100%';

    if (this.editor) {
      this.disposeEditor();
    }

    this.editor = monaco.editor.create(container, {
      value: this.stringContent,
      language: this.detectLanguage(this.openFileNode?.path),
      theme: 'vs-dark',
      automaticLayout: true,
    });
  }

  private disposeEditor() {
    if (this.editor) {
      this.editor.dispose(); // dispose Monaco instance
      this.editor = null;
    }

    this.stringContent = '';

    const container = document.getElementById('editor_container');
    if (container) {
      container.innerHTML = ''; 
      container.style.width = ''; 
      container.style.height = '';
    }
  }

  /**
   * Simple language detection based on file extension
   */
  private detectLanguage(filePath?: string): string {
    if (!filePath) return 'plaintext';
    if (filePath.endsWith('.ts')) return 'typescript';
    if (filePath.endsWith('.js')) return 'javascript';
    if (filePath.endsWith('.cs')) return 'csharp';
    if (filePath.endsWith('.html')) return 'html';
    if (filePath.endsWith('.css')) return 'css';
    return 'plaintext';
  }
}
