import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { getElectronApi } from '../../utils';
import { ContextService } from '../app-context/app-context.service';
import { MatButtonModule } from '@angular/material/button';
import { gitStatusResult, voidCallback } from '../../gen/type';

@Component({
  selector: 'app-side-git',
  imports: [MatButtonModule],
  templateUrl: './side-git.component.html',
  styleUrl: './side-git.component.css',
})
export class SideGitComponent implements OnInit, OnDestroy {
  private readonly api = getElectronApi();
  private readonly contextService = inject(ContextService);

  selectedDir = this.contextService.getSnapshot().selectedDirectoryPath;

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
      undefined,
      this.selectedDir!
    );
    if (!this.isGitInit) {
      this.isLoading = false;
      return;
    }

    await this.api.gitApi.watchGitRepo(undefined, this.selectedDir!);
    this.gitStatusResult = await this.api.gitApi.gitStatus(
      undefined,
      this.selectedDir!
    );

    this.unSub = this.api.gitApi.onGitChange((data) => {
      this.gitStatusResult = data;
    });

    this.isLoading = false;
  }

  isCreatingGitRepo = false;
  creatingGitError: string | null = null;
  async createGitRepo() {
    this.isCreatingGitRepo = true;

    let res = await this.api.gitApi.initializeGit(undefined, this.selectedDir!);
    if (!res.success) {
      this.creatingGitError = res.error;
      this.isCreatingGitRepo = false;
    }

    this.isCreatingGitRepo = false;
    this.isGitInit = true;
    await this.api.gitApi.watchGitRepo(undefined, this.selectedDir!);
    this.gitStatusResult = await this.api.gitApi.gitStatus(
      undefined,
      this.selectedDir!
    );
  }

  ngOnDestroy(): void {
    if (this.unSub) {
      this.unSub();
    }
  }
}
