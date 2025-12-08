import { Injectable } from '@angular/core';
import { LanguageServer } from './type';
import { getElectronApi } from '../../utils';

/**
 * Service used to send and respond to backend language service for specific language servers such as TS server ot HTML etc in a central way
 */
@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly api = getElectronApi();

  /**
   * Send a messge to a specific language server
   * @param message The message object or shape to send to the server
   * @param server The specific server to send it to
   */
  sendMessage(message: any, server: LanguageServer) {
    switch (server) {
      case 'js/ts':
        this.api.tsServer.sendMessage(message);
        break;

      default:
        console.error('Unkown server ' + server);
        break;
    }
  }

  /**
   * Listen to a specific server when it responds and run custom callback function
   * @param callback The custom logic you want to run when the server responds
   * @param server The specific server to listen to
   * @returns Unsub callback to stop reacting
   */
  onResponse(
    callback: serverResponseCallback,
    server: LanguageServer
  ): voidCallback {
    switch (server) {
      case 'js/ts':
        return this.api.tsServer.onResponse(callback);

      default:
        console.error('Unkown server ' + server);
        return () => {};
    }
  }
}
