/**
 * Represents a css var parsed and used to be changed in the UI and also saved shape
 */
export type cssVar = {
  /**
   * The name of the css var for example `bg-primary`
   */
  property: string;

  /**
   * Value of the css var for example `#0000` or any other valid css value such as other `var` usage
   */
  value: string;
};
