import { languageId } from "../../../../gen/type";

/**
 *
 * @param extension
 * @returns language id if it supported
 */
export function getLanguageId(extension: string): languageId | null {
  switch (extension.toLowerCase().trim()) {
    case ".go":
      return "go";

    default:
      return null;
  }
}
