
import { useEffect, useRef } from 'react';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

// --- Turndown Configuration ---

const turndownService = new TurndownService({
  headingStyle: 'atx', // Use # for headings
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
});

turndownService.use(gfm);

// Ensure <br> tags are kept so our rule can process them
turndownService.keep(['br']);

// Add a general rule for <br> tags
turndownService.addRule('hardBreak', {
  filter: 'br',
  replacement: () => '  <br> ',
});

// Rule for H1: <div class="main-title-container">...</div> -> # ...
turndownService.addRule('main-title', {
  filter: (node) => node.nodeName === 'DIV' && node.className === 'main-title-container',
  replacement: (content) => `\n\n# ${content.trim()}\n\n`,
});

// Rule for H2: <div class="section-header">...</div> -> ## ...
turndownService.addRule('section-header', {
  filter: (node) => node.nodeName === 'DIV' && node.className === 'section-header',
  replacement: (content) => `\n\n## ${content.trim()}\n\n`,
});

// Rule for Session Moment: <div class="session-moment">...</div> -> ### ...
turndownService.addRule('session-moment', {
    filter: (node) => node.nodeName === 'DIV' && node.className === 'session-moment',
    replacement: (content, node) => {
        const h3 = node.querySelector('.moment-header h3');
        const span = node.querySelector('.moment-header span');
        const momentContent = node.querySelector('.moment-content');
        
        let markdown = `\n\n### ${h3 ? h3.innerHTML.trim() : ''}\n\n`;
        if (span) {
            markdown += `*${span.innerHTML.trim()}*\n`;
        }
        if (momentContent) {
            // Directly convert the innerHTML of the content div to preserve its structure
            let momentMarkdown = turndownService.turndown(momentContent.innerHTML);
            markdown += momentMarkdown;
        }
        // Trim only the entire result to avoid unwanted outer whitespace
        return `${markdown.trim()}\n\n`;
    },
});


// Rule for Blockquote: <div class="task-home">...</div> -> > ...
turndownService.addRule('task-home', {
    filter: (node) => node.nodeName === 'DIV' && node.className === 'task-home',
    replacement: (content) => {
        // Use the already-converted content, which preserves the <br> tags as newlines.
        // Trim whitespace from the beginning and end of the content block.
        const trimmedContent = content.trim();
        
        // Prepend '> ' to each line to format as a blockquote.
        const blockquotedContent = trimmedContent.replace(/^/gm, '> ');
        
        return `\n\n${blockquotedContent}\n\n`;
    }
});

// Rule for Info Section: <div class="info-section">...</div> -> **...**
// turndownService.addRule('info-section', {
//     filter: (node) => node.nodeName === 'DIV' && node.classList.contains('info-section'),
//     replacement: (content, node) => {
//         const lines = [];
//         node.querySelectorAll('p').forEach(p => {
//             const strong = p.querySelector('strong');
//             const span = p.querySelector('span');
//             if (strong && span) {
//                 // Recursively call turndown on the content of the span
//                 const spanMarkdown = turndownService.turndown(span.innerHTML);
//                 lines.push(`**${strong.innerHTML.replace(':','').trim()}:** ${spanMarkdown}`);
//             }
//         });
//         // Join lines with a newline, preserving internal formatting
//         return `\n\n${lines.join('\n')}\n\n`;
//     },
// });

// Rule for footer section: <div class="signatures">...</div> -> **<Firmas />**
turndownService.addRule('footer-section', {
    filter: (node) => node.nodeName === 'FOOTER' && node.classList.contains('signatures'),
    replacement: (content, node) => {
        return `\n\n<FIRMAS />\n\n`;
    },
});


// Disable escaping of markdown characters like '-'
turndownService.escape = (str) => str;


// --- React Component ---

export default function Preview({ html, onHtmlChange, lastChangedBy }) {
  const previewRef = useRef(null);

  useEffect(() => {
    if (lastChangedBy === 'editor' && previewRef.current && html !== previewRef.current.innerHTML) {
      previewRef.current.innerHTML = html;
    }
  }, [html, lastChangedBy]);

  const handleInput = () => {
    if (previewRef.current) {
      const newHtml = previewRef.current.innerHTML;
      const markdown = turndownService.turndown(newHtml);
      onHtmlChange(markdown);
    }
  };

  return (
    <div
      ref={previewRef}
      contentEditable
      onInput={handleInput}
      className="flex-grow p-4 border-2 border-dashed border-gray-200 rounded-lg overflow-auto session-preview"
    />
  );
}
