import type { IpcMain } from "electron";
import { logger } from "../logger.js";
import { GoLanguageServer } from "./impl/golsp.js";
import { PythonLanguageServer } from "./impl/pythonlsp.js";
import { TypeScriptLanguageServer } from "./impl/typescriptlsp.js";
import { LanguageServerManager } from "./manager.js";
import type {
  CombinedCallback,
  ILanguageServerClientCompletion,
  ILanguageServerClientDefinition,
  ILanguageServerClientDidChangeTextDocument,
  ILanguageServerClientDidCloseTextDocument,
  ILanguageServerClientDidOpenTextDocument,
  ILanguageServerClientHover,
  ILanguageServerClientIsRunning,
  ILanguageServerClientStart,
  ILanguageServerClientStop,
  IpcMainEventCallback,
  IpcMainInvokeEventCallback,
} from "../type.js";

var languageServerManager = new LanguageServerManager();
languageServerManager.Register("go", new GoLanguageServer("go"));
languageServerManager.Register("python", new PythonLanguageServer("python"));
languageServerManager.Register(
  "typescript",
  new TypeScriptLanguageServer("typescript") as any,
);

/**
 * Helper to stop and clean up all language servers
 */
export const stopAllLanguageServers = async () => {
  let lsps = languageServerManager.GetAll();

  for (const lsp of lsps) {
    let result = await lsp.StopAll();
    logger.info(result);
  }
};

/**
 * @type {import("../type").CombinedCallback<import("../type").IpcMainInvokeEventCallback, import("../type").ILanguageServerClientStart>}
 */
const startImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  ILanguageServerClientStart
> = (_, wsf, langId) => {
  let lsp = languageServerManager.Get(langId);
  if (!lsp) {
    logger.warn(`No language server registered for language: ${langId}`);
    return Promise.resolve(true);
  }

  return lsp.Start(wsf);
};

/**
 * @type {import("../type").CombinedCallback<import("../type").IpcMainInvokeEventCallback, import("../type").ILanguageServerClientStop>}
 */
const stopLspImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  ILanguageServerClientStop
> = (_, wsf, langId) => {
  let lsp = languageServerManager.Get(langId);
  if (!lsp) {
    logger.warn(`No language server language: ${langId}`);
    return Promise.resolve(true);
  }

  return lsp.Stop(wsf);
};

/**
 * @type {import("../type").CombinedCallback<import("../type").IpcMainEventCallback, import("../type").ILanguageServerClientDidChangeTextDocument>}
 */
const docChangedImpl: CombinedCallback<
  IpcMainEventCallback,
  ILanguageServerClientDidChangeTextDocument
> = (_, workSpaceFolder, languageId, filePath, version, changes) => {
  let lsp = languageServerManager.Get(languageId);
  if (!lsp) {
    logger.warn(`No language server language: ${languageId}`);
    return;
  }

  lsp.DidChangeTextDocument(workSpaceFolder, filePath, version, changes);
};

/**
 * @type {import("../type").CombinedCallback<import("../type").IpcMainEventCallback, import("../type").ILanguageServerClientDidOpenTextDocument>}
 */
const openDocImpl: CombinedCallback<
  IpcMainEventCallback,
  ILanguageServerClientDidOpenTextDocument
> = (_, workSpaceFolder, languageId, filePath, version, documentText) => {
  let lsp = languageServerManager.Get(languageId);
  if (!lsp) {
    logger.warn(`No language server language: ${languageId}`);
    return;
  }

  lsp.DidOpenTextDocument(
    workSpaceFolder,
    filePath,
    languageId,
    version,
    documentText,
  );
};

/**
 * @type {import("../type").CombinedCallback<import("../type").IpcMainInvokeEventCallback, import("../type").ILanguageServerClientIsRunning>}
 */
const isRunningImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  ILanguageServerClientIsRunning
> = (_, workSpaceFolder, languageId) => {
  let lsp = languageServerManager.Get(languageId);
  if (!lsp) {
    logger.warn(`No language server language: ${languageId}`);
    return Promise.resolve(true);
  }

  return Promise.resolve(lsp.IsRunning(workSpaceFolder));
};

/**
 * @type {import("../type").CombinedCallback<import("../type").IpcMainEventCallback, import("../type").ILanguageServerClientDidCloseTextDocument>}
 */
const closeDocImpl: CombinedCallback<
  IpcMainEventCallback,
  ILanguageServerClientDidCloseTextDocument
> = (_, workSpaceFolder, languageId, filePath) => {
  let lsp = languageServerManager.Get(languageId);
  if (!lsp) {
    logger.warn(`No language server language: ${languageId}`);
    return;
  }

  lsp.DidCloseTextDocument(workSpaceFolder, filePath);
};

/**
 * @type {import("../type").CombinedCallback<import("../type").IpcMainInvokeEventCallback, import("../type").ILanguageServerClientHover>}
 */
const hoverDocImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  ILanguageServerClientHover
> = (_, workSpaceFolder, languageId, filePath, position) => {
  let lsp = languageServerManager.Get(languageId);
  if (!lsp) {
    logger.error(`No language server language: ${languageId}`);
    return Promise.reject(
      new Error(
        `No language server language: ${languageId} cannot provide hover information`,
      ),
    );
  }

  return lsp.Hover(workSpaceFolder, filePath, position);
};

/**
 * @type {import("../type").CombinedCallback<import("../type").IpcMainInvokeEventCallback, import("../type").ILanguageServerClientCompletion>}
 */
const completionImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  ILanguageServerClientCompletion
> = (_, workSpaceFolder, languageId, filePath, position) => {
  let lsp = languageServerManager.Get(languageId);
  if (!lsp) {
    logger.error(
      `No language server language: ${languageId} cannot offer completions`,
    );
    return Promise.reject(
      new Error(
        `No language server language: ${languageId} cannot provide completion information`,
      ),
    );
  }

  return lsp.Completion(workSpaceFolder, filePath, position);
};

/**
 * @type {import("../type").CombinedCallback<import("../type").IpcMainInvokeEventCallback, import("../type").ILanguageServerClientDefinition>}
 */
const definitionImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  ILanguageServerClientDefinition
> = (_, wsf, langId, fp, pos) => {
  let lsp = languageServerManager.Get(langId);
  if (!lsp) {
    logger.error(
      `No language server language: ${langId} cannot offer definitions`,
    );
    return Promise.reject(
      new Error(
        `No language server language: ${langId} cannot offer definitions`,
      ),
    );
  }

  return lsp.Definition(wsf, fp, pos);
};

/**
 * Register all LSP related IPC channels needed for LSP to work
 * @param {import("electron").IpcMain} ipcMain
 */
export const registerLanguageServerListener = (ipcMain: IpcMain) => {
  ipcMain.handle("lsp:start", startImpl);
  ipcMain.handle("lsp:stop", stopLspImpl);
  ipcMain.handle("lsp:is:running", isRunningImpl);

  ipcMain.handle("lsp:document:hover", hoverDocImpl);
  ipcMain.handle("lsp:document:completion", completionImpl);
  ipcMain.handle("lsp:document:definition", definitionImpl);

  ipcMain.on("lsp:document:open", openDocImpl);
  ipcMain.on("lsp:document:change", docChangedImpl);
  ipcMain.on("lsp:document:close", closeDocImpl);
};
