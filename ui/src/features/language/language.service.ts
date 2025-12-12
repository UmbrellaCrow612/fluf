import { EditorState } from '@codemirror/state';
import { Injectable } from '@angular/core';
import {
  LanguageServer,
  ILanguageService,
  LanguageServiceCallback,
  diagnosticType,
} from './type';
import { getElectronApi } from '../../utils';
import { mapTypescriptDiagnosticToCodeMirrorDiagnostic, mapTypescriptEventToDiagnosticType } from './typescript';
import { Diagnostic } from '@codemirror/lint';

/**
 * Service used to send and respond to backend language service for specific language servers such as TS server ot HTML etc in a central way like the client lsp protocol
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
            [data],
            editorState
          );

          let type = mapTypescriptEventToDiagnosticType(data)

          let fp = data?.body?.file ?? "unkown" // whenever acessing always chain ? when acessing

          let m = this.fileAndDiagMap.get(fp)
          if(!m){
            let dm = new Map<diagnosticType, Diagnostic[]>();
            dm.set(type, d)
            this.fileAndDiagMap.set(fp, dm)
          } else {
            let dm = this.fileAndDiagMap.get(fp)
            dm?.set(type, d)
          }

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
