import { fileNode } from './../../gen/type.d';
import { Injectable } from '@angular/core';
import { EditorView, ViewUpdate } from '@codemirror/view';
import {
  ILsp,
  LanguageServiceCallback,
  diagnosticType,
  fileDiagnosticMap,
} from './type';
import { getElectronApi } from '../../utils';
import type { Text } from '@codemirror/state';
import { server } from 'typescript';
import { JSONRpcEdit, languageServer, voidCallback } from '../../gen/type';
import {
  TextDocumentContentChangeEvent,
  Position,
  CompletionContext,
} from 'vscode-languageserver-protocol';
import { FlufDiagnostic } from '../diagnostic/type';
import { convertTsToFlufDiagnostics } from './typescript';
import { convertRpcToFlufDiagnostics } from './jsonrpc';
import { normalizeElectronPath } from '../path/utils';
import { lspCompletionToCodeMirrorCompletions } from './autocomplete';
import { Completion } from '@codemirror/autocomplete';

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
   * Holds completions recived from the server
   */
  private completions: Completion[] = [];

  /**
   * Hover information sent from the server
   */
  private hoverInformation: string = '';

  /**
   * List of specific diagnostics keys we listen to that contain error / suggestion information without putting every key in the file diag map
   * these are keys from typescript and other proper LSP responses
   */
  private diagnosticKeys: Set<diagnosticType> = new Set([
    /** TS specific these contain all UI errors we should care about collecting for now */
    'syntaxDiag',
    'semanticDiag',
    'suggestionDiag',

    /** JSON RPC  LSP's*/
    'textDocument/publishDiagnostics',
  ]);

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

      case 'go':
        this.api.goServer.open(filePath, fileContent);
        break;
      default:
        break;
    }
  };

  Completion = (
    view: ViewUpdate,
    fileNode: fileNode,
    langServer: languageServer,
  ) => {
    switch (langServer) {
      case 'go':
        this.api.goServer.completion(
          fileNode.path,
          getCompletionPositionLsp(view),
          getCompletionContextLsp(view),
        );
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

      case 'go':
        this.api.goServer.edit(
          codeMirrorViewUpdateToJSONRpcEdit(view, fileNode),
        );
        break;

      default:
        break;
    }
  };

  OnResponse = (
    langServer: languageServer,
    view: EditorView,
    callback: LanguageServiceCallback,
  ) => {
    switch (langServer) {
      case 'js/ts':
        return this.api.tsServer.onResponse(async (data) => {
          console.log(data);

          if (!data.event) return;
          if (!this.diagnosticKeys.has(data.event)) {
            return; // we only processes events we care about
          }
          if (!data.body || !data.body?.file) return; // we need file

          let diagKey = data.event;

          let filePath = normalizeElectronPath(data.body.file);

          let currentMap =
            this.fileAndDiagMap.get(filePath) ??
            new Map<diagnosticType, FlufDiagnostic[]>();

          let diagnostics = convertTsToFlufDiagnostics(view, data.body);
          currentMap.set(diagKey, diagnostics);
          this.fileAndDiagMap.set(filePath, currentMap);

          await callback(
            structuredClone(this.fileAndDiagMap),
            this.completions,
            this.hoverInformation,
          ); // need diff JS refrence
        });

      case 'python':
        return this.api.pythonServer.onResponse(async (message) => {
          console.log(message);

          if (!message.params?.uri || !message.params?.diagnostics) return;
          if (!this.diagnosticKeys.has(message.method)) return;

          const filePath = await this.api.urlApi.fileUriToAbsolutePath(
            message.params.uri,
          );
          const normFilePath = normalizeElectronPath(filePath);
          const diagnostics = convertRpcToFlufDiagnostics(view, message);
          const diagKey = message.method;

          let currentMap =
            this.fileAndDiagMap.get(normFilePath) ??
            new Map<diagnosticType, FlufDiagnostic[]>();

          currentMap.set(diagKey, diagnostics);

          this.fileAndDiagMap.set(normFilePath, currentMap);

          await callback(
            structuredClone(this.fileAndDiagMap),
            this.completions,
            this.hoverInformation,
          );
        });

      case 'go':
        return this.api.goServer.onResponse(async (message) => {
          console.log(message);

          if (isLspCompletionMessage(message)) {
            this.completions = lspCompletionToCodeMirrorCompletions(
              view,
              message as any,
            );

            await callback(
              structuredClone(this.fileAndDiagMap),
              this.completions,
              this.hoverInformation,
            );
          }

          if (isHoverMessage(message)) {
            let o = message as any;
            this.hoverInformation = o?.result?.contents?.value ?? '';
            await callback(
              structuredClone(this.fileAndDiagMap),
              this.completions,
              this.hoverInformation,
            );
          }

          if (!message.params?.uri || !message.params?.diagnostics) return;
          if (!this.diagnosticKeys.has(message.method)) return;

          const filePath = await this.api.urlApi.fileUriToAbsolutePath(
            message.params.uri,
          );
          const normFilePath = normalizeElectronPath(filePath);
          const diagnostics = convertRpcToFlufDiagnostics(view, message);
          const diagKey = message.method;

          let currentMap =
            this.fileAndDiagMap.get(normFilePath) ??
            new Map<diagnosticType, FlufDiagnostic[]>();

          currentMap.set(diagKey, diagnostics);

          this.fileAndDiagMap.set(normFilePath, currentMap);

          await callback(
            structuredClone(this.fileAndDiagMap),
            this.completions,
            this.hoverInformation,
          );
        });
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

      case 'go':
        // It's automatic becuase it follow LSP spec
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

      case 'go':
        this.api.goServer.start(workSpaceFolder);
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

      case 'go':
        this.api.goServer.stop();
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

      case 'go':
        return this.api.goServer.onReady(callback);

      default:
        return () => {};
    }
  };

  isReady = async (langServer: languageServer) => {
    switch (langServer) {
      case 'js/ts':
        return false;
      case 'python':
        return false;
      case 'go':
        return await this.api.goServer.isReady();

      default:
        return false;
    }
  };

  hover = (
    fileNode: fileNode,
    position: Position,
    langServer: languageServer,
  ) => {
    switch (langServer) {
      case 'go':
        this.api.goServer.hover(fileNode.path, position);
        break;

      default:
        break;
    }
  };
}

