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
import { ReactiveFormsModule, FormControl, Validators, FormsModule } from '@angular/forms';
import { HotKey, HotKeyService } from '../../hotkeys/hot-key.service';

type UnsubscribeCallback = () => void;

@Component({
  selector: 'app-terminal-editor',
  imports: [ReactiveFormsModule, FormsModule],
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

  unsSub: UnsubscribeCallback | null = null;

  async ngOnInit() {
    const init = this.appContext.getSnapshot();

    this.hotKeyService.autoSub(this.graceStopTermHotKey, this.destroyRef);

    // Initial setup
    this.currentActiveShellId = init.currentActiveShellId;
    this.currentActiveShell =
      init.shells?.find((x) => x.id == this.currentActiveShellId) ?? null;

    await this.initShell();

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
    if (this.unsSub) {
      this.unsSub();
    }
  }

  /**
   * Loads and binds ui to the terminal thats active and other state
   */
  async initShell() {
    this.error = null;
    this.isLoading = true;
    this.fullOutput = '';

    if (this.unsSub) {
      this.unsSub();
    }
  
    if (!this.currentActiveShell || !this.currentActiveShellId) {
      this.error = 'No active terminal selected.';
      this.isLoading = false;
      return;
    }

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

    this.unsSub = this.api.onShellChange(this.currentActiveShellId, (data) => {
      this.zone.run(() => {
        this.fullOutput += data.chunk;
        const lines = this.fullOutput.split(/\r?\n/);
        const maxLines = 100; // Increased buffer for better context
        if (lines.length > maxLines) {
          this.fullOutput = lines.slice(-maxLines).join('\n');
        }
      });
    });

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
