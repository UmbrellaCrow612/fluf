import { Command } from '../../command-palette/type';
import { ChangeThemeCommandComponent } from '../../theme/commands/change-theme-command/change-theme-command.component';
import { CreateThemeCommandComponent } from '../../theme/commands/create-theme-command/create-theme-command.component';
import { EditThemeCommandComponent } from '../../theme/commands/edit-theme-command/edit-theme-command.component';

/**
 * Contains all the commands offered by the theme feature to be used in the command pallete
 */
export const themeCommands: Command[] = [
  {
    label: 'Change theme',
    component: ChangeThemeCommandComponent,
    description: 'Change your theme to another',
    prefix: 'theme:change',
  },
  {
    component: CreateThemeCommandComponent,
    description: 'Create a custom theme for the editor',
    label: 'Create theme',
    prefix: 'theme:create',
  },
  {
    component: EditThemeCommandComponent,
    description: 'Edit a theme',
    label: 'Edit theme',
    prefix: 'theme:edit',
  },
];
