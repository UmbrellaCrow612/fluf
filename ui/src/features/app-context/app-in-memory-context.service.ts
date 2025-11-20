import { Injectable } from '@angular/core';
import { InMemoryAppContext } from './type';


/**
 * Represents information that dosent need to be persisted between sessions but within the lifecycle of the app, i.e until a refresh
 * but has the same structure to notify those who want it it's data when it changes
 */
@Injectable({
  providedIn: 'root'
})
export class AppInMemoryContextService {
  private readonly _appCtx : InMemoryAppContext = {}


  // add sub, autosub, update like the other 
}
