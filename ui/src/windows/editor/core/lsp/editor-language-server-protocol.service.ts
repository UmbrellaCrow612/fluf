import { inject, Injectable } from "@angular/core";
import {
  ILanguageServerClient,
  ILanguageServerClientOnReadyCallback,
  languageId,
  LanguageServerOnDataCallback,
  LanguageServerOnNotificationCallback,
  LanguageServerProtocolMethod,
  voidCallback,
} from "../../../../gen/type";
import { getElectronApi } from "../../../../shared/electron";
import { PublishDiagnosticsParams } from "vscode-languageserver-protocol";
import { EditorDocumentDiagnosticService } from "./editor-document-diagnostic.service";

/**
 * Used to get / send diagnostics for files for the editor
 */
@Injectable({
  providedIn: "root",
})
export class EditorLanguageServerProtocolService implements ILanguageServerClient {
  private readonly electronApi = getElectronApi();
  private readonly editorDocumentDiagnosticService = inject(
    EditorDocumentDiagnosticService,
  );
  private unsub: voidCallback | null = null;

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

  /**
   * Registers listner for when LSP responds with document diagnostics
   */
  public registerOnPublishDiagnosticslisterner(): void {
    this.unsub?.();

    this.unsub = this.electronApi.lspClient.onNotification(
      "textDocument/publishDiagnostics",
      async (message) => {
        console.log("Backend diagnostic ", message);

        const params = message?.params as undefined | PublishDiagnosticsParams;

        if (!params || !params?.diagnostics || !params.uri) {
          console.error(
            "textDocument/publishDiagnostics produced a none matching object notification",
          );
          return;
        }

        const uri = params.uri;
        const documentFilePath = await this.electronApi.pathApi.fromUri(uri);

        this.editorDocumentDiagnosticService.setDiagnostics(
          documentFilePath,
          params.diagnostics,
        );
      },
    );
  }

  /**
   * Runs destroy logic
   */
  public destroy() {
    this.unsub?.();
  }
}
