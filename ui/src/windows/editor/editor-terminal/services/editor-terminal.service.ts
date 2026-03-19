import { inject, Injectable } from '@angular/core';
import { useEffect } from '../../../../lib/useEffect';
import { EditorInMemoryContextService } from '../../editor-state/editor-in-memory-context.service';
import { voidCallback } from '../../../../gen/type';
import { getElectronApi } from '../../../../utils';
import { EditorStateService } from '../../editor-state/editor-state.service';

@Injectable({
  providedIn: 'root',
})
export class EditorTerminalService {
  private readonly editorInMemoryContextService = inject(
    EditorInMemoryContextService,
  );
  private readonly editorStateService = inject(EditorStateService);
  private readonly electronApi = getElectronApi();

  /**
   * Keeps track of all the disposes needed to run to stop leak memeory
   */
  private readonly ptyDisposes: voidCallback[] = [];

  /**
   * Listens to terminal shell pty id's and keep the local UI buffer in line with the backend pty buffer
   * @returns A useffect which listens to terminal pty backend changes and updates our buffer for the specific terminal
   */
  public async InitiizeBackgroundTerminalBufferListerner() {
    return useEffect(
      (_, shells, bottomDisplayed) => {
        this.cleanUpState();

        if (!shells) {
          return;
        }

        if (bottomDisplayed) {
          return;
        }

        // here the bottom should not be displayed

        for (let index = 0; index < shells.length; index++) {
          const pid = shells[index];

          this.ptyDisposes.push(
            this.electronApi.shellApi.onChange(pid, (_, chunk) => {
              console.log(
                '[EditorTerminalService] backgrounbd buffer updated for PID: ',
                pid,
              );

              const bufferMap =
                this.editorInMemoryContextService.terminalBuffers();

              let previousBuffer = bufferMap.get(pid);

              if (previousBuffer) {
                previousBuffer += chunk;
              } else {
                previousBuffer = chunk;
              }

              bufferMap.set(pid, previousBuffer);
            }),
          );
        }
      },
      [
        this.editorInMemoryContextService.shells,
        this.editorStateService.displayFileEditorBottom,
      ],
    );
  }

  /**
   * Cleans the state
   */
  private cleanUpState() {
    console.log('[EditorTerminalService] clean up ran');
    this.ptyDisposes.forEach((dispose) => {
      dispose();
    });
  }
}
