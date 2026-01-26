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

/**
 * Apply CSS classes to markdown HTML elements
 * @param container The container element with rendered markdown HTML
 */
export function applyMarkdownClasses(container: HTMLElement) {
  // Headers
  container
    .querySelectorAll('h1')
    .forEach((el) => el.classList.add('markdown_h1'));
  container
    .querySelectorAll('h2')
    .forEach((el) => el.classList.add('markdown_h2'));
  container
    .querySelectorAll('h3')
    .forEach((el) => el.classList.add('markdown_h3'));
  container
    .querySelectorAll('h4')
    .forEach((el) => el.classList.add('markdown_h4'));
  container
    .querySelectorAll('h5')
    .forEach((el) => el.classList.add('markdown_h5'));
  container
    .querySelectorAll('h6')
    .forEach((el) => el.classList.add('markdown_h6'));

  // Paragraphs
  container
    .querySelectorAll('p')
    .forEach((el) => el.classList.add('markdown_p'));

  // Links
  container
    .querySelectorAll('a')
    .forEach((el) => el.classList.add('markdown_a'));

  // Code (inline and blocks)
  container
    .querySelectorAll('pre')
    .forEach((el) => el.classList.add('markdown_pre'));
  container
    .querySelectorAll('code')
    .forEach((el) => el.classList.add('markdown_code'));

  // Blockquotes
  container
    .querySelectorAll('blockquote')
    .forEach((el) => el.classList.add('markdown_blockquote'));

  // Lists
  container
    .querySelectorAll('ul')
    .forEach((el) => el.classList.add('markdown_ul'));
  container
    .querySelectorAll('ol')
    .forEach((el) => el.classList.add('markdown_ol'));
  container
    .querySelectorAll('li')
    .forEach((el) => el.classList.add('markdown_li'));

  // Tables
  container
    .querySelectorAll('table')
    .forEach((el) => el.classList.add('markdown_table'));
  container
    .querySelectorAll('thead')
    .forEach((el) => el.classList.add('markdown_thead'));
  container
    .querySelectorAll('tbody')
    .forEach((el) => el.classList.add('markdown_tbody'));
  container
    .querySelectorAll('tr')
    .forEach((el) => el.classList.add('markdown_tr'));
  container
    .querySelectorAll('th')
    .forEach((el) => el.classList.add('markdown_th'));
  container
    .querySelectorAll('td')
    .forEach((el) => el.classList.add('markdown_td'));

  // Horizontal rules
  container
    .querySelectorAll('hr')
    .forEach((el) => el.classList.add('markdown_hr'));

  // Images
  container
    .querySelectorAll('img')
    .forEach((el) => el.classList.add('markdown_img'));

  // Text formatting
  container
    .querySelectorAll('strong')
    .forEach((el) => el.classList.add('markdown_strong'));
  container
    .querySelectorAll('em')
    .forEach((el) => el.classList.add('markdown_em'));
}
