import { Injectable } from '@angular/core';
import { LanguageServer } from './type';

/**
 * Service used to send and respond to backend language service for specific language servers such as TS server ot HTML etc in a central way
 */
@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  /**
   * Send a messge to a specific language server
   * @param message The message object to send to the server
   * @param server The specific server to send it to
   */
  sendMessage(message: any, server: LanguageServer) {}

  onResponse() {}
}
