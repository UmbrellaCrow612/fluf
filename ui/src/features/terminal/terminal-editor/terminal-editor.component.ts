import {
  Component,
  DestroyRef,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ContextService } from '../../app-context/app-context.service';
import { getElectronApi } from '../../../utils';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { HotKey, HotKeyService } from '../../hotkeys/hot-key.service';

type UnsubscribeCallback = () => void;

@Component({
  selector: 'app-terminal-editor',
  imports: [ReactiveFormsModule],
  templateUrl: './terminal-editor.component.html',
  styleUrl: './terminal-editor.component.css',
})
export class TerminalEditorComponent implements OnInit, OnDestroy {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = getElectronApi();
  private readonly zone = inject(NgZone);
  private readonly hotKeyService = inject(HotKeyService);

  graceStopTermHotKey: HotKey = {
    callback: async () => {
      if (this.currentActiveShellId) {
        await this.api.stopCmdInShell(undefined, this.currentActiveShellId);
      }
    },
    keys: ['Control', 'c'],
  };

  fullOutput: string = '';
  currentActiveShell: shellInformation | null = null;
  currentActiveShellId: string | null = null;

  error: string | null = null;
  isLoading = false;

  cmdInputControl = new FormControl('', {
    validators: [Validators.required],
    nonNullable: true,
  });

  // Use an array to hold multiple unsubscribe functions
  private shellListeners: UnsubscribeCallback[] = [];

  async ngOnInit() {
    const init = this.appContext.getSnapshot();

    this.hotKeyService.autoSub(this.graceStopTermHotKey, this.destroyRef);

    // Initial setup
    this.currentActiveShellId = init.currentActiveShellId;
    this.currentActiveShell =
      init.shells?.find((x) => x.id == this.currentActiveShellId) ?? null;
    await this.initShell();

    // Subscribe to changes in the active shell
    this.appContext.autoSub(
      'currentActiveShellId',
      async (ctx) => {
        this.currentActiveShellId = ctx.currentActiveShellId;
        this.currentActiveShell =
          ctx.shells?.find((x) => x.id == this.currentActiveShellId) ?? null;
        await this.initShell();
      },
      this.destroyRef
    );
  }

  ngOnDestroy() {
    // Cleanup all listeners when the component is destroyed
    this.cleanupShellListeners();
  }

  /**
   * Cleans up all active shell event listeners.
   */
  private cleanupShellListeners() {
    this.shellListeners.forEach((unsub) => unsub());
    this.shellListeners = [];
  }

  /**
   * Handles the shell closing unexpectedly.
   * @param data - The close or error data from the backend.
   */
  private handleShellClose(data: shellCloseData, reason: 'closed' | 'errored') {
    this.zone.run(() => {
      let message = '';
      if (reason === 'closed') {
        const closeData = data as shellCloseData;
        message = `Terminal process exited with code ${closeData.code}.`;
      }

      console.warn(`Shell ${data.id} has closed. Reason: ${reason}`);
      this.error = `${message} Please create a new terminal.`;

      // Disable the input to prevent sending commands to a dead shell
      this.cmdInputControl.disable();

      this.currentActiveShell = null;
      // It's also a good idea to remove the dead shell from the global context
      // this.appContext.removeShell(data.id);

      // Clean up the listeners for this dead shell
      this.cleanupShellListeners();
    });
  }

  /**
   * Loads and binds ui to the terminal thats active and other state
   */
  async initShell() {
    // Always clean up previous listeners before setting up new ones
    this.cleanupShellListeners();

    this.error = null;
    this.isLoading = true;
    this.fullOutput = '';
    this.cmdInputControl.enable(); // Re-enable input for the new shell

    if (!this.currentActiveShell || !this.currentActiveShellId) {
      this.error = 'No active terminal selected.';
      this.isLoading = false;
      this.cmdInputControl.disable();
      return;
    }

    // Check if the shell process still exists on the backend
    const alive = await this.api.isShellActive(
      undefined,
      this.currentActiveShellId
    );
    if (!alive) {
      this.error =
        'The selected terminal process is no longer running. Please create a new one.';
      this.isLoading = false;
      this.cmdInputControl.disable();
      // this.appContext.removeShell(this.currentActiveShellId);
      return;
    }

    // --- SETUP NEW LISTENERS ---

    // 1. Listen for standard output/error
    const unSubChange = this.api.onShellChange(
      this.currentActiveShellId,
      (data) => {
        this.zone.run(() => {
          this.fullOutput += data.chunk;
          const lines = this.fullOutput.split(/\r?\n/);
          const maxLines = 100; // Increased buffer for better context
          if (lines.length > maxLines) {
            this.fullOutput = lines.slice(-maxLines).join('\n');
          }
        });
      }
    );

    // 2. Listen for the shell closing (CRITICAL FOR THE FIX)
    const unSubClose = this.api.onShellClose(
      this.currentActiveShellId,
      (data) => this.handleShellClose(data, 'closed')
    );

    // Store the unsubscribe functions to be called later
    this.shellListeners.push(unSubChange, unSubClose);

    this.isLoading = false;
  }

  /**
   * Runs a command that the user wants to run.
   */
  async onSubmit(event: Event) {
    event.preventDefault();
    if (!this.cmdInputControl.valid || !this.currentActiveShellId) {
      return;
    }

    const cmd = this.cmdInputControl.value;
    await this.api.runCmdsInShell(undefined, this.currentActiveShellId, cmd);

    this.cmdInputControl.setValue('');
  }
}
