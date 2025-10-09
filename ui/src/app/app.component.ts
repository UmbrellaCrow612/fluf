import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HotKeyService } from '../features/hotkeys/hot-key.service';
import { Keys } from '../features/hotkeys/keys';
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
  ngOnInit() {
    this.hotKeyService.subscribe(
      [Keys.Control, Keys.P],
      (context) => {
        console.log('Ctrl+P pressed in file section!', context);
        // do your logic here
      },
      (context) => context.section === 'file' // only fire if in 'file' context
    );
  }

  ngOnDestroy() {
    // optional: unsubscribe if needed
    this.hotKeyService.unsubscribe([Keys.Control, Keys.P], (context) => {
      console.log('Ctrl+P pressed in file section!', context);
    });
  }
}
