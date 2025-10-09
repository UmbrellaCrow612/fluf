import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HotKeyService, HotKey } from '../features/hotkeys/hot-key.service';
import { ContextService } from '../features/hotkeys/app-context.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly hotKeyService = inject(HotKeyService);
  private readonly contextService = inject(ContextService);

  number = 5;

  hotKey: HotKey = {
    keys: ['Control', 'p'], // Specify the keys for Ctrl + P
    callback: (ctx) => {
      if (ctx.section == 'file') {
        console.log('Control + P ran in file');
        this.number = 100;
        return;
      }
      this.number = 12;
      console.log('Control + P ran');
    },
  };

  ngOnInit() {
    this.hotKeyService.sub(this.hotKey);
  }

  ngOnDestroy() {
    this.hotKeyService.unsub(this.hotKey);
  }

  change() {
    this.contextService.setContext({ section: 'file' });
  }
}
