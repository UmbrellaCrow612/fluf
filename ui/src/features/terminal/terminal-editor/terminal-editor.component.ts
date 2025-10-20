import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  ChangeDetectorRef, // 1. Import ChangeDetectorRef
} from '@angular/core';
import { ContextService } from '../../app-context/app-context.service';
import { getElectronApi } from '../../../utils';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';

// This type would come from your type definitions
type anonCallback = () => void;

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
  private readonly cdr = inject(ChangeDetectorRef); // 2. Inject ChangeDetectorRef

  currentActiveTerminal: terminalInformation | null = null;
  currentActiveTerminalId: string | null = null;

  error: string | null = null;
  isLoading = false;

  cmdInputControl = new FormControl('', {
    validators: [Validators.required],
  });

  outputStr: string = '';
  unSubData: Function | null = null;

  async ngOnInit() {
    let init = this.appContext.getSnapshot();

    this.currentActiveTerminalId = init.currentActiveTerminald;
    this.currentActiveTerminal =
      init.terminals?.find((x) => x.id == this.currentActiveTerminalId) ?? null;

    this.initTerm(); 

    this.appContext.autoSub(
      'currentActiveTerminald',
      async (ctx) => {
        this.currentActiveTerminalId = ctx.currentActiveTerminald;
        this.currentActiveTerminal =
          ctx.terminals?.find((x) => x.id == this.currentActiveTerminalId) ??
          null;

        this.initTerm();
      },
      this.destroyRef
    );

    this.unSubData = this.api.onTerminalData((data) => {
      if (data.id === this.currentActiveTerminalId) {
        this.outputStr = data.output;
        this.cdr.markForCheck();
      }
    });

    const unSubExit = this.api.onTerminalExit(({ id }) => {
      if (id === this.currentActiveTerminalId) {
        this.error = 'Active terminal was closed.';
        this.outputStr = '';
        this.currentActiveTerminal = null;
        this.currentActiveTerminalId = null;
        this.cdr.markForCheck();
      }
    });

    this.destroyRef.onDestroy(() => {
      unSubExit();
    });
  }

  ngOnDestroy(): void {
    if (this.unSubData) {
      this.unSubData();
    }
  }

  /**
   * Loads and binds ui to the terminal thats active and other state
   */
  initTerm() {
    this.error = null;
    this.isLoading = true;

    if (!this.currentActiveTerminal) {
      this.error = 'No terminal found';
      this.isLoading = false;
      this.outputStr = ''; // Clear output if no terminal
      return;
    }

    this.outputStr = this.currentActiveTerminal.output;
    this.isLoading = false;
  }

  /**
   * Runs a custom cmd wants to be run
   */
  async onSubmit(event: Event) {
    event.preventDefault(); // Stop form from reloading page

    if (this.cmdInputControl.invalid || !this.currentActiveTerminalId) {
      return;
    }

    const cmd = this.cmdInputControl.value;
    if (!cmd) return;

    try {
      const success = await this.api.runCmdsInTerminal(
        undefined,
        this.currentActiveTerminalId,
        cmd
      );
      
      if (success) {
        this.cmdInputControl.setValue(''); // Clear input on success
      } else {
        this.error = `Failed to run command in terminal.`;
      }
    } catch (err) {
      this.error = 'Error running command.';
      console.error(err);
    }
  }
}