/**
 *
 * @param object The message recived from the server
 */
function isLspCompletionMessage(object: any) {
  if (object?.result?.items && typeof object?.result?.items?.length)
    return true;
  return false;
}

/**
 * If a response object is a JSON rpc hover information object
 * @param object The object
 * @returns True or false
 */
function isHoverMessage(object: any): boolean {
  if (
    object?.result?.contents?.value &&
    object?.result?.contents?.kind === 'markdown'
  )
    return true;
  return false;
}

/**
 * Get the completion context from CodeMirror view
 */
function getCompletionContextLsp(update: ViewUpdate): CompletionContext {
  const { state, transactions } = update;

  // Check if this update was triggered by user typing
  const isUserTyping = transactions.some((tr) => tr.isUserEvent('input.type'));

  if (!isUserTyping) {
    // Manual invocation (e.g., Ctrl+Space)
    return {
      triggerKind: 1, // CompletionTriggerKind.Invoked
    };
  }

  // Get the character that was just typed
  const cursorPos = state.selection.main.head;
  const charBefore =
    cursorPos > 0 ? state.doc.sliceString(cursorPos - 1, cursorPos) : '';

  // Common trigger characters for completion
  const triggerCharacters = ['.', ':', '<', '"', "'", '/', '@', '#'];

  if (triggerCharacters.includes(charBefore)) {
    return {
      triggerKind: 2, // CompletionTriggerKind.TriggerCharacter
      triggerCharacter: charBefore,
    };
  }

  // Typing but not a trigger character
  return {
    triggerKind: 1, // CompletionTriggerKind.Invoked
  };
}

/**
 * Get the completion position from CodeMirror view for an LSP position - this is where the cursor is
 */
function getCompletionPositionLsp(update: ViewUpdate): Position {
  const { state } = update;
  const cursorPos = state.selection.main.head;

  // Get the line number (0-based in CodeMirror, also 0-based in LSP)
  const line = state.doc.lineAt(cursorPos);

  // Get the character position within the line (0-based)
  const character = cursorPos - line.from;

  return {
    line: line.number - 1, // CodeMirror lines are 1-based, LSP is 0-based
    character: character,
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
