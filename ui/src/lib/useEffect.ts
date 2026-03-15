import {
  CreateEffectOptions,
  effect,
  EffectCleanupRegisterFn,
  EffectRef,
  Signal,
  untracked,
} from '@angular/core';

/**
 * Extract the inner type from a Signal.
 * @template T - The Signal type to unwrap
 */
type SignalValue<T> = T extends Signal<infer V> ? V : never;

/**
 * Map a tuple of Signals to a tuple of their value types.
 * @template T - A readonly tuple of Signal types
 */
type DependenciesValues<T extends readonly Signal<unknown>[]> = {
  [K in keyof T]: SignalValue<T[K]>;
};

/**
 * Creates a reactive effect that runs whenever any of the specified signal dependencies change.
 *
 * Similar to React's `useEffect`, this hook subscribes to signal changes and executes the
 * callback when dependencies update. The callback receives the cleanup registration function
 * as its first argument, followed by the current values of all dependencies.
 *
 * **Important Safety Rules:**
 *
 * 1. **DO NOT update signal dependencies inside the callback** - This will cause an infinite
 *    loop because updating a dependency triggers the effect, which then updates the dependency
 *    again. Always use `untracked()` if you need to write to signals that are also dependencies.
 *
 * 2. **Cleanup functions** - Register cleanup logic using the `onCleanup` function passed as
 *    the first argument to your callback. This is useful for subscriptions, timers, event
 *    listeners, or aborting in-flight async operations.
 *
 * 3. **Async effects** - The callback can be async, but be aware that subsequent effect runs
 *    may occur before your async operation completes. Use `onCleanup` to register an abort
 *    controller cleanup or similar cancellation patterns.
 *
 * 4. **Untracked execution** - The callback runs inside `untracked()` to prevent accidental
 *    signal reads from creating additional dependencies. Explicitly declare all dependencies
 *    in the dependencies array.
 *
 * @template T - A readonly tuple of Signal types that this effect depends on
 *
 * @param callback - Function to execute when dependencies change. Receives:
 *   1. `onCleanup` - A function to register cleanup logic that runs before the next effect
 *      execution or when the effect is destroyed.
 *   2. Current values of all dependencies as subsequent arguments in the same order as the
 *      dependencies array.
 *   Can return void or Promise<void>.
 * @param dependencies - Array of signals to watch. The effect runs whenever any of these
 *   signals emit a new value.
 * @param options - Configuration options passed to Angular's underlying `effect()` function.
 *   See {@link CreateEffectOptions} for available options.
 *
 * @returns {EffectRef} A reference to the created effect, which can be used to manually
 *   destroy the effect via `.destroy()` when needed.
 *
 * @example
 * ```typescript
 * const count = signal(0);
 * const name = signal('Angular');
 *
 * // Basic usage - logs whenever count or name changes
 * useEffect((onCleanup, currentCount, currentName) => {
 *   console.log(`Count: ${currentCount}, Name: ${currentName}`);
 * }, [count, name]);
 *
 * // With cleanup - useful for subscriptions
 * useEffect((onCleanup, currentCount) => {
 *   const subscription = someObservable.subscribe();
 *
 *   onCleanup(() => {
 *     subscription.unsubscribe();
 *   });
 * }, [count]);
 *
 * // Async effect with proper cleanup handling
 * useEffect((onCleanup, userId) => {
 *   const controller = new AbortController();
 *
 *   fetchUser(userId, { signal: controller.signal })
 *     .then(data => {
 *       // handle data
 *     })
 *     .catch(e => {
 *       // handle error
 *     });
 *
 *   onCleanup(() => {
 *     controller.abort();
 *   });
 * }, [userId]);
 *
 * // ⚠️ WRONG: This creates an infinite loop!
 * useEffect((onCleanup, currentCount) => {
 *   count.set(currentCount + 1); // ❌ Don't update a dependency!
 * }, [count]);
 *
 * // ✅ CORRECT: Use untracked for writes to dependencies
 * useEffect((onCleanup, currentCount) => {
 *   untracked(() => {
 *     count.set(currentCount + 1); // Safe because it's untracked
 *   });
 * }, [count]);
 * ```
 *
 * @see {@link https://angular.dev/guide/signals#effects Angular Effects Guide}
 * @see {@link https://react.dev/reference/react/useEffect React useEffect Reference}
 */
export const useEffect = <const T extends readonly Signal<unknown>[]>(
  callback: (
    onCleanup: EffectCleanupRegisterFn,
    ...values: DependenciesValues<T>
  ) => void | Promise<void>,
  dependencies: T,
  options: CreateEffectOptions = {},
): EffectRef => {
  return effect(
    (onCleanup: EffectCleanupRegisterFn) => {
      const values = dependencies.map((dep) => dep()) as DependenciesValues<T>;

      untracked(() => {
        callback(onCleanup, ...values);
      });
    },
    {
      ...options,
    },
  );
};
