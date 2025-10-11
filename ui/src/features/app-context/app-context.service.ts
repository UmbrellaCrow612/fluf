import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { sideBarActiveElement } from './type';

/**
 * Holds app wide ctx (Context) such as specific fields or values and allows peope,l to change and notify any subs
 */
class AppContext {
  /**
   * Holds the current side bar active element clicked
   */
  private sideBarActiveElementSubject =
    new BehaviorSubject<sideBarActiveElement>(null);

  /**
   * Observable for sidebar active element sub to this for it's value and change notify
   */
  public readonly sideBarActiveElement$ =
    this.sideBarActiveElementSubject.asObservable();

  /**
   * Sets a new active element in the sidebar and notifies subscribers
   * Toggles off if the element is already active
   * @param element The new sidebar active element
   */
  public setSideBarActiveElement(element: sideBarActiveElement) {
    const current = this.sideBarActiveElementSubject.getValue();

    // If the current active element is the same as the new one, reset to null
    if (current === element) {
      this.sideBarActiveElementSubject.next(null);
    } else {
      this.sideBarActiveElementSubject.next(element);
    }
  }
}

/**
 * Service that provides acess to application context
 */
@Injectable({
  providedIn: 'root',
})
export class ContextService {
  /**
   * Exposes the single app wide AppContext to be read
   */
  public readonly instace = new AppContext();
}
