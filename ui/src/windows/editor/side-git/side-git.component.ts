import {
  Component,
  computed,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { EditorContextService } from '../editor-context/editor-context.service';
import { MatButtonModule } from '@angular/material/button';
import { FileChangeInfo } from 'fs/promises';
import { getElectronApi } from '../../../utils';
import { gitStatusResult, voidCallback } from '../../../gen/type';

@Component({
  selector: 'app-side-git',
  imports: [MatButtonModule],
  templateUrl: './side-git.component.html',
  styleUrl: './side-git.component.css',
})
export class SideGitComponent implements OnInit, OnDestroy {
  private readonly api = getElectronApi();
  private readonly contextService = inject(EditorContextService);
  private readonly ngZone = inject(NgZone);

  selectedDir = computed(() => this.contextService.selectedDirectoryPath());

  errorMessage: string | null = null;
  isLoading = false;

  isGitInit = false;

  gitStatusResult: gitStatusResult | null = null;

  unSub: voidCallback | null = null;

  async ngOnInit() {
    await this.loadState();
  }

  async loadState() {
    this.isLoading = true;
    this.errorMessage = null;

    let hasGitInSystsem = await this.api.gitApi.hasGit();
    if (!hasGitInSystsem) {
      this.errorMessage =
        'GIT is not installed on the system please download git, then close and reopen the editor';
      this.isLoading = false;
      return;
    }

    this.isGitInit = await this.api.gitApi.isGitInitialized(
      this.selectedDir()!,
    );
    if (!this.isGitInit) {
      this.isLoading = false;
      return;
    }

    this.gitStatusResult = await this.api.gitApi.gitStatus(this.selectedDir()!);

    this.unSub = this.api.fsApi.onChange(this.selectedDir()!, (_, event) => {
      this.runGitStatus(event);
    });

    this.isLoading = false;
  }

  isCreatingGitRepo = false;
  creatingGitError: string | null = null;
  async createGitRepo() {
    this.isCreatingGitRepo = true;

    let suc = await this.api.gitApi.initializeGit(this.selectedDir()!);
    if (!suc) {
      this.creatingGitError = 'Failed';
      this.isCreatingGitRepo = false;
      return;
    }

    this.isCreatingGitRepo = false;
    this.isGitInit = true;

    this.unSub = this.api.fsApi.onChange(this.selectedDir()!, (_, event) => {
      this.runGitStatus(event);
    });
  }

  private runGitStatus(event: FileChangeInfo<string>) {
    const eventType = event.eventType;
    const filePath = event.filename;

    if (eventType !== 'change' && eventType !== 'rename') {
      return;
    }

    if (!filePath) {
      return;
    }

    if (filePath.includes('.git')) {
      return;
    }

    console.log('yo');

    this.api.gitApi.gitStatus(this.selectedDir()!).then((x) => {
      this.ngZone.run(() => {
        this.gitStatusResult = x;
      });
    });
  }

  ngOnDestroy(): void {
    if (this.unSub) {
      this.unSub();
    }
  }
}
