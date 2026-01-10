import { fileNode } from './../../gen/type.d';
import { EditorState } from '@codemirror/state';
import { Injectable } from '@angular/core';
import { ViewUpdate } from '@codemirror/view';
import {
  ILsp,
  LanguageServiceCallback,
  diagnosticType,
  fileDiagnosticMap,
} from './type';
import { getElectronApi } from '../../utils';
import type { Text } from '@codemirror/state';
import {
  mapTsServerOutputToCompletions,
  mapTypescriptDiagnosticToCodeMirrorDiagnostic,
} from './typescript';
import { Completion } from '@codemirror/autocomplete';
import { server } from 'typescript';
import { FlufDiagnostic } from '../diagnostic/type';
import {
  JSONRpcEdit,
  JSONRpcNotification,
  languageServer,
  voidCallback,
} from '../../gen/type';
import {
  TextDocumentContentChangeEvent,
  Range,
  Position,
} from 'vscode-languageserver-protocol';

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
        this.api.tsServer.open(filePath, fileContent);
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

  Edit = (view: ViewUpdate, fileNode: fileNode, langServer: languageServer) => {
    switch (langServer) {
      case 'js/ts':
        let changeRequest = codeMirrorViewUpdateToChangeRequest(view, fileNode);
        changeRequest.forEach((x) => {
          this.api.tsServer.edit(x);
        });
        break;

      case 'python':
        this.api.pythonServer.edit(
          codeMirrorViewUpdateToJSONRpcEdit(view, fileNode),
        );
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
          console.log(data);

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
        // It's automatic for proper LSP's
        break;

      default:
        break;
    }
  };

  Close = (filePath: string, langServer: languageServer) => {
    switch (langServer) {
      case 'js/ts':
        this.api.tsServer.close(filePath);
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

      case 'js/ts':
        this.api.tsServer.start(workSpaceFolder);
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

      case 'js/ts':
        this.api.tsServer.stop();
        break;

      default:
        break;
    }
  };

  onReady = (callback: voidCallback, langServer: languageServer) => {
    switch (langServer) {
      case 'python':
        return this.api.pythonServer.onReady(callback);

      case 'js/ts':
        return this.api.tsServer.onReady(callback);

      default:
        return () => {};
    }
  };
}

/**
 * Make a Typescript change request using the editor view
 * @param update The view update from code mirror
 * @param fileNode The file in the editor
 * @returns List of change requests
 */
function codeMirrorViewUpdateToChangeRequest(
  update: ViewUpdate,
  fileNode: fileNode,
) {
  let changes: server.protocol.ChangeRequestArgs[] = [];

  update.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
    const doc = update.startState.doc;
    const startLine = doc.lineAt(fromA);
    const endLine = doc.lineAt(toA);

    const changeRequest: server.protocol.ChangeRequestArgs = {
      file: fileNode.path,
      line: startLine.number, // Already 1-based in CodeMirror
      offset: fromA - startLine.from + 1, // Convert to 1-based offset
      endLine: endLine.number,
      endOffset: toA - endLine.from + 1,
      insertString: inserted.toString() || undefined,
    };

    changes.push(changeRequest);
  }, true);

  return changes;
}

/**
 * Converts a CodeMirror offset to LSP Position (line and character)
 */
function offsetToPosition(doc: Text, offset: number): Position {
  const line = doc.lineAt(offset);
  return {
    line: line.number - 1, // LSP uses 0-based line numbers
    character: offset - line.from,
  };
}

/**
 * Converts CodeMirror ViewUpdate to JSONRpcEdit object
 * @param update The view update from CodeMirror
 * @param fileNode The file in the editor
 * @returns JSONRpcEdit object with LSP-compliant changes
 */
function codeMirrorViewUpdateToJSONRpcEdit(
  update: ViewUpdate,
  fileNode: fileNode,
): JSONRpcEdit {
  const changes: TextDocumentContentChangeEvent[] = [];

  update.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
    const doc = update.startState.doc;

    const start = offsetToPosition(doc, fromA);
    const end = offsetToPosition(doc, toA);
    const text = inserted.toString();

    changes.push({
      range: { start, end },
      rangeLength: toA - fromA,
      text,
    });
  });

  return {
    filePath: fileNode.path,
    changes,
  };
}
