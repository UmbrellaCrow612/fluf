import { EditorState } from '@codemirror/state';
import { Injectable } from '@angular/core';
import {
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
import { languageServer, voidCallback } from '../../gen/type';

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
    langServer: languageServer,
  ) => {
    switch (langServer) {
      case 'js/ts':
        this.api.tsServer.openFile(filePath, fileContent);
        break;

      case 'python':
        this.api.pythonServer.open(filePath, fileContent);
        break;

      default:
        break;
    }
  };

  Completion = (
    args: server.protocol.CompletionsRequestArgs,
    langServer: languageServer,
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
    langServer: languageServer,
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
    langServer: languageServer,
    editorState: EditorState,
    callback: LanguageServiceCallback,
  ) => {
    switch (langServer) {
      case 'js/ts':
        let tsserverUnSub = this.api.tsServer.onResponse((data) => {
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

        return tsserverUnSub;

      case 'python':
        let pythonServerUnSub = this.api.pythonServer.onResponse((message) => {
          console.log(message);
        });
        return pythonServerUnSub;
        break;
      default:
        return () => {};
    }
  };

  Error = (filePath: string, langServer: languageServer) => {
    switch (langServer) {
      case 'js/ts':
        this.api.tsServer.errors(filePath);
        break;

      case 'python':
        // TODO  add
        break;

      default:
        break;
    }
  };

  Close = (filePath: string, langServer: languageServer) => {
    switch (langServer) {
      case 'js/ts':
        this.api.tsServer.closeFile(filePath);
        break;

      default:
        break;
    }
  };

  Start = (workSpaceFolder: string, langServer: languageServer) => {
    switch (langServer) {
      case 'python':
        this.api.pythonServer.start(workSpaceFolder);
        break;
      default:
        break;
    }
  };

  Stop = (langServer: languageServer) => {
    switch (langServer) {
      case 'python':
        this.api.pythonServer.stop();
        break;

      default:
        break;
    }
  };

  onReady = (callback: voidCallback, langServer: languageServer) => {
    switch (langServer) {
      case 'python':
        let unsub = this.api.pythonServer.onReady(callback);
        return unsub;

      default:
        return () => {};
    }
  };
}
