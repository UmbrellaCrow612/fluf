import { Injectable, signal } from "@angular/core";
import { gitBlameLineInformation } from "../../../../gen/type";

/**
 * Handles editor git interaction and information
 */
@Injectable({
  providedIn: "root",
})
export class EditorGitService {
  /**
   * Contains current git blame information
   */
  private readonly _gitBlameLineInformation =
    signal<gitBlameLineInformation | null>(null);

  /**
   * Readonly signal for the current git blame information
   */
  public readonly gitBlameLineInformation =
    this._gitBlameLineInformation.asReadonly();

  /**
   * Changbe the git blame information
   * @param value The new value
   */
  public changeGitBlame(value: gitBlameLineInformation | null): void {
    const current = this._gitBlameLineInformation();
    const same = this.isGitBlameSame(current, value);
    if (same) {
      return;
    }

    this._gitBlameLineInformation.set(value);
  }

  /**
   * Compare if two objects are the same
   * @param current Old
   * @param newValue New
   */
  private isGitBlameSame(
    current: gitBlameLineInformation | null,
    newValue: gitBlameLineInformation | null,
  ): boolean {
    if (current === null && newValue === null) {
      return true;
    }

    if (
      current?.author === newValue?.author &&
      current?.commit === newValue?.commit &&
      current?.dateTime === newValue?.dateTime
    ) {
      return true;
    }

    return false;
  }
}
