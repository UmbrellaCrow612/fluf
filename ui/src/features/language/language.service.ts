import { EditorState } from '@codemirror/state';
import { inject, Injectable } from '@angular/core';
import {
  LanguageServer,
  ILanguageService,
  LanguageServiceCallback,
  diagnosticType,
} from './type';
import { getElectronApi } from '../../utils';
import {
  mapTsServerOutputToCompletions,
  mapTypescriptDiagnosticToCodeMirrorDiagnostic,
} from './typescript';
import { Diagnostic } from '@codemirror/lint';
import { Completion } from '@codemirror/autocomplete';
import { server } from 'typescript';

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
   * List of current completions sent from tsserver
   */
  private completions: Completion[] = [];

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
    args: server.protocol.CompletionsRequestArgs,
    langServer: LanguageServer
  ) => {
    switch (langServer) {
      case 'js/ts':
        this.api.tsServer.completion(args);
        break;

      default:
        break;
    }
  };

  Edit = (
    args: server.protocol.ChangeRequestArgs,
    langServer: LanguageServer
  ) => {
    switch (langServer) {
      case 'js/ts':
        this.api.tsServer.editFile(args);
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

          this.completions = mapTsServerOutputToCompletions(data);

          callback(this.fileAndDiagMap, this.completions);
        });

        return () => {
          unsub();
        };

      default:
        return () => {};
    }
  };

  Error = (filePath: string, langServer: LanguageServer) => {
    switch (langServer) {
      case 'js/ts':
        this.api.tsServer.errors(filePath);
        break;

      default:
        break;
    }
  };
}
