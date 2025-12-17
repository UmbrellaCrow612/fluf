import { Signal, Type } from '@angular/core';

/**
 * Represents a item tha can be used to render a specific component from angular ngComponentOutlet in the UI
 */
export type Renderable = {
  /**
   * The specific component to render
   */
  component: Type<any>;

  /**
   * Computed signal condition needed to be true for it to be rendered int the UI
   */
  condition: Signal<boolean>
};
