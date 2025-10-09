import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppContext {
  section: string;
  [key: string]: any; // Allow any additional dynamic properties
}

@Injectable({
  providedIn: 'root',
})
export class ContextService {
  private contextSubject = new BehaviorSubject<AppContext>({
    section: 'dashboard',
  });

  // Observable for components/services to subscribe
  context$ = this.contextSubject.asObservable();

  // Get the current value synchronously
  getContext(): AppContext {
    return this.contextSubject.value;
  }

  // Update the context
  setContext(newContext: Partial<AppContext>) {
    this.contextSubject.next({
      ...this.contextSubject.value,
      ...newContext,
    });
  }
}
