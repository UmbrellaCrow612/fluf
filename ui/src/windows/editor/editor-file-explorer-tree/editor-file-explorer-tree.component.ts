import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
  Signal,
  untracked,
} from '@angular/core';
import { EditorFileExplorerTreeItemComponent } from '../editor-file-explorer-tree-item/editor-file-explorer-tree-item.component';
import { fileNode, voidCallback } from '../../../gen/type';
import { EditorContextService } from '../editor-context/editor-context.service';
import { getElectronApi } from '../../../utils';
import { EditorInMemoryContextService } from '../editor-context/editor-in-memory-context.service';
import { normalizePath } from '../core/path-uri-helpers';

/**
 * Main component in file explorer that renders the actual file nodes in a tree / file pattern:
 *
 * Like:
 *
 * ```markdown
 * --- foo (folder opended)
 * ------ bar.html (file)
 * ---- bazz
 * ------ too.py
 *
 * ```
 * etc
 */
@Component({
  selector: 'app-editor-file-explorer-tree',
  imports: [EditorFileExplorerTreeItemComponent],
  templateUrl: './editor-file-explorer-tree.component.html',
  styleUrl: './editor-file-explorer-tree.component.css',
})
export class EditorFileExplorerTreeComponent implements OnDestroy {
  private readonly editorContextService = inject(EditorContextService);
  private readonly editorInMemoryContextService = inject(
    EditorInMemoryContextService,
  );
  private readonly electronApi = getElectronApi();

  /**
   * Previous selected directory
   */
  private previousSelectedDirectory: string | null = null;

  /**
   * Holds the callback to unsub the custom logic run on every fs change
   */
  private selectedDirectoryUnsub: voidCallback | null = null;

  /**
   * Holds error state
   */
  public error = signal<string | null>(null);

  constructor() {
    effect(async () => {
      const refreshCount = this.editorInMemoryContextService.refreshDirectory();
      const selectedPath = untracked(() =>
        this.editorContextService.selectedDirectoryPath(),
      );
      if (refreshCount > 0 && selectedPath) {
        await this.mergeDirectoryNodes(selectedPath);
      }
    });

    effect(async () => {
      this.error.set(null);

      const currentPath = this.editorContextService.selectedDirectoryPath();
      if (!currentPath) {
        this.error.set(`No selected directory`);
        return;
      }

      this.selectedDirectoryUnsub?.();

      const existingNodes = this.editorContextService.directoryFileNodes();

      if (currentPath !== this.previousSelectedDirectory) {
        if (this.previousSelectedDirectory) {
          console.log(
            `Stopped watching at path ${this.previousSelectedDirectory}`,
          );
          this.electronApi.fsApi.stopWatching(this.previousSelectedDirectory);
        }

        this.previousSelectedDirectory = currentPath;

        this.selectedDirectoryUnsub = this.electronApi.fsApi.onChange(
          this.previousSelectedDirectory,
          () => {
            console.log(
              `Directory changed at path ${this.previousSelectedDirectory}`,
            );
            this.editorInMemoryContextService.refreshDirectory.update(
              (x) => x + 1,
            );
          },
        );

        if (existingNodes && existingNodes.length > 0) {
          await this.mergeDirectoryNodes(this.previousSelectedDirectory);
        } else {
          await this.fetchDirectoryNodes(this.previousSelectedDirectory);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.selectedDirectoryUnsub?.();
  }

  /**
   * Merges the current nodes inb state with latest keeping state between them and also removing stale nodes and updating there values
   * @param path - The selected directory path to fetch and set the global selected directory nodes
   */
  private mergeDirectoryNodes = async (path: string) => {
    const current = this.selectedDirectoryFileNodes();
    const latest = await this.electronApi.fsApi.readDir(path);
    const updated = await this.mergeDirectoryNodesImpl(current, latest);
    this.editorContextService.directoryFileNodes.set(updated);
  };

  /**
   * Recursively goes through latest nodes and keep ones already in UI remove stale etc
   * @param currentNodes The current nodes
   * @param latestNodes The latest read nodes
   * @returns Updated nodes
   */
  private mergeDirectoryNodesImpl = async (
    currentNodes: fileNode[],
    latestNodes: fileNode[],
  ): Promise<fileNode[]> => {
    /**
     * Holds the current nodes mapped from there file paths to the nodes
     */
    const currentMap = new Map<string, fileNode>(
      currentNodes.map((node) => [normalizePath(node.path), node]),
    );

    const result: fileNode[] = [];

    for (const latestNode of latestNodes) {
      const existing = currentMap.get(normalizePath(latestNode.path));

      // New node
      if (!existing) {
        result.push(latestNode);
        continue;
      }

      // Existing node
      const merged: fileNode = {
        ...latestNode,
        expanded: existing.expanded,
        mode: existing.mode,
        children: existing.children,
      };

      // Only recurse if directory is expanded fetch children updated
      if (merged.isDirectory && merged.expanded) {
        const childLatest = await this.electronApi.fsApi.readDir(merged.path);

        merged.children = await this.mergeDirectoryNodesImpl(
          existing.children,
          childLatest,
        );
      }

      result.push(merged);
    }

    return result;
  };

  /**
   * Reads the selected directory and sets the nodes to it's values typically used on a new load loses previous state
   * @param path - The selected directory path to fetch and set the global selected directory nodes
   */
  private fetchDirectoryNodes = async (path: string) => {
    try {
      const nodes = await this.electronApi.fsApi.readDir(path);
      this.editorContextService.directoryFileNodes.set(nodes);
    } catch (error: any) {
      this.error.set(`Failed to read the selected directory ${error?.message}`);
    }
  };

  /**
   * Keeps track of the nodes for the selected directory and it's current nodes
   */
  public selectedDirectoryFileNodes: Signal<fileNode[]> = computed(() => {
    return this.editorContextService.directoryFileNodes() ?? [];
  });
}
