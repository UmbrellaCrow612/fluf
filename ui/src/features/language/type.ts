/**
 * Contains all the languiage server keys i.e list of server names that can be used or are currently implamented to be used for intellisense in the editor
 */
export type LanguageServer =
  /** Used for both TS typescript and JS javascrippt*/ 'js/ts';

// ======================= TS typescript ====================

/*

  The backend processes that runs tsserver dose not care about the shape or whatever it just recieves the payload we send and writes it to stdin of that processes,
  it then parses the stdout according to the shape defined here https://github.com/microsoft/TypeScript/wiki/Standalone-Server-%28tsserver%29#message-format it parses the content 
  length then just returns a array of those, the types below are as of this commit the shape it sends back it could or could not change in the future, since there 
  isnt a defined shape and it just returns json back i will type them here for useage in code, change them if the respponses do change

 */

/**
 * Represents a diagnostic sent from the TS typescript language server
 */
export interface TsServerDiagnostic {
  category: 'error' | 'warning' | 'suggestion' | 'message';
  code: number;
  start: { line: number; offset: number };
  end: { line: number; offset: number };
  text: string;
}

/**
 * The body of a diagnostic event
 */
export interface TsServerDiagnosticBody {
  file: string;
  diagnostics: TsServerDiagnostic[];
}

/**
 * The full diagnostic event
 */
export interface TsServerDiagnosticEvent {
  seq: number;
  type: 'event';
  event: 'syntaxDiag' | 'semanticDiag';
  body: TsServerDiagnosticBody;
}
