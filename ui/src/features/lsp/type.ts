import { EditorView, ViewUpdate } from '@codemirror/view';
import {
  fileNode,
  LanguageServerProtocolMethod,
  tsServerOutputEvent,
  voidCallback,
} from '../../gen/type';
import { server } from 'typescript';
import { FlufDiagnostic } from '../diagnostic/type';
import { Completion } from '@codemirror/autocomplete';
import { Position } from 'vscode-languageserver-protocol';

/**
 * List of all the specific diagnostics keys can be which the contain all the diagnostics for said key these are produced from the backend either by a LSP or another
 * code checker as a form of indeitifying specific event / messages and there content
 */
export type diagnosticType = tsServerOutputEvent | LanguageServerProtocolMethod;

/**
 * Represents a file path as a key then a map of specific diagnostics as keys then all of them
 */
export type fileDiagnosticMap = Map<
  string,
  Map<diagnosticType, FlufDiagnostic[]>
>;

/**
 * Since code mirror dose not export this we just copy it from index.d.ts of it this is for Serverity type within it
 */
export type CodeMirrorSeverity = 'hint' | 'info' | 'warning' | 'error';
