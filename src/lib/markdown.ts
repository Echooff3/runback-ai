import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked options
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
});

/**
 * Renders markdown content to sanitized HTML
 * @param content - The markdown string to render
 * @returns Sanitized HTML string, or escaped plain text on error
 */
export function renderMarkdown(content: string): string {
  try {
    // Parse markdown to HTML (synchronous)
    const rawHtml = marked.parse(content) as string;
    
    // Sanitize the HTML to prevent XSS attacks
    const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'del',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'blockquote', 'pre', 'code',
        'a', 'hr',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'span', 'div'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    });

    return sanitizedHtml;
  } catch (error) {
    console.error('Failed to render markdown:', error);
    // Fallback to escaped plain text
    return DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }
}
