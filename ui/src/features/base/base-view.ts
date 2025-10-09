/**
 * Contains base fields used in every view
 */
export class BaseView {
  /**
   * Holds view level loading state
   */
  isLoading = false;

  /**
   * Holds view level error state
   */
  error: string | null = null;

  startLoading() {
    this.isLoading = true;
    this.error = null;
  }

  stopLoading() {
    this.isLoading = false;
  }

  setError(str: string) {
    this.error = str;
  }

  clearError() {
    this.error = null;
  }
}
