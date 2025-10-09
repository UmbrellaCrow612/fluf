/**
 * Represents all possible keys that `event.key` from a `KeyboardEvent` can have.
 *
 * This type covers:
 * - Modifier keys (e.g., Control, Shift, Alt, Meta)
 * - Navigation keys (e.g., Enter, Escape, Backspace, Delete, Home, End, PageUp, PageDown)
 * - Arrow keys (ArrowUp, ArrowDown, ArrowLeft, ArrowRight)
 * - Function keys (F1–F12)
 * - Number keys ('0'–'9')
 * - Letter keys ('a'–'z')
 * - Symbols and punctuation (e.g., `, -, =, [, ], \, ;, ', ,, ., /`)
 * - Numpad keys (Numpad0–Numpad9, NumpadAdd, NumpadSubtract, NumpadMultiply, NumpadDivide, NumpadDecimal)
 *
 * This type can be used for strongly typing hotkeys, keyboard event handlers, and
 * other situations where you need to refer to valid keyboard keys in a type-safe way.
 */
export type WinKey =
  // Modifier keys
  | 'Control'
  | 'Shift'
  | 'Alt'
  | 'Meta' // Command key on Mac / Windows key on Windows
  | 'CapsLock'
  | 'Tab'
  // Navigation keys
  | 'Enter'
  | 'Escape'
  | ' '
  | 'Backspace'
  | 'Delete'
  | 'Home'
  | 'End'
  | 'PageUp'
  | 'PageDown'
  // Arrow keys
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  // Function keys
  | 'F1'
  | 'F2'
  | 'F3'
  | 'F4'
  | 'F5'
  | 'F6'
  | 'F7'
  | 'F8'
  | 'F9'
  | 'F10'
  | 'F11'
  | 'F12'
  // Number keys
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  // Letter keys
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z'
  // Symbols / punctuation
  | '`'
  | '-'
  | '='
  | '['
  | ']'
  | '\\'
  | ';'
  | "'"
  | ','
  | '.'
  | '/'
  // Numpad keys
  | 'Numpad0'
  | 'Numpad1'
  | 'Numpad2'
  | 'Numpad3'
  | 'Numpad4'
  | 'Numpad5'
  | 'Numpad6'
  | 'Numpad7'
  | 'Numpad8'
  | 'Numpad9'
  | 'NumpadAdd'
  | 'NumpadSubtract'
  | 'NumpadMultiply'
  | 'NumpadDivide'
  | 'NumpadDecimal';
