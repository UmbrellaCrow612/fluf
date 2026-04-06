import { computed, Injectable, signal } from "@angular/core";
import { inject } from "@angular/core/primitives/di";
import { ApplicationLocalStorageService } from "../../../../shared/services/application-local-storage.service";
import { fileNode } from "../../../../gen/type";
import {
  addFileNodeIfNotExists,
  removeFileNodeIfExists,
} from "../../../../shared/file-node-helpers";

/**
 * Local storage key used to persist the open files state.
 */
const LOCAL_STORAGE_KEY = "editor-open-files";

/**
 * Manages the collection of currently open files in the editor.
 *
 * State is persisted to local storage so that open tabs survive page reloads.
 * Consumers should read from the {@link nodes} computed signal and mutate state
 * exclusively through {@link open} and {@link close}.
 */
@Injectable({
  providedIn: "root",
})
export class EditorOpenFilesService {
  /**
   * @inject ApplicationLocalStorageService - Service used to persist and retrieve
   * open files state from local storage.
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
   * Backing signal that holds the current set of open file nodes.
   * Initialised to an empty array and hydrated from local storage in the constructor.
   */
  private readonly _nodes = signal<fileNode[]>([]);

  /**
   * Read-only computed signal that exposes the latest open file nodes.
   * Consumers should use this signal rather than the backing `_nodes` signal directly.
   */
  public readonly nodes = computed(() => this._nodes());

  /**
   * Opens a file by adding it to the open files collection.
   *
   * If the node is already present it will not be added again.
   * The updated array is deep-cloned before being stored in the signal to prevent
   * unintended external mutations from affecting internal state, and is then
   * persisted to local storage.
   *
   * @param node - The {@link fileNode} to open.
   * @returns void
   */
  public open(node: fileNode): void {
    const nodes = this._nodes();
    addFileNodeIfNotExists(nodes, node);
    this._nodes.set(structuredClone(nodes));
    this.applicationLocalStorageService.set<fileNode[]>(
      LOCAL_STORAGE_KEY,
      nodes,
    );
  }

  /**
   * Closes a file by removing it from the open files collection.
   *
   * If the node is not present, the call is a no-op.
   * The updated array is deep-cloned before being stored in the signal to prevent
   * unintended external mutations from affecting internal state, and is then
   * persisted to local storage.
   *
   * @param node - The {@link fileNode} to close.
   * @returns void
   */
  public close(node: fileNode): void {
    const nodes = this._nodes();
    removeFileNodeIfExists(nodes, node);
    this._nodes.set(structuredClone(nodes));
    this.applicationLocalStorageService.set<fileNode[]>(
      LOCAL_STORAGE_KEY,
      nodes,
    );
  }

  /**
   * Resets the open files collection to an empty state.
   *
   * Both the signal and the persisted local storage entry are cleared.
   *
   * @returns void
   */
  public reset(): void {
    this._nodes.set([]);
    this.applicationLocalStorageService.set<fileNode[]>(LOCAL_STORAGE_KEY, []);
  }
}
