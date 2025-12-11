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


  
}
