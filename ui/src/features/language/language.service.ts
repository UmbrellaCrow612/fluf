import { EditorState } from '@codemirror/state';
import { Injectable } from '@angular/core';
import {
  LanguageServer,
  ILanguageService,
  LanguageServiceCallback,
  diagnosticType,
} from './type';
import { getElectronApi } from '../../utils';
import { mapTypescriptDiagnosticToCodeMirrorDiagnostic } from './typescript';
import { Diagnostic } from '@codemirror/lint';
import { tsServerOutput, tsServerOutputBody, tsServerOutputBodyCompletionEntry } from '../../gen/type';

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
  private fileAndCompletionEntryMap = new Map<string, tsServerOutputBodyCompletionEntry[]>

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
          let d = mapTypescriptDiagnosticToCodeMirrorDiagnostic(
            data,
            editorState
          );

          // todo get diagnostics if it's diagnostics or if i has entries add diagnostci type comp0leInfo with completion info object or a serpate map thats passed 

          let fp = data?.body?.file ?? 'unkown'; // whenever acessing always chain ? when acessing

          let m = this.fileAndDiagMap.get(fp);
          if (!m) {
            let dm = new Map<diagnosticType, Diagnostic[]>();
            dm.set(data?.event ?? 'unkown', d);
            this.fileAndDiagMap.set(fp, dm);
          } else {
            let dm = this.fileAndDiagMap.get(fp);
            dm?.set(data?.event ?? 'unkown', d);
          }

          // todo pass both diag map and completion map
          callback(this.fileAndDiagMap);
        });

        return () => {
          unsub();
        };

      default:
        return () => {};
    }
  };
}
