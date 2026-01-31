import { Type } from '@angular/core';
import { contextMenuActiveElement } from '../app-context/type';

/**
 * Represents a item that holds the specific contetx menu for a specific key to render
 */
export type ContextMenuItem = {
  /**
   * The specific component to render
   */
  component: Type<any>;

  /**
   * The specific key needed to render it
   */
  key: contextMenuActiveElement;
};
