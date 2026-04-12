import { computed, inject, Injectable, signal } from "@angular/core";
import { ApplicationLocalStorageService } from "../../../../shared/services/application-local-storage.service";
import { fileNode } from "../../../../gen/type";

/**
 * Local storage key used to persist the file explorer state.
 */
const FX_LOCAL_STORAGE_KEY = "editor-file-explorer";

/**
 * Local storage key used to persist the file explorer active node state.
 */
const FX_ACTIVE_STORAGE_KEY = "editor-file-explorer-active";

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

  /**
   * Backing signal that holds the current file explorer nodes.
   * Initialised to an empty array and hydrated from local storage in the constructor.
   */
  private readonly _nodes = signal<fileNode[]>([]);

  /**
   * Keeps track of the active node in the file explorer i.e the one shown in the editor or clicked
   */
  private readonly _activeNode = signal<fileNode | null>(null);

  /**
   * Read-only computed signal that exposes the latest file explorer nodes.
   * Consumers should use this signal rather than the backing `_nodes` signal directly.
   */
  public readonly nodes = computed(() => this._nodes());

  /**
   * Read-only computed signal that exposes the latest active node in the file explorer
   */
  public readonly activeNode = computed(() => this._activeNode());

  /**
   * Hydrates the file explorer signals and data
   */
  public async hydrate() {
    try {
      await Promise.all([this.hydrateNodes(), this.hydrateActiveNode()]);
    } catch (error) {
      console.error("[EditorFileExplorerService] failed to hydrate ", error);
    }
  }

  /**
   * Hydrates the direcory nodes shown in the file explorer
   */
  private async hydrateNodes() {
    this._nodes.set(
      this.applicationLocalStorageService.get<fileNode[]>(
        FX_LOCAL_STORAGE_KEY,
      ) ?? [],
    );
  }

  /**
   * Hydrate the active node
   */
  private async hydrateActiveNode() {
    this._activeNode.set(
      this.applicationLocalStorageService.get<fileNode | null>(
        FX_ACTIVE_STORAGE_KEY,
      ),
    );
  }

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
      FX_LOCAL_STORAGE_KEY,
      nodes,
    );
  }

  /**
   * Updates the active file explorer node and persists it to local storage.
   *
   * A deep clone is stored in the signal to ensure a different reference is held,
   * preventing unintended external mutations from affecting internal state.
   *
   * @param node - The {@link fileNode} to set as active, or `null` to clear the active node.
   * @returns void
   */
  public updateActive(node: fileNode | null): void {
    this._activeNode.set(node ? structuredClone(node) : null);
    this.applicationLocalStorageService.set<fileNode | null>(
      FX_ACTIVE_STORAGE_KEY,
      node,
    );
  }
}
