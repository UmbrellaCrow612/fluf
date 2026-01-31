import { themeCommands } from '../theme/commands';
import { SearchFileCommandComponent } from './search-file-command/search-file-command.component';
import { Command } from './type';

/**
 * Holds all commands, used for search and selecting a given command in the UI
 */
export const CommandPaletteCommandList: Command[] = [
  {
    prefix: 'file:search',
    description: 'Search for a specific file',
    label: 'File search',
    component: SearchFileCommandComponent,
  },
  ...themeCommands,
];
