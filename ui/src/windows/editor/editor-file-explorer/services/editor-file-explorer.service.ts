import { computed, inject, Injectable, signal } from "@angular/core";
import { ApplicationLocalStorageService } from "../../../../shared/services/application-local-storage.service";
import { fileNode } from "../../../../gen/type";

/**
 * Local storage key used to persist the file explorer state.
 */
const LOCAL_STORAGE_KEY = "editor-file-explorer";

/**
 * Contains the directory nodes in the editor file explorer.
 */
@Injectable({
  providedIn: "root",
})
export class EditorFileExplorerService {
  /**
   * @inject ApplicationLocalStorageService - Service used to persist and retrieve
   * file explorer state from local storage.
   */
  private readonly applicationLocalStorageService = inject(
    ApplicationLocalStorageService,
  );

  constructor() {
    this._nodes.set(
      this.applicationLocalStorageService.get<fileNode[]>(LOCAL_STORAGE_KEY) ??
        [],
    );
  }

  /**
   * Backing signal that holds the current file explorer nodes.
   * Initialised to an empty array and hydrated from local storage in the constructor.
   */
  private readonly _nodes = signal<fileNode[]>([]);

  /**
   * Read-only computed signal that exposes the latest file explorer nodes.
   * Consumers should use this signal rather than the backing `_nodes` signal directly.
   */
  public readonly nodes = computed(() => this._nodes());

  /**
   * Updates the file explorer nodes and persists them to local storage.
   *
   * A deep clone is stored in the signal to ensure a different reference is held,
   * preventing unintended external mutations from affecting internal state.
   *
   * @param nodes - The new array of {@link fileNode} objects to display in the file explorer.
   * @returns void
   */
  public update(nodes: fileNode[]): void {
    this._nodes.set(structuredClone(nodes)); // different reference
    this.applicationLocalStorageService.set<fileNode[]>(
      LOCAL_STORAGE_KEY,
      nodes,
    );
  }
}
