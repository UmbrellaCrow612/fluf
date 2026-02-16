/**
 * Inspired by event emitter pattern from node events
 *
 * Extends the pattern of IpcMain type with full type safety for arguments and return values
 */

import { ipcMain, type IpcMainEvent, type IpcMainInvokeEvent } from "electron";

/**
 * Define events with their argument types AND return types for handlers
 *
 * @example
 * {
 *   "channel:name": {
 *     args: [string, number],
 *     return: boolean
 *   }
 *   "channel:fire": {
 *     args: [payload: SomeType],
 *     return: void // for fire-and-forget events
 *   }
 * }
 */
type EventDefinition = {
  args: any[];
  return?: any;
};

type EventMap<T> = Record<keyof T, EventDefinition>;

/**
 * Extract just the argument tuple from an event definition
 */
type ArgsOf<T> = T extends { args: infer A } ? A : never;

/**
 * Extract the return type from an event definition (defaults to void)
 */
type ReturnOf<T> = T extends { return: infer R } ? R : void;

export interface TypedIpcMain<T extends EventMap<T>> {
  addListener<K extends keyof T>(
    channel: K,
    listener: (event: IpcMainEvent, ...args: ArgsOf<T[K]>) => void,
  ): this;

  on<K extends keyof T>(
    channel: K,
    listener: (event: IpcMainEvent, ...args: ArgsOf<T[K]>) => void,
  ): this;

  once<K extends keyof T>(
    channel: K,
    listener: (event: IpcMainEvent, ...args: ArgsOf<T[K]>) => void,
  ): this;

  off<K extends keyof T>(
    channel: K,
    listener: (event: IpcMainEvent, ...args: ArgsOf<T[K]>) => void,
  ): this;

  removeListener<K extends keyof T>(
    channel: K,
    listener: (event: IpcMainEvent, ...args: ArgsOf<T[K]>) => void,
  ): this;

  removeAllListeners<K extends keyof T>(channel?: K): this;

  handle<K extends keyof T>(
    channel: K,
    listener: (
      event: IpcMainInvokeEvent,
      ...args: ArgsOf<T[K]>
    ) => Promise<ReturnOf<T[K]>> | ReturnOf<T[K]>,
  ): void;

  handleOnce<K extends keyof T>(
    channel: K,
    listener: (
      event: IpcMainInvokeEvent,
      ...args: ArgsOf<T[K]>
    ) => Promise<ReturnOf<T[K]>> | ReturnOf<T[K]>,
  ): void;

  removeHandler<K extends keyof T>(channel: K): void;
}

/**
 * Contains all fluffy channels and their arguments + return types for IPC main
 */
export interface ApplicationEvents {
  "app:ready": {
    args: [isReady: boolean];
    return: void; // fire-and-forget event
  };

  "app:get-version": {
    args: [];
    return: string;
  };

  "app:open-file": {
    args: [filePath: string, options?: { readOnly?: boolean }];
    return: Promise<{ success: boolean; content?: string; error?: string }>;
  };

  "db:query": {
    args: [sql: string, params?: unknown[]];
    return: Promise<{ rows: unknown[]; count: number }>;
  };

  "window:minimize": {
    args: [windowId?: number];
    return: void;
  };
}

/**
 * Use this instead of the built in IPC main because we extended it with type safety
 */
export const typedIpcMain = ipcMain as TypedIpcMain<ApplicationEvents>;