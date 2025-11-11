import { Component, inject, OnInit } from '@angular/core';
import { getElectronApi } from '../../utils';
import { ContextService } from '../app-context/app-context.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-side-git',
  imports: [MatButtonModule],
  templateUrl: './side-git.component.html',
  styleUrl: './side-git.component.css',
})
export class SideGitComponent implements OnInit {
  private readonly api = getElectronApi();
  private readonly contextService = inject(ContextService);

  selectedDir = this.contextService.getSnapshot().selectedDirectoryPath;

  errorMessage: string | null = null;
  isLoading = false;

  isGitInit = false;

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
    // call load git changes and render component
  }
}
