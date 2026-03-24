import {
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  Signal,
} from '@angular/core';
import { EditorFileExplorerTreeItemComponent } from '../editor-file-explorer-tree-item/editor-file-explorer-tree-item.component';
import { fileNode, voidCallback } from '../../../gen/type';
import { getElectronApi } from '../../../shared/electron';
import { EditorInMemoryStateService } from '../core/state/editor-in-memory-state.service';
import { useEffect } from '../../../lib/useEffect';
import { normalize } from '../../../lib/path';

/**
 * Component that renders a node tree structure for a node and it's children node.
 * 
 * THe reason we design it to be agnostic and accept root node and other fields so we can render a tree of any directory file explroer is just a implamenation of this 
 * with specific contrained needs.
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
 */
@Component({
  selector: 'app-editor-file-explorer-tree',
  imports: [EditorFileExplorerTreeItemComponent],
  templateUrl: './editor-file-explorer-tree.component.html',
  styleUrl: './editor-file-explorer-tree.component.css',
})
export class EditorFileExplorerTreeComponent implements OnDestroy {
  private readonly editorInMemoryStateService = inject(
    EditorInMemoryStateService,
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

  /**
   * Holds a refrence to the root node / selected directory node to show in the tree view
   */
  public readonly rootNode = input.required<fileNode>();

  /**
   * Holds a refrence to the children nodes fetched fore the root node or previous nodes emitted change this when the given children change and are emitted to show
   * the nodes in UI
   */
  public readonly rootNodeChildren = input.required<fileNode[]>();

  /**
   * The current active node
   */
  public readonly activeNode = input.required<fileNode | null>();

  /**
   * Emits a event when the root nodes children are updated and then emitted
   */
  public readonly rootNodeChildrenUpdated = output<fileNode[]>();

  /**
   * Emits when a child tree node is clicked
   */
  public readonly itemSelected = output<fileNode>();

  constructor() {
    useEffect(
      // whenever refresh directory is run we merge nodes
      async (_, count) => {
        console.log('[EditorFileExplorerTreeComponent] refresh effect ran');
        const rootNode = this.rootNode();

        if (count > 0 && rootNode) {
          await this.mergeDirectoryNodes(rootNode);
        }
      },
      [this.editorInMemoryStateService.refreshDirectory],
    );

    useEffect(
      async (_, newRootNode) => {
        // whenever the root node changes i.e selected directory we re run out logic
        console.log(
          '[EditorFileExplorerTreeComponent] selected directory effect ran',
        );
        this.error.set(null);

        if (!newRootNode) {
          this.error.set(`No selected directory`);
          return;
        }

        this.selectedDirectoryUnsub?.();

        const nodes = this.rootNodeChildren();

        if (normalize(newRootNode.path) !== this.previousSelectedDirectory) {
          if (this.previousSelectedDirectory) {
            console.log(
              `Stopped watching at path ${this.previousSelectedDirectory}`,
            );
            this.electronApi.fsApi.stopWatching(this.previousSelectedDirectory);
          }

          this.previousSelectedDirectory = normalize(newRootNode.path);

          this.selectedDirectoryUnsub = this.electronApi.fsApi.onChange(
            this.previousSelectedDirectory,
            (path, event) => {
              console.log(
                `[EditorFileExplorerTreeComponent] Directory changed at path `,
                path,
                event,
              );
              this.editorInMemoryStateService.refreshDirectory.update(
                (x) => x + 1,
              );
            },
          );

          if (nodes && nodes.length > 0) {
            console.log('Merging latest nodes');
            await this.mergeDirectoryNodes(newRootNode);
          } else {
            console.log('Fetching nodes latests');
            await this.fetchDirectoryNodes(this.previousSelectedDirectory);
          }
        }
      },
      [this.rootNode],
    );
  }

  ngOnDestroy(): void {
    this.selectedDirectoryUnsub?.();
  }

  /**
   * Merges the current nodes in state with latest keeping state between them and also removing stale nodes and updating there values
   * @param rootNode - The root node to fetch the merge the nodes for
   */
  private mergeDirectoryNodes = async (rootNode: fileNode) => {
    const current = this.rootNodeChildren();
    const latest = await this.electronApi.fsApi.readDir(rootNode.path);
    const updated = await this.mergeDirectoryNodesImpl(current, latest);

    this.rootNodeChildrenUpdated.emit(updated);
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
      currentNodes.map((node) => [normalize(node.path), node]),
    );

    const result: fileNode[] = [];

    for (const latestNode of latestNodes) {
      const existing = currentMap.get(normalize(latestNode.path));

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
      this.rootNodeChildrenUpdated.emit(nodes);
    } catch (error: any) {
      this.error.set(`Failed to read the selected directory ${error?.message}`);
    }
  };
}
