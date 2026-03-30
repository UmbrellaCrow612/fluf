import { Injectable } from "@angular/core";
import {
  ILanguageServerClient,
  ILanguageServerClientOnReadyCallback,
  languageId,
  LanguageServerOnDataCallback,
  LanguageServerOnNotificationCallback,
  LanguageServerProtocolMethod,
} from "../../../../gen/type";
import { getElectronApi } from "../../../../shared/electron";

/**
 * Used to get / send diagnostics for files for the editor
 */
@Injectable({
  providedIn: "root",
})
export class EditorLanguageServerProtocolService implements ILanguageServerClient {
  private readonly electronApi = getElectronApi();

  public start(workSpaceFolder: string, languageId: languageId) {
    return this.electronApi.lspClient.start(workSpaceFolder, languageId);
  }

  public stop(workSpaceFolder: string, languageId: languageId) {
    return this.electronApi.lspClient.stop(workSpaceFolder, languageId);
  }

  public isRunning(workSpaceFolder: string, languageId: languageId) {
    return this.electronApi.lspClient.isRunning(workSpaceFolder, languageId);
  }

  public didOpenTextDocument(
    workSpaceFolder: string,
    languageId: languageId,
    filePath: string,
    version: number,
    documentText: string,
  ) {
    this.electronApi.lspClient.didOpenTextDocument(
      workSpaceFolder,
      languageId,
      filePath,
      version,
      documentText,
    );
  }

  public didChangeTextDocument(
    workSpaceFolder: string,
    languageId: languageId,
    filePath: string,
    version: number,
    changes: import("vscode-languageserver-protocol").TextDocumentContentChangeEvent[],
  ) {
    this.electronApi.lspClient.didChangeTextDocument(
      workSpaceFolder,
      languageId,
      filePath,
      version,
      changes,
    );
  }

  public didCloseTextDocument(
    workSpaceFolder: string,
    languageId: languageId,
    filePath: string,
  ) {
    this.electronApi.lspClient.didCloseTextDocument(
      workSpaceFolder,
      languageId,
      filePath,
    );
  }

  public hover(
    workSpaceFolder: string,
    languageId: languageId,
    filePath: string,
    position: import("vscode-languageserver-protocol").Position,
  ) {
    return this.electronApi.lspClient.hover(
      workSpaceFolder,
      languageId,
      filePath,
      position,
    );
  }

  public completion(
    workSpaceFolder: string,
    languageId: languageId,
    filePath: string,
    position: import("vscode-languageserver-protocol").Position,
  ) {
    return this.electronApi.lspClient.completion(
      workSpaceFolder,
      languageId,
      filePath,
      position,
    );
  }

  public definition(
    workSpaceFolder: string,
    languageId: languageId,
    filePath: string,
    position: import("vscode-languageserver-protocol").Position,
  ) {
    return this.electronApi.lspClient.definition(
      workSpaceFolder,
      languageId,
      filePath,
      position,
    );
  }

  public onReady(callback: ILanguageServerClientOnReadyCallback) {
    return this.electronApi.lspClient.onReady(callback);
  }

  public onData(callback: LanguageServerOnDataCallback) {
    return this.electronApi.lspClient.onData(callback);
  }

  public onNotifications(callback: LanguageServerOnNotificationCallback) {
    return this.electronApi.lspClient.onNotifications(callback);
  }

  public onNotification(
    method: LanguageServerProtocolMethod,
    callback: LanguageServerOnNotificationCallback,
  ) {
    return this.electronApi.lspClient.onNotification(method, callback);
  }
}
