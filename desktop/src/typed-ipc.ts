/**
 * Inspired by event emitter pattern from node events
 *
 * Extends the pattern of IpcMain and IpcRenderer types with full type safety
 */

import {
  ipcMain,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
  type IpcRendererEvent,
} from "electron";
import type { StoreEvents } from "./store.js";

/**
 * Define events with their argument types AND return types for handlers
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

/**
 * Unwrap Promise<T> to just T for comparison
 */
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

interface IpcMain<T extends EventMap<T>> {
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
    ) => Promise<UnwrapPromise<ReturnOf<T[K]>>> | UnwrapPromise<ReturnOf<T[K]>>,
  ): void;

  handleOnce<K extends keyof T>(
    channel: K,
    listener: (
      event: IpcMainInvokeEvent,
      ...args: ArgsOf<T[K]>
    ) => Promise<UnwrapPromise<ReturnOf<T[K]>>> | UnwrapPromise<ReturnOf<T[K]>>,
  ): void;

  removeHandler<K extends keyof T>(channel: K): void;
}

export type TypedIpcMain = IpcMain<ApplicationEvents>;

export interface TypedIpcRenderer<T extends EventMap<T>> {
  addListener<K extends keyof T>(
    channel: K,
    listener: (event: IpcRendererEvent, ...args: ArgsOf<T[K]>) => void,
  ): this;

  invoke<K extends keyof T>(
    channel: K,
    ...args: ArgsOf<T[K]>
  ): Promise<UnwrapPromise<ReturnOf<T[K]>>>;

  off<K extends keyof T>(
    channel: K,
    listener: (event: IpcRendererEvent, ...args: ArgsOf<T[K]>) => void,
  ): this;

  on<K extends keyof T>(
    channel: K,
    listener: (event: IpcRendererEvent, ...args: ArgsOf<T[K]>) => void,
  ): this;

  once<K extends keyof T>(
    channel: K,
    listener: (event: IpcRendererEvent, ...args: ArgsOf<T[K]>) => void,
  ): this;

  postMessage<K extends keyof T>(
    channel: K,
    message: ArgsOf<T[K]> extends [infer First, ...any[]] ? First : any,
    transfer?: MessagePort[],
  ): void;

  removeAllListeners<K extends keyof T>(channel?: K): this;

  removeListener<K extends keyof T>(
    channel: K,
    listener: (event: IpcRendererEvent, ...args: ArgsOf<T[K]>) => void,
  ): this;

  send<K extends keyof T>(channel: K, ...args: ArgsOf<T[K]>): void;

  sendSync<K extends keyof T>(
    channel: K,
    ...args: ArgsOf<T[K]>
  ): UnwrapPromise<ReturnOf<T[K]>>;

  sendToHost<K extends keyof T>(channel: K, ...args: ArgsOf<T[K]>): void;
}

/**
 * Contains all fluffy channels and their arguments + return types for IPC
 */
export type ApplicationEvents = StoreEvents;

/**
 * Use this instead of the built in IPC main because we extended it with type safety
 */
export const typedIpcMain = ipcMain as TypedIpcMain;
