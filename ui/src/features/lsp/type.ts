import { EditorState } from '@codemirror/state';
import {
  languageServer,
  tsServerOutputEvent,
  voidCallback,
} from '../../gen/type';
import { Completion } from '@codemirror/autocomplete';
import { server } from 'typescript';
import { FlufDiagnostic } from '../diagnostic/type';

/**
 * List of all the specific diagnostics keys can be which the contain all the diagnostics for said key
 */
export type diagnosticType = tsServerOutputEvent | 'unkown';

/**
 * Represents a file path as a key then a map of specific diagnostics as keys then all of them
 */
export type fileDiagnosticMap = Map<
  string,
  Map<diagnosticType, FlufDiagnostic[]>
>;

/**
 * Represents the standard a language service API has to impl be language agnostic and provide base methods needed to talk to any lang server this is the lsp protocol
 * under the hoodd it will routes said requests to the correct language server impl
 */
export interface ILsp {
  /**
   * Open a file
   * @param filePath The files path
   * @param fileContent The files content
   * @param langServer The specific language serve to call
   * @returns Nothing
   */
  Open: (
    filePath: string,
    fileContent: string,
    langServer: languageServer,
  ) => void;

  /**
   * Edit a file
   * @param {server.protocol.ChangeRequestArgs} args List of options needed to update the backend view
   * @param langServer The specific language server to send it to
   * @returns Nothing
   */
  Edit: (
    args: server.protocol.ChangeRequestArgs,
    langServer: languageServer,
  ) => void;

  /**
   * Get completion information
   * @param filePath The files path
   * @param lineNumber The line number (1-based)
   * @param lineOffest The character offset (on the line) (1-based)
   * @param langServer The specific language server to send it to
   * @returns Nothing
   */
  Completion: (
    args: server.protocol.CompletionsRequestArgs,
    langServer: languageServer,
  ) => void;

  /**
   * Listen to response streams from a specific language server and run a callback
   * @param langServer The specific language server to listen to
   * @param {EditorState} editorState - The editors state
   * @returns Unsub callback to stop
   */
  OnResponse: (
    langServer: languageServer,
    editorState: EditorState,
    callback: LanguageServiceCallback,
  ) => voidCallback;

  /**
   * Get errors / syntax errors for a given file
   * @param filePath The file to get the the errors for
   * @param langServer The specific lang server to send it to
   * @returns Nothing
   */
  Error: (filePath: string, langServer: languageServer) => void;

  /**
   * Close a file
   * @param filePath The specific file to close
   * @param langServer The language server to send it to
   * @returns Nothing
   */
  Close: (filePath: string, langServer: languageServer) => void;

  /**
   * Start a Language server
   * @param langServer The language server to start
   * @param workSpaceFolder - The selected directory workspace folder
   * @returns Nothing
   */
  Start: (workSpaceFolder: string, langServer: languageServer) => void;

  /**
   * Stop a language server
   * @param langServer The language server to stop
   * @returns Nothing
   */
  Stop: (langServer: languageServer) => void;

  /**
   * Run some logic when a language server in ready
   * @param callback The logic to run
   * @param langServer The specific lang server to listen to
   * @returns Unsub method to remove the callback
   */
  onReady: (callback: voidCallback, langServer: languageServer) => voidCallback;
}

/**
 * Runs when the lang server responds and it's specific response it then parsed and passed to you
 * @param  fileAndDiagMap Contains a map of files and another map that for the specifc file has a diag type and it's diagnostics
 * @param  fileAndCompletionMap Contains a map of specific file and all it's auto complete info
 * @returns {void} Nothing
 */
export type LanguageServiceCallback = (
  fileAndDiagMap: fileDiagnosticMap,
  completions: Completion[],
) => void;

/**
 * Since code mirror dose not export this we just copy it from index.d.ts of it this is for Serverity type within it
 */
export type CodeMirrorSeverity = 'hint' | 'info' | 'warning' | 'error';
