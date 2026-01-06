import { EditorState } from '@codemirror/state';
import { Injectable } from '@angular/core';
import {
  LanguageServer,
  ILsp,
  LanguageServiceCallback,
  diagnosticType,
  fileDiagnosticMap,
} from './type';
import { getElectronApi } from '../../utils';
import {
  mapTsServerOutputToCompletions,
  mapTypescriptDiagnosticToCodeMirrorDiagnostic,
} from './typescript';
import { Completion } from '@codemirror/autocomplete';
import { server } from 'typescript';
import { FlufDiagnostic } from '../diagnostic/type';

/**
 * Central LSP language server protcol class that impl, forwards requests correct lang server and offers a clean API
 */
@Injectable({
  providedIn: 'root',
})
export class LspService implements ILsp {
  private readonly api = getElectronApi();
  /**
   * Contains a map of a files path and it's specific diagnsitic type and all the diagnostics for it
   */
  private fileAndDiagMap: fileDiagnosticMap = new Map();

  /**
   * List of current completions sent from tsserver
   */
  private completions: Completion[] = [];

  Open = (
    filePath: string,
    fileContent: string,
    langServer: LanguageServer,
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
    langServer: LanguageServer,
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
    langServer: LanguageServer,
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
    callback: LanguageServiceCallback,
  ) => {
    switch (langServer) {
      case 'js/ts':
        let unsub = this.api.tsServer.onResponse((data) => {
          let filePath = data?.body?.file ?? 'unkown';

          let d = mapTypescriptDiagnosticToCodeMirrorDiagnostic(
            data,
            editorState,
          );

          let m = this.fileAndDiagMap.get(filePath);
          if (!m) {
            let dm = new Map<diagnosticType, FlufDiagnostic[]>();
            dm.set(data?.event ?? 'unkown', d);
            this.fileAndDiagMap.set(filePath, dm);
          } else {
            let dm = this.fileAndDiagMap.get(filePath);
            dm?.set(data?.event ?? 'unkown', d);
          }

          this.completions = mapTsServerOutputToCompletions(data);

          // we use structutred clone to give a map of a diffrent refrence becuase ctx setting new map keeps same ref we pass from here  so it dosent trigger computed fields
          callback(
            structuredClone(this.fileAndDiagMap),
            structuredClone(this.completions),
          );
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

  Close = (filePath: string, langServer: LanguageServer) => {
    switch (langServer) {
      case 'js/ts':
        this.api.tsServer.closeFile(filePath);
        break;

      default:
        break;
    }
  };
}
