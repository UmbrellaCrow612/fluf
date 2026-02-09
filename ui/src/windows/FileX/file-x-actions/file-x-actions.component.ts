import { Component, computed, inject, signal, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileXInMemoryContextService } from '../file-x-context/file-x-in-memory-context.service';
import { voidCallback } from '../../../gen/type';
import { ConfirmationService } from '../../../app/confirmation/confirmation.service';

/**
 * Represents a clickable item
 */
type Action = {
  /**
   * Hover information
   */
  label: string;

  /**
   * Mat icon name
   */
  iconName: string;

  /**
   * Computed signal if the given btn should be disabled
   */
  isDisabled: Signal<boolean>;

  /**
   * Logic to run when it is clicked
   */
  onClick: () => Promise<void>;
};

@Component({
  selector: 'app-file-x-actions',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './file-x-actions.component.html',
  styleUrl: './file-x-actions.component.css',
})
export class FileXActionsComponent {
  private readonly fileXInMemoryContextService = inject(
    FileXInMemoryContextService,
  );
  private readonly confirmationService = inject(ConfirmationService);

  /**
   * Signal becuase it should only render once i.e doesnt change
   */
  defaultActions: Signal<Action[]> = signal([
    {
      label: 'New item',
      iconName: 'add',

      // user can create anytime
      isDisabled: computed(() => false),

      onClick: () => {
        return Promise.resolve();
      },
    },
    {
      label: 'Delete item',
      iconName: 'delete',
      isDisabled: computed(() => {
        let selectedItems = this.fileXInMemoryContextService.selectedItems();
        let hasMoreThanOneSelected = selectedItems.length > 0;
        return !hasMoreThanOneSelected; // we need at least one item selected to delete
      }),
      onClick: async () => {
        let selectedItems = this.fileXInMemoryContextService.selectedItems();
        try {
          let shouldDelete = await this.confirmationService.ask(
            `Are you sure you want to delete ${selectedItems.length} items`,
          );
          if (shouldDelete) {
            // run delete logic
          }
        } catch (error) {
          console.error(error) // promise rejects
        }
      },
    },
  ]);
}
