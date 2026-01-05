import { marked } from 'marked';

/**
 * Check if a file path / file is a markdown file
 * @param filePath The file name or file path
 * @returns If the string is a markdown file
 */
export function isMarkdownFile(filePath: string): boolean {
  return filePath.indexOf('.md') > 0;
}

/**
 * Converts markdown into html
 * @param content The markdown content
 */
export async function markdownToHtml(content: string) {
  return await marked.parse(content);
}
