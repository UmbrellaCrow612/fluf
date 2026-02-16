/**
 * Inspired by event emitter pattern from node events
 *
 * Extends the pattern of IpcMain type
 */

import { ipcMain, type IpcMainEvent, type IpcMainInvokeEvent } from "electron";

type EventMap<T> = Record<keyof T, any[]>;

export interface TypedIpcMain<T extends EventMap<T>> {
  addListener<K extends keyof T>(
    channel: K,
    listener: (event: IpcMainEvent, ...args: T[K]) => void,
  ): this;

  handle<K extends keyof T>(
    channel: K,
    listener: (event: IpcMainInvokeEvent, ...args: T[K]) => Promise<any> | any,
  ): void;

  handleOnce<K extends keyof T>(
    channel: K,
    listener: (event: IpcMainInvokeEvent, ...args: T[K]) => Promise<any> | any,
  ): void;

  off<K extends keyof T>(
    channel: K,
    listener: (event: IpcMainEvent, ...args: T[K]) => void,
  ): this;

  on<K extends keyof T>(
    channel: K,
    listener: (event: IpcMainEvent, ...args: T[K]) => void,
  ): this;

  once<K extends keyof T>(
    channel: K,
    listener: (event: IpcMainEvent, ...args: T[K]) => void,
  ): this;

  removeAllListeners<K extends keyof T>(channel?: K): this;

  removeHandler<K extends keyof T>(channel: K): void;

  removeListener<K extends keyof T>(
    channel: K,
    listener: (...args: T[K]) => void,
  ): this;
}

/**
 * Contains all flufy channel;s and there argumnets for IPC main
 */
export interface ApplicationEvents {
  "app:ready": [isReady: boolean];
}

/**
 * Use this instead of the built in IPC main becuase we extened it with type saftey
 */
export const typedIpcMain = ipcMain as TypedIpcMain<ApplicationEvents>;
