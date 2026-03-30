/**
 * Assert a value is an array
 * @param value The value to assert as an array
 * @throws Error if the value isn't an array
 */
export function assertArray(value: unknown): void {
  if (!Array.isArray(value)) {
    throw new TypeError(
      `Assertion failed: received type ${typeof value} but expected an array`,
    );
  }
}

export function assertString(value: unknown): void {
  const type = typeof value;
  if (type !== "string" || (value as string).length === 0) {
    throw new TypeError(
      `Assertion failed: received type ${type} but expected a non-empty string for value`,
    );
  }
}

export function assertStringArray(value: unknown): void {
  assertArray(value);
  const arr = value as unknown[];
  if (arr.length === 0) {
    throw new TypeError(
      `Assertion failed: received an empty array but expected a non-empty string array`,
    );
  }
  const nonStringIndex = arr.findIndex((item) => typeof item !== "string");
  if (nonStringIndex !== -1) {
    const item = arr[nonStringIndex];
    throw new TypeError(
      `Assertion failed: array item at index ${String(nonStringIndex)} has type ${typeof item} but expected string`,
    );
  }
}

/**
 * Assert a value is a non-null object (not an array, not a primitive)
 * @param value The value to assert as an object
 * @throws Error if the value isn't an object, is null, or is an array
 */
export function assertObject(value: unknown): void {
  const type = typeof value;

  if (type !== "object" || value === null || Array.isArray(value)) {
    const actualType =
      value === null ? "null" : Array.isArray(value) ? "array" : type;
    throw new TypeError(
      `Assertion failed: received type ${actualType} but expected a non-null object`,
    );
  }
}

export function assertNonNegativeNumber(value: unknown): void {
  const type = typeof value;
  if (type !== "number" || Number.isNaN(value)) {
    throw new Error(
      `Assertion failed: received type ${type === "number" ? "NaN" : type} but expected a number`,
    );
  }
  // Cast after the typeof guard — TS won't narrow 'unknown' for comparisons
  if ((value as number) < 0) {
    throw new Error(
      `Assertion failed: received ${value} but expected a non-negative number (>= 0)`,
    );
  }
}
