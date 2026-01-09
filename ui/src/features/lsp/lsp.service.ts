import { EditorState } from '@codemirror/state';
import { Injectable } from '@angular/core';
import {
  CodeMirrorSeverity,
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
import {
  JSONRpcNotification,
  languageServer,
  voidCallback,
} from '../../gen/type';

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

  Edit = (
    args: server.protocol.ChangeRequestArgs,
    langServer: languageServer,
  ) => {
    switch (langServer) {
      case 'js/ts':
        this.api.tsServer.edit(args);
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
          let convertred = convertNotificationToFlufDiagnostics(
            message,
            editorState,
          );
          if (
            convertred.length == 0 ||
            !message.params ||
            !message.params.uri ||
            !message.params.diagnostics
          ) {
            return;
          }

          let filePath = uriToFilePath(message.params?.uri) as string;

          let currentMap = this.fileAndDiagMap.get(filePath);
          if (!currentMap) {
            let map = new Map<diagnosticType, FlufDiagnostic[]>();
            map.set(message.method, convertred);
            this.fileAndDiagMap.set(filePath, map);
          } else {
            this.fileAndDiagMap.get(filePath)?.set(message.method, convertred);
          }

          callback(
            structuredClone(this.fileAndDiagMap),
            structuredClone(this.completions),
          );
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
        // TODO  add
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
 * Converts a JSON-RPC diagnostic notification into CodeMirror FlufDiagnostics
 * @param notification - The JSON-RPC notification object
 * @param state - The CodeMirror editor state
 */
export function convertNotificationToFlufDiagnostics(
  notification: JSONRpcNotification,
  state: EditorState,
): FlufDiagnostic[] {
  if (!notification.params?.diagnostics) return [];

  const doc = state.doc;

  // Helper: Convert line/column to document offset
  const getOffset = (line: number, column: number) => {
    const lineHandle = doc.line(line + 1); // CodeMirror lines are 1-indexed
    return Math.min(lineHandle.from + column, lineHandle.to);
  };

  // Map LSP severity to CodeMirror severity
  const severityMap: Record<number, FlufDiagnostic['severity']> = {
    1: 'error',
    2: 'warning',
    3: 'info',
    4: 'hint',
  };

  return notification.params.diagnostics.map((diag) => {
    const startLine = diag.range.start.line;
    const startColumn = diag.range.start.character;
    const endLine = diag.range.end.line;
    const endColumn = diag.range.end.character;

    return {
      from: getOffset(startLine, startColumn),
      to: getOffset(endLine, endColumn),
      severity: severityMap[diag.severity] || 'error',
      message: diag.message,
      source: diag.source,
      startLine,
      startColumn,
      endLine,
      endColumn,
    };
  });
}

/**
 * Converts a file URI from a JSON-RPC notification to a normal file path
 * @param uri - The file URI, e.g., 'file:///C:/path/to/file.js'
 * @returns The normalized file path, e.g., 'C:/path/to/file.js'
 */
export function uriToFilePath(uri?: string): string | undefined {
  if (!uri) return undefined;

  try {
    // Remove 'file://' prefix
    let path = uri.replace(/^file:\/\//, '');

    // On Windows, remove leading slash if present (e.g., /C:/path → C:/path)
    if (/^\/[a-zA-Z]:/.test(path)) {
      path = path.substring(1);
    }

    // Decode URL-encoded characters (%20 → space)
    path = decodeURIComponent(path);

    return path;
  } catch (err) {
    console.error('Failed to convert URI to file path:', err);
    return undefined;
  }
}
