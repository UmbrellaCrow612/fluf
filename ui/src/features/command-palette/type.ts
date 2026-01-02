import { Type } from '@angular/core';

/**
 * Represents a command that can be selected for auto complete from the command list
 */
export type Command = {
  /** The name of the command */
  label: string;

  /** Information about what the cmd does */
  description: string;

  /** Whats needed to match it the search term for it to be shown */
  prefix: string;

  /**
   * The component that's rendered for it
   */
  component: Type<any>;
};
