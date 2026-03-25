/**
 * Assert a value is an array
 * @param value The value to assert as an array
 * @throws Error if the value isn't an array
 */
export function assertArray(value: any): void {
  if (!Array.isArray(value)) {
    throw new TypeError(
      `Assertion failed: received type ${typeof value} but expected an array`,
    );
  }
}

/**
 * Assert a value is a non-empty string
 * @param value The value to assert as a string
 * @throws Error if the type isn't a string
 */
export function assertString(value: any): void {
  const type = typeof value;
  if (type !== "string" || value?.length === 0) {
    throw new TypeError(
      `Assertion failed: received type ${type} but expected a non-empty string for value`,
    );
  }
}

/**
 * Assert a value is a non-empty array of strings
 * @param value The value to assert as a string array
 * @throws Error if the value isn't a string array or is empty
 */
export function assertStringArray(value: any): void {
  assertArray(value);

  if (value.length === 0) {
    throw new TypeError(
      `Assertion failed: received an empty array but expected a non-empty string array`,
    );
  }

  const nonStringIndex = value.findIndex(
    (item: any) => typeof item !== "string",
  );
  if (nonStringIndex !== -1) {
    const item = value[nonStringIndex];
    throw new TypeError(
      `Assertion failed: array item at index ${nonStringIndex} has type ${typeof item} but expected string`,
    );
  }
}

/**
 * Assert a value is a non-null object (not an array, not a primitive)
 * @param value The value to assert as an object
 * @throws Error if the value isn't an object, is null, or is an array
 */
export function assertObject(value: any): void {
  const type = typeof value;

  if (type !== "object" || value === null || Array.isArray(value)) {
    const actualType =
      value === null ? "null" : Array.isArray(value) ? "array" : type;
    throw new TypeError(
      `Assertion failed: received type ${actualType} but expected a non-null object`,
    );
  }
}
