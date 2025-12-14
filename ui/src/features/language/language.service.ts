import { EditorState } from '@codemirror/state';
import { Injectable } from '@angular/core';
import {
  LanguageServer,
  ILanguageService,
  LanguageServiceCallback,
  diagnosticType,
} from './type';
import { getElectronApi } from '../../utils';
import {
  isTypescriptCompletionInfoOutput,
  isTypescriptDiagnosticOutput,
  mapTsServerOutputToCompletions,
  mapTypescriptDiagnosticToCodeMirrorDiagnostic,
} from './typescript';
import { Diagnostic } from '@codemirror/lint';
import { Completion } from '@codemirror/autocomplete';

/**
 * Central LSP language server protcol class that impl, forwards requests correct lang server and offers a clean API
 */
@Injectable({
  providedIn: 'root',
})
export class LanguageService implements ILanguageService {
  private readonly api = getElectronApi();

  /**
   * Contains a map of a files path and it's specific diagnsitic type and all the diagnostics for it
   */
  private fileAndDiagMap = new Map<string, Map<diagnosticType, Diagnostic[]>>();

  /**
   * Contains a list of files and there completion entry's for it TODO map it inot code mirror auto complete object
   */
  private fileAndCompletionMap = new Map<string, Completion[]>();

  Open = (
    filePath: string,
    fileContent: string,
    langServer: LanguageServer
  ) => {
    switch (langServer) {
      case 'js/ts':
        this.api.tsServer.openFile(filePath, fileContent);
        break;

      default:
        break;
    }
  };

  Completion = (
    filePath: string,
    lineNumber: number,
    lineOffest: number,
    langServer: LanguageServer
  ) => {
    switch (langServer) {
      case 'js/ts':
        this.api.tsServer.completion(filePath, lineNumber, lineOffest);
        break;

      default:
        break;
    }
  };

  Edit = (
    filePath: string,
    fileContent: string,
    langServer: LanguageServer
  ) => {
    switch (langServer) {
      case 'js/ts':
        this.api.tsServer.editFile(filePath, fileContent);
        break;

      default:
        break;
    }
  };

  OnResponse = (
    langServer: LanguageServer,
    editorState: EditorState,
    callback: LanguageServiceCallback
  ) => {
    switch (langServer) {
      case 'js/ts':
        let unsub = this.api.tsServer.onResponse((data) => {
          let filePath = data?.body?.file ?? 'unkown';

          if (isTypescriptDiagnosticOutput(data)) {
            let d = mapTypescriptDiagnosticToCodeMirrorDiagnostic(
              data,
              editorState
            );

            let m = this.fileAndDiagMap.get(filePath);
            if (!m) {
              let dm = new Map<diagnosticType, Diagnostic[]>();
              dm.set(data?.event ?? 'unkown', d);
              this.fileAndDiagMap.set(filePath, dm);
            } else {
              let dm = this.fileAndDiagMap.get(filePath);
              dm?.set(data?.event ?? 'unkown', d);
            }
          }

          if (isTypescriptCompletionInfoOutput(data)) {
            let entries = mapTsServerOutputToCompletions(data);
            this.fileAndCompletionMap.set(filePath, entries);

            console.log("From ts server raw")
            console.log(data)
          }

          callback(this.fileAndDiagMap, this.fileAndCompletionMap);
        });

        return () => {
          unsub();
        };

      default:
        return () => {};
    }
  };
}
